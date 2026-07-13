import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { visiblePieces } from './toppingPlacement';
import { TOPPING_ART } from './toppingArt';
import styles from './pizzaCanvas.module.css';

const CENTER = 160;
const MAX_DRAG_RADIUS = 122; // stay inside the cheese, never spill onto bare crust
const MIN_PIECE_SPACING = 15; // dragged pieces can't be dropped on/inside a neighbor

// Whole-pizza visual scale per crust size. Distinct from the topping *count*
// factor — this is how big the pie looks; the spring makes size changes glide.
const PIZZA_SCALE = { small: 0.84, medium: 0.93, large: 1.0 };

const CRUST_STYLE = {
  thin: { outerR: 142, innerR: 132, stuffed: false },
  'hand-tossed': { outerR: 150, innerR: 134, stuffed: false },
  stuffed: { outerR: 154, innerR: 130, stuffed: true },
};

// Real chains offer a binary Normal/Well Done bake choice, not a 3-tier scale.
const BAKE_LEVEL = {
  normal: { from: '#f0c682', mid: '#d49a4e', to: '#b97a32', chars: 4 },
  'well-done': { from: '#dba861', mid: '#a96f35', to: '#7c4f22', chars: 11 },
};

// Maps each sauce to the gradient key it uses in the SVG defs.
// Robust Tomato and Marinara are now distinct: Robust Tomato is a deep,
// thick, hearty red; Marinara is a lighter, brighter, more acidic orange-red.
const SAUCE_GRADIENT_KEY = {
  'robust-tomato': 'sauceRed',
  marinara:        'sauceMarinara',
  'garlic-parmesan': 'sauceWhite',
  alfredo:         'sauceWhite',
  bbq:             'sauceBbq',
};

const layerTransition = { duration: 0.35, ease: 'easeOut' };
const pieceTransition = { type: 'spring', stiffness: 360, damping: 20 };

// Deterministic char-spot / stuffed-crust-ring positions, seeded so they don't
// jitter on re-render. Plain LCG — we just need a handful of stable points.
function seededPoints(count, seed) {
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * 2 * Math.PI + next() * 0.4,
    jitter: next(),
  }));
}
const CHAR_SLOTS = seededPoints(12, 9173);
const STUFFED_SLOTS = seededPoints(18, 4421);

// ---------------------------------------------------------------------------
// Slice animation — cuts the pizza into wedges that pull apart radially and
// come back together. Used for the one-shot "order placed" cut (sliceMode
// 'once') and the looping showpiece on the checkout page (sliceMode 'loop').
// sliceMode 'none' (the default) renders the pizza exactly as it always has —
// none of this code runs, so every other screen that uses PizzaCanvas
// (presets, order history, the confirmation modal, the builder at rest) is
// untouched.

// How many wedges a real pizza gets cut into, by size — matches how an actual
// pizza is scored before serving.
export const SLICE_COUNTS = { small: 4, medium: 6, large: 8 };

// How far each wedge slides outward from center when "sliced apart", in the
// same px units as CENTER/crust radius below. The canvas has overflow:visible
// (pizzaCanvas.module.css), so this has room to breathe past the crust edge.
const EXPLODE_DISTANCE = 22;

const wedgeTransition = { type: 'spring', stiffness: 170, damping: 20 };

// Timing for sliceMode 'once': a short beat before the cut starts (so it reads
// as a deliberate action, not a glitch), then the spring settles into the
// sliced-apart pose and holds there until the caller navigates away.
const ONCE_DELAY_MS = 150;
// Exported so callers (OrderButton) can time navigation to happen once the cut
// has actually had time to play, instead of guessing a duration that could
// drift out of sync with the animation defined here.
export const SLICE_ONCE_NAV_DELAY_MS = 950;

// Timing for sliceMode 'loop': how long the pizza rests whole vs. sliced apart
// on each cycle.
const LOOP_ASSEMBLED_MS = 1600;
const LOOP_SLICED_MS = 950;

