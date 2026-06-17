import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { visiblePieces } from './toppingPlacement';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';
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

// Sauces render in one of three color families — Tomato/Marinara are both
// "red" (real pizzas don't look visually different between them either),
// Garlic Parmesan/Alfredo are a white/cream base, BBQ a deep brown.
const SAUCE_COLOR_GROUP = {
  'robust-tomato': 'red',
  marinara: 'red',
  'garlic-parmesan': 'white',
  alfredo: 'white',
  bbq: 'bbq',
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

// Topping artwork comes from the art registry, keyed by topping id, drawn
// proportional to the piece's own radius so sizes vary. `gradId` is this
// canvas's unique gradient id for the topping (or undefined for flat fills).
const ToppingShape = ({ type, r, gradId }) => {
  const art = TOPPING_ART[type];
  return art ? art.shape(r, gradId) : null;
};

const ToppingPiece = ({ piece, pos, gradId, editable, onPointerDown, dragging }) => (
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
      <ToppingShape type={piece.type} r={piece.radius} gradId={gradId} />
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
}) => {
  const liveBase = useSelector((s) => s.pizzaHub.base);
  const liveToppings = useSelector((s) => s.pizzaHub.toppings);
  const liveSize = useSelector((s) => s.pizza.size);
  const liveCrustStyle = useSelector((s) => s.pizza.crustStyle);
  const liveBakeLevel = useSelector((s) => s.pizza.bakeLevel);

  // Unique per instance so multiple pizzas on screen don't share SVG IDs.
  const raw = useId().replace(/:/g, '');
  const ids = {
    crust: `${raw}-crust`,
    crustInner: `${raw}-crustInner`,
    sauceRed: `${raw}-sauceRed`,
    sauceWhite: `${raw}-sauceWhite`,
    sauceBbq: `${raw}-sauceBbq`,
    mozzarella: `${raw}-mozzarella`,
    provolone: `${raw}-provolone`,
    feta: `${raw}-feta`,
    veganCheese: `${raw}-veganCheese`,
    shadow: `${raw}-shadow`,
    crustTex: `${raw}-crustTex`,
    sauceTex: `${raw}-sauceTex`,
    cheeseTex: `${raw}-cheeseTex`,
    toppingShadow: `${raw}-toppingShadow`,
  };
  // Per-topping gradient ids minted from the catalog, so the <defs> below and
  // the shapes stay in lockstep with no hardcoded per-topping entries.
  const toppingGrad = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, `${raw}-top-${t.id}`]));

  const base = baseProp ?? liveBase;
  const toppings = toppingsProp ?? liveToppings;
  const size = sizeProp ?? liveSize;
  const crustStyle = CRUST_STYLE[crustStyleProp ?? liveCrustStyle] ?? CRUST_STYLE['hand-tossed'];
  const bakeLevel = BAKE_LEVEL[bakeLevelProp ?? liveBakeLevel] ?? BAKE_LEVEL.normal;

  const pieces = visiblePieces(toppings, size);
  const scale = PIZZA_SCALE[size] ?? PIZZA_SCALE.medium;

  const sauceType = base?.sauce?.sauceType;
  const sauceGroup = SAUCE_COLOR_GROUP[sauceType];
  const sauceGradientId = sauceGroup === 'white' ? ids.sauceWhite : sauceGroup === 'bbq' ? ids.sauceBbq : ids.sauceRed;

  // Each cheese type that's checked gets its own translucent layer, slightly
  // inset from the last so they read as stacked rather than overlapping flat.
  const cheeseLayers = [
    { key: 'mozzarella', on: base?.mozzarella?.checked, gradientId: ids.mozzarella, opacity: 1 },
    { key: 'provolone', on: base?.provolone?.checked, gradientId: ids.provolone, opacity: 0.94 },
    { key: 'feta', on: base?.feta?.checked, gradientId: ids.feta, opacity: 0.9 },
    { key: 'veganCheese', on: base?.veganCheese?.checked, gradientId: ids.veganCheese, opacity: 0.92 },
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

          {/* Robust Tomato / Marinara */}
          <radialGradient id={ids.sauceRed} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#d6452f" />
            <stop offset="100%" stopColor="#a82c1a" />
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

          <radialGradient id={ids.mozzarella} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f9f4e4" />
            <stop offset="100%" stopColor="#ebe0c4" />
          </radialGradient>
          <radialGradient id={ids.provolone} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f7c95a" />
            <stop offset="100%" stopColor="#e0a030" />
          </radialGradient>
          <radialGradient id={ids.feta} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#fbf8ee" />
            <stop offset="100%" stopColor="#e8e2c8" />
          </radialGradient>
          <radialGradient id={ids.veganCheese} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f0c875" />
            <stop offset="100%" stopColor="#d9a94a" />
          </radialGradient>

          {/* Topping gradients, one per catalog entry that declares one */}
          {TOPPING_CATALOG.map((t) =>
            TOPPING_ART[t.id].gradient ? (
              <Fragment key={t.id}>{TOPPING_ART[t.id].gradient(toppingGrad[t.id])}</Fragment>
            ) : null
          )}

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
        </defs>

        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={{ scale, rotate: idle ? 360 : 0 }}
          transition={
            idle
              ? {
                  rotate: { repeat: Infinity, ease: 'linear', duration: 60 },
                  scale: { type: 'spring', stiffness: 120, damping: 24 },
                }
              : { scale: { type: 'spring', stiffness: 120, damping: 24 } }
          }
        >
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
                    gradId={toppingGrad[piece.type]}
                    editable={editable}
                    onPointerDown={handlePointerDown}
                    dragging={draggingId === piece.id}
                  />
                );
              })}
            </AnimatePresence>
          </g>
        </motion.g>
      </svg>
    </div>
  );
};

export default PizzaCanvas;
