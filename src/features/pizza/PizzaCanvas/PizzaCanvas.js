import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { visiblePieces } from './toppingPlacement';
import styles from './pizzaCanvas.module.css';

const CENTER = 160;

// Whole-pizza visual scale per crust size. Distinct from the topping *count*
// factor — this is how big the pie looks; the spring makes size changes glide.
const PIZZA_SCALE = { regular: 0.84, medium: 0.93, large: 1.0 };

const layerTransition = { duration: 0.35, ease: 'easeOut' };
const pieceTransition = { type: 'spring', stiffness: 360, damping: 20 };

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

const ToppingPiece = ({ piece, ids }) => (
  <g transform={`translate(${piece.x + CENTER} ${piece.y + CENTER}) rotate(${piece.rotate})`}>
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
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
  idle = false,
  textured = true,
}) => {
  const liveBase = useSelector((s) => s.pizzaHub.base);
  const liveToppings = useSelector((s) => s.pizzaHub.toppings);
  const liveSize = useSelector((s) => s.pizza.size);

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

  const pieces = visiblePieces(toppings, size);
  const scale = PIZZA_SCALE[size] ?? PIZZA_SCALE.medium;
  const hasCheese = base?.cheese?.checked;
  const hasMozzarella = base?.mozzarella?.checked;

  const crustTex = textured ? `url(#${ids.crustTex})` : undefined;
  const sauceTex = textured ? `url(#${ids.sauceTex})` : undefined;
  const cheeseTex = textured ? `url(#${ids.cheeseTex})` : undefined;

  return (
    <div className={styles.wrap}>
      <svg viewBox="0 0 320 320" className={styles.canvas} role="img" aria-label="Live pizza preview">
        <defs>
          <radialGradient id={ids.crust} cx="42%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#f0c682" />
            <stop offset="70%" stopColor="#d49a4e" />
            <stop offset="100%" stopColor="#b97a32" />
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
          <circle cx={CENTER} cy={CENTER} r="150" fill={`url(#${ids.crust})`} filter={`url(#${ids.shadow})`} />
          <circle cx={CENTER} cy={CENTER} r="134" fill={`url(#${ids.crustInner})`} filter={crustTex} />

          {/* Base layers fade in/out as sauce/cheese are toggled */}
          <AnimatePresence>
            {base?.sauce?.checked && <Layer key="sauce" r="130" fill={`url(#${ids.sauce})`} filter={sauceTex} />}
            {hasMozzarella && <Layer key="mozzarella" r="126" fill={`url(#${ids.mozzarella})`} filter={cheeseTex} />}
            {hasCheese && <Layer key="cheese" r="124" fill={`url(#${ids.cheese})`} opacity={0.92} filter={cheeseTex} />}
          </AnimatePresence>

          {/* Toppings, splattered, each with a soft shadow */}
          <g filter={`url(#${ids.toppingShadow})`}>
            <AnimatePresence>
              {pieces.map((piece) => (
                <ToppingPiece key={piece.id} piece={piece} ids={ids} />
              ))}
            </AnimatePresence>
          </g>
        </motion.g>
      </svg>
    </div>
  );
};

export default PizzaCanvas;