// One pie-sector path per wedge, apex at CENTER, running out to `radius`.
// Index 0 starts at 12 o'clock so the cuts read as a normal pizza score line.
function wedgeSectorPath(index, count, radius) {
  const anglePerWedge = (2 * Math.PI) / count;
  const start = index * anglePerWedge - Math.PI / 2;
  const end = start + anglePerWedge;
  const x1 = CENTER + radius * Math.cos(start);
  const y1 = CENTER + radius * Math.sin(start);
  const x2 = CENTER + radius * Math.cos(end);
  const y2 = CENTER + radius * Math.sin(end);
  // Every wedge here is <= 90° (count is always >= 4), so the large-arc flag
  // is always 0 — kept as a real computation anyway rather than a hardcoded
  // 0, in case SLICE_COUNTS ever gains a 2- or 3-slice option.
  const largeArc = anglePerWedge > Math.PI ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// The outward offset for a wedge's own explode direction — along its angular
// midpoint (bisector), so it slides straight out from the pizza's center
// rather than drifting sideways.
function wedgeOffset(index, count, distance) {
  const anglePerWedge = (2 * Math.PI) / count;
  const mid = index * anglePerWedge - Math.PI / 2 + anglePerWedge / 2;
  return { x: Math.cos(mid) * distance, y: Math.sin(mid) * distance };
}

// Does a topping piece overlap this wedge's angular sector at all (not just:
// is its centre inside it)? A piece is a disc of `radius` sitting `dist` from
// the middle of the pizza, so it spans an angular half-width of
// asin(radius / dist) either side of its own bearing. A piece sitting over the
// very centre (dist <= radius) straddles every wedge.
//
// This is what decides whether a wedge needs to draw a given piece — and since
// a piece near a cut line overlaps BOTH neighbouring wedges, both draw it, each
// clipping away the half that isn't theirs. That's what produces a topping
// genuinely cut in two by the knife, with each half riding its own slice.
function pieceOverlapsSector(piece, start, anglePerWedge) {
  const dist = Math.hypot(piece.x, piece.y);
  if (dist <= piece.radius) return true;

  const halfWidth = Math.asin(Math.min(1, piece.radius / dist));
  const bearing = Math.atan2(piece.y, piece.x);

  // Angular distance from the piece's bearing to the sector, measured in the
  // sector's own frame and normalised to [0, 2π).
  const rel = ((bearing - start) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

  // Inside the sector outright, or close enough to spill over either end.
  if (rel < anglePerWedge) return true;
  if (rel > 2 * Math.PI - halfWidth) return true;              // spills over the start edge
  if (rel < anglePerWedge + halfWidth) return true;            // spills over the end edge
  return false;
}

// One wedge: the crust/sauce/cheese stack AND its toppings, all clipped to the
// wedge's sector so the cut goes straight through everything on the pie — which
// is what a knife actually does. Toppings are inside the clip group, not beside
// it; drawn outside it they'd hang over the gap between separating slices and
// look like they were floating in mid-air.
//
// Deliberately simplified versus the interactive render below: no char spots, no
// stuffed-crust ring, no texture filters, no drag handling — none of that reads
// at the speed this animates, and skipping it keeps 4-8 simultaneous copies
// smooth.
const SliceWedge = ({
  index,
  count,
  phase,
  clipId,
  crustStyle,
  ids,
  sauceType,
  sauceGradientId,
  cheeseLayers,
  pieces,
}) => {
  const offset = phase === 'sliced' ? wedgeOffset(index, count, EXPLODE_DISTANCE) : { x: 0, y: 0 };
  const anglePerWedge = (2 * Math.PI) / count;
  const start = index * anglePerWedge - Math.PI / 2;

  // Only the pieces this wedge could actually show. Without this filter every
  // wedge would draw every topping (pieces × wedges image nodes) and lean on the
  // clip to hide the rest — correct, but needlessly heavy.
  const wedgePieces = pieces.filter((piece) => pieceOverlapsSector(piece, start, anglePerWedge));

  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={{ x: offset.x, y: offset.y }}
      transition={wedgeTransition}
    >
      <g clipPath={`url(#${clipId})`}>
        <circle cx={CENTER} cy={CENTER} r={crustStyle.outerR} fill={`url(#${ids.crust})`} />
        <circle cx={CENTER} cy={CENTER} r={crustStyle.innerR} fill={`url(#${ids.crustInner})`} />
        {sauceType && sauceType !== 'none' && (
          <circle cx={CENTER} cy={CENTER} r={crustStyle.innerR - 4} fill={`url(#${sauceGradientId})`} />
        )}
        {cheeseLayers.map((layer, i) =>
          layer.on ? (
            <circle
              key={layer.key}
              cx={CENTER}
              cy={CENTER}
              r={crustStyle.innerR - 8 - i * 2}
              fill={`url(#${layer.gradientId})`}
              opacity={layer.opacity}
            />
          ) : null
        )}

        {wedgePieces.map((piece) => (
          <g key={piece.id} transform={`translate(${piece.x + CENTER} ${piece.y + CENTER}) rotate(${piece.rotate})`}>
            <ToppingShape type={piece.type} r={piece.radius} />
          </g>
        ))}
      </g>
    </motion.g>
  );
};

// A topping piece is the real photo from the art registry, sized to the
// piece's own radius (which varies per piece for a natural, non-uniform look).
const ToppingShape = ({ type, r }) => {
  const art = TOPPING_ART[type];
  if (!art) return null;
  return (
    <image
      href={art.image}
      x={-r}
      y={-r}
      width={r * 2}
      height={r * 2}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

const ToppingPiece = ({ piece, pos, editable, onPointerDown, dragging }) => (
  <g
    transform={`translate(${pos.x + CENTER} ${pos.y + CENTER}) rotate(${piece.rotate})`}
    onPointerDown={editable ? (e) => onPointerDown(e, piece.id) : undefined}
    className={editable ? styles.piece : undefined}
    style={editable ? { cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' } : undefined}
  >
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: dragging ? 1.12 : 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={pieceTransition}
    >
      <ToppingShape type={piece.type} r={piece.radius} />
    </motion.g>
  </g>
);

const Layer = ({ r, fill, opacity = 1, filter }) => (
  <motion.circle
    cx={CENTER}
    cy={CENTER}
    r={r}
    fill={fill}
    filter={filter}
    initial={{ opacity: 0 }}
    animate={{ opacity }}
    exit={{ opacity: 0 }}
    transition={layerTransition}
  />
);

const PizzaCanvas = ({
  base: baseProp,
  toppings: toppingsProp,
  size: sizeProp,
  crustStyle: crustStyleProp,
  bakeLevel: bakeLevelProp,
  idle = false,
  textured = true,
  editable = false,
  // 'none' (default, unchanged behavior) | 'once' (cut apart and hold — the
  // order-placed transition) | 'loop' (cut apart / reassemble forever — the
  // checkout showpiece).
  sliceMode = 'none',
}) => {
  const liveBase = useSelector((s) => s.pizzaHub.base);
  const liveToppings = useSelector((s) => s.pizzaHub.toppings);
  const liveSize = useSelector((s) => s.pizza.size);
  const liveCrustStyle = useSelector((s) => s.pizza.crustStyle);
  const liveBakeLevel = useSelector((s) => s.pizza.bakeLevel);

  // 'assembled' | 'sliced'. A single self-scheduling effect drives both the
  // one-shot cut and the endless loop — see the timing constants above.
  const [phase, setPhase] = useState('assembled');
  useEffect(() => {
    let cancelled = false;
    let timer;

    if (sliceMode === 'once') {
      setPhase('assembled');
      timer = setTimeout(() => {
        if (!cancelled) setPhase('sliced');
      }, ONCE_DELAY_MS);
    } else if (sliceMode === 'loop') {
      const tick = (next) => {
        if (cancelled) return;
        setPhase(next);
        const holdMs = next === 'assembled' ? LOOP_ASSEMBLED_MS : LOOP_SLICED_MS;
        timer = setTimeout(() => tick(next === 'assembled' ? 'sliced' : 'assembled'), holdMs);
      };
      tick('assembled');
    } else {
      setPhase('assembled');
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sliceMode]);

  // Unique per instance so multiple pizzas on screen don't share SVG IDs.
  const raw = useId().replace(/:/g, '');
  const ids = {
    crust: `${raw}-crust`,
    crustInner: `${raw}-crustInner`,
    sauceRed:      `${raw}-sauceRed`,
    sauceMarinara: `${raw}-sauceMarinara`,
    sauceWhite:    `${raw}-sauceWhite`,
    sauceBbq:      `${raw}-sauceBbq`,
    mozzarella:     `${raw}-mozzarella`,
    cheddar:        `${raw}-cheddar`,
    parmesanAsiago: `${raw}-parmesanAsiago`,
    feta:           `${raw}-feta`,
    ricotta:        `${raw}-ricotta`,
    veganCheese:    `${raw}-veganCheese`,
    shadow: `${raw}-shadow`,
    crustTex: `${raw}-crustTex`,
    sauceTex: `${raw}-sauceTex`,
    cheeseTex: `${raw}-cheeseTex`,
    toppingShadow: `${raw}-toppingShadow`,
  };

  const base = baseProp ?? liveBase;
  const toppings = toppingsProp ?? liveToppings;
  const size = sizeProp ?? liveSize;
  const crustStyle = CRUST_STYLE[crustStyleProp ?? liveCrustStyle] ?? CRUST_STYLE['hand-tossed'];
  const bakeLevel = BAKE_LEVEL[bakeLevelProp ?? liveBakeLevel] ?? BAKE_LEVEL.normal;

  const pieces = visiblePieces(toppings, size);
  const scale = PIZZA_SCALE[size] ?? PIZZA_SCALE.medium;

  const sauceType = base?.sauce?.sauceType;
  const sauceGradientId = ids[SAUCE_GRADIENT_KEY[sauceType]] ?? ids.sauceRed;

  // Each cheese that's checked gets its own layer, 2px smaller per step so
  // the edge of every layer peeks out and the stack reads as genuinely layered.
  // Colors are intentionally distinct so cheeses are identifiable at a glance.
  const cheeseLayers = [
    { key: 'mozzarella',     on: base?.mozzarella?.checked,     gradientId: ids.mozzarella,     opacity: 1    },
    { key: 'cheddar',        on: base?.cheddar?.checked,        gradientId: ids.cheddar,        opacity: 0.96 },
    { key: 'parmesanAsiago', on: base?.parmesanAsiago?.checked, gradientId: ids.parmesanAsiago, opacity: 0.93 },
    { key: 'feta',           on: base?.feta?.checked,           gradientId: ids.feta,           opacity: 0.90 },
    { key: 'ricotta',        on: base?.ricotta?.checked,        gradientId: ids.ricotta,        opacity: 0.88 },
    { key: 'veganCheese',    on: base?.veganCheese?.checked,    gradientId: ids.veganCheese,    opacity: 0.94 },
  ];

  // --- Drag-to-nudge (editable mode only) -----------------------------
  // Positions are computed via the topping layer's own getScreenCTM(), so the
  // conversion from pointer/touch coordinates is correct regardless of the
  // SVG's viewBox-vs-display scale or the size-based zoom — no drift, no
  // mismatch between where you grab and where the piece actually moves.
  const layerRef = useRef(null);
  const [overrides, setOverrides] = useState({});
  const [draggingId, setDraggingId] = useState(null);

  // handleMove only gets recreated when draggingId changes, so it can't read
  // fresh `overrides` state directly mid-drag without going stale — keep a
  // ref in sync instead.
  const overridesRef = useRef(overrides);
  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  const clientToLocal = (clientX, clientY) => {
    const g = layerRef.current;
    if (!g || !g.ownerSVGElement) return null;
    const ctm = g.getScreenCTM();
    if (!ctm) return null;
    const pt = g.ownerSVGElement.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x - CENTER, y: local.y - CENTER };
  };

  // Keeps a dragged piece from being dropped on top of / inside a neighbor —
  // a hand-placed pizza should still look like a real one, not a stack.
  const resolveSpacing = (candidate, excludeId) => {
    let { x, y } = candidate;
    for (const piece of pieces) {
      if (piece.id === excludeId) continue;
      const other = overridesRef.current[piece.id] ?? piece;
      const dx = x - other.x;
      const dy = y - other.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_PIECE_SPACING) {
        if (dist > 0.001) {
          const scale = MIN_PIECE_SPACING / dist;
          x = other.x + dx * scale;
          y = other.y + dy * scale;
        } else {
          x = other.x + MIN_PIECE_SPACING;
          y = other.y;
        }
      }
    }
    return { x, y };
  };

  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (e) => {
      const local = clientToLocal(e.clientX, e.clientY);
      if (!local) return;
      const dist = Math.hypot(local.x, local.y);
      const clamped = dist > MAX_DRAG_RADIUS
        ? { x: (local.x / dist) * MAX_DRAG_RADIUS, y: (local.y / dist) * MAX_DRAG_RADIUS }
        : local;
      const spaced = resolveSpacing(clamped, draggingId);
      setOverrides((prev) => ({ ...prev, [draggingId]: spaced }));
    };
    const handleUp = () => setDraggingId(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [draggingId]);

  const handlePointerDown = (e, pieceId) => {
    e.preventDefault();
    setDraggingId(pieceId);
  };

  const crustTex = textured ? `url(#${ids.crustTex})` : undefined;
  const sauceTex = textured ? `url(#${ids.sauceTex})` : undefined;
  const cheeseTex = textured ? `url(#${ids.cheeseTex})` : undefined;

  const isSlicingMode = sliceMode !== 'none';
  const wedgeCount = SLICE_COUNTS[size] ?? SLICE_COUNTS.medium;
  const wedgeClipId = (i) => `${ids.crust}-wedge-${i}`;
  const wedgeClipRadius = crustStyle.outerR + 6; // a hair past the rim so the shadow/edge isn't clipped
  // 'loop' keeps the pizza gently turning the whole time, same mechanism the
  // idle demo pie already used — a slice/reassemble cycle with no rotation
  // reads as mechanical; a slow constant turn is what makes it feel alive.
  const shouldAutoRotate = idle || sliceMode === 'loop';

  return (
    <div className={styles.wrap}>
      <svg viewBox="0 0 320 320" className={styles.canvas} role="img" aria-label="Live pizza preview">
        <defs>
          <radialGradient id={ids.crust} cx="42%" cy="38%" r="75%">
            <stop offset="0%" stopColor={bakeLevel.from} />
            <stop offset="70%" stopColor={bakeLevel.mid} />
            <stop offset="100%" stopColor={bakeLevel.to} />
          </radialGradient>
          <radialGradient id={ids.crustInner} cx="44%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#f5d49a" />
            <stop offset="100%" stopColor="#e7b063" />
          </radialGradient>

          {/* Robust Tomato — thick, deep, hearty red */}
          <radialGradient id={ids.sauceRed} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#bf3018" />
            <stop offset="100%" stopColor="#7e1a08" />
          </radialGradient>
          {/* Marinara — bright, fresh, slightly orange-red */}
          <radialGradient id={ids.sauceMarinara} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#e8602e" />
            <stop offset="100%" stopColor="#c03e18" />
          </radialGradient>
          {/* Garlic Parmesan / Alfredo */}
          <radialGradient id={ids.sauceWhite} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#f5ecd7" />
            <stop offset="100%" stopColor="#dcc899" />
          </radialGradient>
          {/* BBQ */}
          <radialGradient id={ids.sauceBbq} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#8a4a1f" />
            <stop offset="100%" stopColor="#5c2f10" />
          </radialGradient>

          {/* Mozzarella — classic warm cream white */}
          <radialGradient id={ids.mozzarella} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f9f4e4" />
            <stop offset="100%" stopColor="#e8d9bc" />
          </radialGradient>
          {/* Cheddar — bold melted orange, unmistakable */}
          <radialGradient id={ids.cheddar} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f08020" />
            <stop offset="100%" stopColor="#d46010" />
          </radialGradient>
          {/* Parmesan/Asiago — amber gold, baked & nutty */}
          <radialGradient id={ids.parmesanAsiago} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#e8c060" />
            <stop offset="100%" stopColor="#c09030" />
          </radialGradient>
          {/* Feta — cool bright white, crumbly feel */}
          <radialGradient id={ids.feta} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#fefdf8" />
            <stop offset="100%" stopColor="#eeeadc" />
          </radialGradient>
          {/* Ricotta — thick warm cream dollops */}
          <radialGradient id={ids.ricotta} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#fdf8ee" />
            <stop offset="100%" stopColor="#ece0c8" />
          </radialGradient>
          {/* Vegan Cheese — vivid turmeric yellow */}
          <radialGradient id={ids.veganCheese} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f5cc50" />
            <stop offset="100%" stopColor="#d4a030" />
          </radialGradient>


          <filter id={ids.shadow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.35" />
          </filter>

          {textured && (
            <>
              {/* Bumpy, irregular crust rim */}
              <filter id={ids.crustTex}>
                <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="11" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
              </filter>

              {/* Hand-spread sauce edge + darker patches */}
              <filter id={ids.sauceTex} x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="7" result="disp" />
                <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" result="n2" />
                <feColorMatrix
                  in="n2"
                  type="matrix"
                  values="0 0 0 0 0.34  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 0.55 0"
                  result="patch"
                />
                <feComposite in="patch" in2="disp" operator="in" result="patchMasked" />
                <feMerge>
                  <feMergeNode in="disp" />
                  <feMergeNode in="patchMasked" />
                </feMerge>
              </filter>

              {/* Mottled, melty cheese with browned spots */}
              <filter id={ids.cheeseTex} x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="2" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="disp" />
                <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="9" result="n2" />
                <feColorMatrix
                  in="n2"
                  type="matrix"
                  values="0 0 0 0 0.78  0 0 0 0 0.5  0 0 0 0 0.13  0 0 0 0.38 0"
                  result="spots"
                />
                <feComposite in="spots" in2="disp" operator="in" result="spotsMasked" />
                <feMerge>
                  <feMergeNode in="disp" />
                  <feMergeNode in="spotsMasked" />
                </feMerge>
              </filter>
            </>
          )}

          {/* Soft per-piece shadow so toppings sit on the cheese with depth */}
          <filter id={ids.toppingShadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#000" floodOpacity="0.4" />
          </filter>

          {isSlicingMode &&
            Array.from({ length: wedgeCount }, (_, i) => (
              <clipPath key={i} id={wedgeClipId(i)}>
                <path d={wedgeSectorPath(i, wedgeCount, wedgeClipRadius)} />
              </clipPath>
            ))}
        </defs>

        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={{ scale, rotate: shouldAutoRotate ? 360 : 0 }}
          transition={
            shouldAutoRotate
              ? {
                  rotate: { repeat: Infinity, ease: 'linear', duration: 60 },
                  scale: { type: 'spring', stiffness: 120, damping: 24 },
                }
              : { scale: { type: 'spring', stiffness: 120, damping: 24 } }
          }
        >
          {isSlicingMode ? (
            // Sliced view: the same pizza, cut into wedges that pull apart and
            // reassemble. See SliceWedge above for why this is a deliberately
            // simplified render rather than reusing the interactive content
            // below (no drag handlers make sense on a pizza that's mid-cut).
            Array.from({ length: wedgeCount }, (_, i) => (
              <SliceWedge
                key={i}
                index={i}
                count={wedgeCount}
                phase={phase}
                clipId={wedgeClipId(i)}
                crustStyle={crustStyle}
                ids={ids}
                sauceType={sauceType}
                sauceGradientId={sauceGradientId}
                cheeseLayers={cheeseLayers}
                pieces={pieces}
              />
            ))
          ) : (
            <>
              {/* Crust */}
              <circle cx={CENTER} cy={CENTER} r={crustStyle.outerR} fill={`url(#${ids.crust})`} filter={`url(#${ids.shadow})`} />

              {/* Char spots scattered along the rim, density tied to bake level */}
              {bakeLevel.chars > 0 &&
                CHAR_SLOTS.slice(0, bakeLevel.chars).map((slot, i) => {
                  const rim = (crustStyle.outerR + crustStyle.innerR) / 2;
                  const cx = CENTER + Math.cos(slot.angle) * rim;
                  const cy = CENTER + Math.sin(slot.angle) * rim;
                  return (
                    <ellipse
                      key={i}
                      cx={cx}
                      cy={cy}
                      rx={2 + slot.jitter * 2}
                      ry={1.4 + slot.jitter * 1.4}
                      fill="rgba(70, 38, 16, 0.55)"
                      transform={`rotate(${slot.angle * (180 / Math.PI)} ${cx} ${cy})`}
                    />
                  );
                })}

              {/* Stuffed-crust cheese ring peeking from the rim */}
              {crustStyle.stuffed &&
                STUFFED_SLOTS.map((slot, i) => {
                  const rim = (crustStyle.outerR + crustStyle.innerR) / 2 + 1;
                  const cx = CENTER + Math.cos(slot.angle) * rim;
                  const cy = CENTER + Math.sin(slot.angle) * rim;
                  return <circle key={i} cx={cx} cy={cy} r={4 + slot.jitter * 1.5} fill="#ffdf8a" stroke="#e8b94f" strokeWidth="0.6" />;
                })}

              <circle cx={CENTER} cy={CENTER} r={crustStyle.innerR} fill={`url(#${ids.crustInner})`} filter={crustTex} />

              {/* Base layers fade in/out as sauce/cheese are toggled */}
              <AnimatePresence>
                {sauceType && sauceType !== 'none' && (
                  <Layer key="sauce" r={crustStyle.innerR - 4} fill={`url(#${sauceGradientId})`} filter={sauceTex} />
                )}
                {cheeseLayers.map((layer, i) =>
                  layer.on ? (
                    <Layer
                      key={layer.key}
                      r={crustStyle.innerR - 8 - i * 2}
                      fill={`url(#${layer.gradientId})`}
                      opacity={layer.opacity}
                      filter={cheeseTex}
                    />
                  ) : null
                )}
              </AnimatePresence>

              {/* Toppings, splattered, each with a soft shadow. Drag any piece to
                  nudge it exactly where you want (editable / builder mode only). */}
              <g ref={layerRef} filter={`url(#${ids.toppingShadow})`}>
                <AnimatePresence>
                  {pieces.map((piece) => {
                    const pos = overrides[piece.id] ?? piece;
                    return (
                      <ToppingPiece
                        key={piece.id}
                        piece={piece}
                        pos={pos}
                        editable={editable}
                        onPointerDown={handlePointerDown}
                        dragging={draggingId === piece.id}
                      />
                    );
                  })}
                </AnimatePresence>
              </g>
            </>
          )}
        </motion.g>
      </svg>
    </div>
  );
};

export default PizzaCanvas;
