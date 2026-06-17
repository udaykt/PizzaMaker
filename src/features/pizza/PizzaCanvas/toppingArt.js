import pepperoniPng from '@/assets/images/toppings/pepperoni.png';
import sausagePng from '@/assets/images/toppings/sausage.png';
import peppersPng from '@/assets/images/toppings/peppers.png';
import olivePng from '@/assets/images/toppings/olive.png';

// The one place a topping's look is defined: its menu swatch, the little PNG on
// the menu toggle knob, its SVG gradient (or null for a flat fill) and its
// hand-drawn shape. This is deliberately the *only* per-topping code —
// everything mechanical is data in config/toppingCatalog.js. Adding a topping
// means adding one entry here under the same id. Shapes are drawn proportional
// to the piece radius `r` so size varies naturally; `gradId` is the unique
// gradient id minted per canvas.
export const TOPPING_ART = {
  pepperoni: {
    swatch: '#a94100',
    knob: { image: pepperoniPng, size: '16px' },
    gradient: (id) => (
      <radialGradient id={id} cx="38%" cy="34%" r="72%">
        <stop offset="0%" stopColor="#d24f3b" />
        <stop offset="100%" stopColor="#9c2b1b" />
      </radialGradient>
    ),
    shape: (r, gradId) => (
      <g>
        <circle r={r} fill={`url(#${gradId})`} stroke="#7c1f12" strokeWidth={r * 0.07} />
        <circle cx={-r * 0.33} cy={-r * 0.22} r={r * 0.16} fill="#7c1f12" />
        <circle cx={r * 0.33} cy={r * 0.16} r={r * 0.18} fill="#7c1f12" />
        <circle cx={-r * 0.05} cy={r * 0.4} r={r * 0.13} fill="#8f2a18" />
        <circle cx={-r * 0.38} cy={-r * 0.36} r={r * 0.24} fill="rgba(255,255,255,0.18)" />
      </g>
    ),
  },
  sausage: {
    // A lumpy crumble rather than a clean disc.
    swatch: '#b0926d',
    knob: { image: sausagePng, size: '26px' },
    gradient: (id) => (
      <radialGradient id={id} cx="38%" cy="34%" r="72%">
        <stop offset="0%" stopColor="#a4704a" />
        <stop offset="100%" stopColor="#774c2f" />
      </radialGradient>
    ),
    shape: (r, gradId) => (
      <g>
        <circle r={r} fill={`url(#${gradId})`} stroke="#5f3d27" strokeWidth={r * 0.09} />
        <circle cx={r * 0.62} cy={-r * 0.22} r={r * 0.55} fill={`url(#${gradId})`} stroke="#5f3d27" strokeWidth={r * 0.09} />
        <circle cx={-r * 0.5} cy={r * 0.46} r={r * 0.46} fill={`url(#${gradId})`} stroke="#5f3d27" strokeWidth={r * 0.09} />
        <circle cx={-r * 0.22} cy={-r * 0.22} r={r * 0.18} fill="#5b3a24" />
        <circle cx={r * 0.18} cy={r * 0.12} r={r * 0.15} fill="#5b3a24" />
      </g>
    ),
  },
  peppers: {
    // A thin diced sliver.
    swatch: '#078407',
    knob: { image: peppersPng, size: '20px' },
    gradient: (id) => (
      <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#5cbb4b" />
        <stop offset="100%" stopColor="#2f8f2a" />
      </linearGradient>
    ),
    shape: (r, gradId) => (
      <g>
        <rect x={-r * 1.1} y={-r * 0.45} width={r * 2.2} height={r * 0.9} rx={r * 0.45} fill={`url(#${gradId})`} />
        <rect x={-r * 0.95} y={-r * 0.32} width={r * 1.9} height={r * 0.22} rx={r * 0.11} fill="rgba(255,255,255,0.22)" />
      </g>
    ),
  },
  olives: {
    // A ring with a real hole (stroke, no fill) — no gradient.
    swatch: '#353535',
    knob: { image: olivePng, size: '20px' },
    gradient: null,
    shape: (r) => (
      <g>
        <circle r={r * 0.82} fill="none" stroke="#2c2c2e" strokeWidth={r * 0.55} />
        <circle cx={-r * 0.28} cy={-r * 0.28} r={r * 0.16} fill="rgba(255,255,255,0.25)" />
      </g>
    ),
  },
};
