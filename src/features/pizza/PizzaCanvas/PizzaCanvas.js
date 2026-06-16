import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { visiblePieces } from './toppingPlacement';
import styles from './pizzaCanvas.module.css';

const CENTER = 160;
const MAX_DRAG_RADIUS = 122; // stay inside the cheese, never spill onto bare crust

// Whole-pizza visual scale per crust size. Distinct from the topping *count*
// factor — this is how big the pie looks; the spring makes size changes glide.
const PIZZA_SCALE = { regular: 0.84, medium: 0.93, large: 1.0 };

const CRUST_STYLE = {
  thin: { outerR: 142, innerR: 132, stuffed: false },
  classic: { outerR: 150, innerR: 134, stuffed: false },
  stuffed: { outerR: 154, innerR: 130, stuffed: true },
};

const BAKE_LEVEL = {
  light: { from: '#f6dca0', mid: '#e3b876', to: '#cf9c54', chars: 0 },
  golden: { from: '#f0c682', mid: '#d49a4e', to: '#b97a32', chars: 5 },
  'well-done': { from: '#dba861', mid: '#a96f35', to: '#7c4f22', chars: 11 },
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

// Topping artwork, drawn proportional to the piece's own radius so sizes vary.
const ToppingShape = ({ type, r, ids }) => {
  switch (type) {
    case 'pepperoni':
      return (
        <g>
          <circle r={r} fill={`url(#${ids.pepperoni})`} stroke="#7c1f12" strokeWidth={r * 0.07} />
          <circle cx={-r * 0.33} cy={-r * 0.22} r={r * 0.16} fill="#7c1f12" />
          <circle cx={r * 0.33} cy={r * 0.16} r={r * 0.18} fill="#7c1f12" />
          <circle cx={-r * 0.05} cy={r * 0.4} r={r * 0.13} fill="#8f2a18" />
          <circle cx={-r * 0.38} cy={-r * 0.36} r={r * 0.24} fill="rgba(255,255,255,0.18)" />
        </g>
      );
    case 'sausage':
      // A lumpy crumble rather than a clean disc.
      return (
        <g>
          <circle r={r} fill={`url(#${ids.sausage})`} stroke="#5f3d27" strokeWidth={r * 0.09} />
          <circle cx={r * 0.62} cy={-r * 0.22} r={r * 0.55} fill={`url(#${ids.sausage})`} stroke="#5f3d27" strokeWidth={r * 0.09} />
          <circle cx={-r * 0.5} cy={r * 0.46} r={r * 0.46} fill={`url(#${ids.sausage})`} stroke="#5f3d27" strokeWidth={r * 0.09} />
          <circle cx={-r * 0.22} cy={-r * 0.22} r={r * 0.18} fill="#5b3a24" />
          <circle cx={r * 0.18} cy={r * 0.12} r={r * 0.15} fill="#5b3a24" />
        </g>
      );
    case 'peppers':
      // A thin diced sliver.
      return (
        <g>
          <rect x={-r * 1.1} y={-r * 0.45} width={r * 2.2} height={r * 0.9} rx={r * 0.45} fill={`url(#${ids.pepper})`} />
          <rect x={-r * 0.95} y={-r * 0.32} width={r * 1.9} height={r * 0.22} rx={r * 0.11} fill="rgba(255,255,255,0.22)" />
        </g>
      );
    case 'olives':
      // A ring with a real hole (stroke, no fill).
      return (
        <g>
          <circle r={r * 0.82} fill="none" stroke="#2c2c2e" strokeWidth={r * 0.55} />
          <circle cx={-r * 0.28} cy={-r * 0.28} r={r * 0.16} fill="rgba(255,255,255,0.25)" />
        </g>
      );
    default:
      return null;
  }
};

const ToppingPiece = ({ piece, pos, ids, editable, onPointerDown, dragging }) => (
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
      <ToppingShape type={piece.type} r={piece.radius} ids={ids} />
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
    sauce: `${raw}-sauce`,
    mozzarella: `${raw}-mozzarella`,
    cheese: `${raw}-cheese`,
    pepperoni: `${raw}-pepperoni`,
    sausage: `${raw}-sausage`,
    pepper: `${raw}-pepper`,
    shadow: `${raw}-shadow`,
    crustTex: `${raw}-crustTex`,
    sauceTex: `${raw}-sauceTex`,
    cheeseTex: `${raw}-cheeseTex`,
    toppingShadow: `${raw}-toppingShadow`,
  };

  const base = baseProp ?? liveBase;
  const toppings = toppingsProp ?? liveToppings;
  const size = sizeProp ?? liveSize;
  const crustStyle = CRUST_STYLE[crustStyleProp ?? liveCrustStyle] ?? CRUST_STYLE.classic;
  const bakeLevel = BAKE_LEVEL[bakeLevelProp ?? liveBakeLevel] ?? BAKE_LEVEL.golden;

  const pieces = visiblePieces(toppings, size);
  const scale = PIZZA_SCALE[size] ?? PIZZA_SCALE.medium;
  const hasCheese = base?.cheese?.checked;
  const hasMozzarella = base?.mozzarella?.checked;

  // --- Drag-to-nudge (editable mode only) -----------------------------
  // Positions are computed via the topping layer's own getScreenCTM(), so the
  // conversion from pointer/touch coordinates is correct regardless of the
  // SVG's viewBox-vs-display scale or the size-based zoom — no drift, no
  // mismatch between where you grab and where the piece actually moves.
  const layerRef = useRef(null);
  const [overrides, setOverrides] = useState({});
  const [draggingId, setDraggingId] = useState(null);

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

  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (e) => {
      const local = clientToLocal(e.clientX, e.clientY);
      if (!local) return;
      const dist = Math.hypot(local.x, local.y);
      const clamped = dist > MAX_DRAG_RADIUS
        ? { x: (local.x / dist) * MAX_DRAG_RADIUS, y: (local.y / dist) * MAX_DRAG_RADIUS }
        : local;
      setOverrides((prev) => ({ ...prev, [draggingId]: clamped }));
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
          <radialGradient id={ids.sauce} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#d6452f" />
            <stop offset="100%" stopColor="#a82c1a" />
          </radialGradient>
          <radialGradient id={ids.mozzarella} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#f9f4e4" />
            <stop offset="100%" stopColor="#ebe0c4" />
          </radialGradient>
          <radialGradient id={ids.cheese} cx="45%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#ffd277" />
            <stop offset="100%" stopColor="#f3a93d" />
          </radialGradient>
          <radialGradient id={ids.pepperoni} cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#d24f3b" />
            <stop offset="100%" stopColor="#9c2b1b" />
          </radialGradient>
          <radialGradient id={ids.sausage} cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#a4704a" />
            <stop offset="100%" stopColor="#774c2f" />
          </radialGradient>
          <linearGradient id={ids.pepper} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5cbb4b" />
            <stop offset="100%" stopColor="#2f8f2a" />
          </linearGradient>

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
                  scale: { type: 'spring', stiffness: 120, damping: 18 },
                }
              : { scale: { type: 'spring', stiffness: 120, damping: 18 } }
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
            {base?.sauce?.checked && <Layer key="sauce" r={crustStyle.innerR - 4} fill={`url(#${ids.sauce})`} filter={sauceTex} />}
            {hasMozzarella && <Layer key="mozzarella" r={crustStyle.innerR - 8} fill={`url(#${ids.mozzarella})`} filter={cheeseTex} />}
            {hasCheese && <Layer key="cheese" r={crustStyle.innerR - 10} fill={`url(#${ids.cheese})`} opacity={0.92} filter={cheeseTex} />}
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
                    ids={ids}
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
