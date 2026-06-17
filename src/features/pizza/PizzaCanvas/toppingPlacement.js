import { TOPPING_CATALOG } from '@/config/toppingCatalog';

export const PLACEMENT_RADIUS = 112;

const TYPE_ORDER = TOPPING_CATALOG.map((t) => t.id);
const BASE_COUNT = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t.baseCount]));
const TYPE_SIZE  = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t.pieceRadius]));

const QTY_MULTIPLIER = { light: 0.6, regular: 1.0, extra: 1.6 };
const SIZE_FACTOR    = { small: 0.8, medium: 1.0, large: 1.25 };

const MAX_FACTOR = SIZE_FACTOR.large * QTY_MULTIPLIER.extra;
const MAX_COUNT  = Object.fromEntries(
  TYPE_ORDER.map((type) => [type, Math.round(BASE_COUNT[type] * MAX_FACTOR)])
);

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

// Pure Mitchell's best-candidate over the FULL disc — no angular sectors.
// Sectors forced pieces into a spoke-like grid; removing them gives the natural
// random-but-even scatter a real pizza has.
//
// Same-type min-distance: two pieces of the SAME topping whose centres are
// closer than 2× the piece radius would visually stack — we reject those
// candidates and pick the next-best. If every candidate fails (very dense
// "extra" quantity), we fall back to the unconstrained best so placement
// never gets stuck.
//
// Cross-type overlap: intentional. Each topping type has its OWN independent
// pool, so a sausage and a mushroom can share the same spot, exactly as they
// do on a real pizza. Selecting only one topping still fills the whole disc
// because its pool was built in isolation (not as every N-th slot of a shared
// giant pool).
function placeToppings(count, radius, pieceRadius, seed) {
  const rnd       = mulberry32(seed);
  const points    = [];
  const minDistSq = (pieceRadius * 2.0) ** 2;

  for (let i = 0; i < count; i++) {
    // More candidates for later pieces — disc is getting crowded.
    const candidates = Math.min(20 + i * 3, 60);
    let valid    = null;
    let validD   = -1;
    let fallback = null;
    let fallD    = -1;

    for (let c = 0; c < candidates; c++) {
      const angle = rnd() * 2 * Math.PI;
      // sqrt(uniform) ⟹ area-uniform distribution across the disc.
      // 0.05 floor keeps pieces off the dead centre (sauce blob tip).
      const r = radius * (0.05 + Math.sqrt(rnd()) * 0.95);
      const p = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };

      let nearest  = Infinity;
      let tooClose = false;
      for (const q of points) {
        const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
        if (d < minDistSq) { tooClose = true; }
        if (d < nearest)   { nearest  = d; }
      }

      if (!tooClose && nearest > validD) { validD = nearest; valid    = p; }
      if (nearest > fallD)               { fallD  = nearest; fallback = p; }
    }

    points.push(valid ?? fallback ?? { x: 0, y: 0 });
  }

  return points;
}

const FULL_LAYOUT = TYPE_ORDER.flatMap((type) => {
  const seed = strHash(type);
  const jrnd = mulberry32(seed ^ 0x9e3779b9);
  return placeToppings(MAX_COUNT[type], PLACEMENT_RADIUS, TYPE_SIZE[type], seed).map((p, i) => ({
    type,
    indexWithinType: i,
    id:     `${type}-${i}`,
    x:      p.x,
    y:      p.y,
    radius: TYPE_SIZE[type] * (0.82 + jrnd() * 0.4),
    rotate: Math.round(jrnd() * 360),
  }));
});

export function visiblePieces(toppings, size) {
  const factor = SIZE_FACTOR[size] ?? 1;
  const counts = {};
  for (const type of TYPE_ORDER) {
    const t   = toppings?.[type];
    const qty = QTY_MULTIPLIER[t?.quantity] ?? QTY_MULTIPLIER.regular;
    counts[type] = t?.checked ? Math.round(BASE_COUNT[type] * factor * qty) : 0;
  }
  return FULL_LAYOUT.filter((p) => p.indexWithinType < counts[p.type]);
}
