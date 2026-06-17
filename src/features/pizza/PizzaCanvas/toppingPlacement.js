// Deterministic topping placement that looks naturally splattered.
//
// Real toppings aren't laid out on a grid or a spiral — they're random, but
// never stacked on top of each other. That quality is "blue noise". We generate
// it with Mitchell's best-candidate algorithm: each new point is the random
// candidate that sits farthest from all points placed so far. Because the early
// points are the most spread out, any prefix of the sequence already covers the
// whole pie — so a pizza with only a few toppings still looks evenly scattered.
//
// Everything is seeded, so the splatter is stable across renders (no jumping)
// while still reading as random.

import { TOPPING_CATALOG } from '@/config/toppingCatalog';

export const PLACEMENT_RADIUS = 100;

// Topping identity, piece counts and per-piece sizes all come from the catalog,
// so adding a topping needs no edit here. Order matters: it seeds the permanent
// blue-noise layout below, so keep it stable (catalog order).
const TYPE_ORDER = TOPPING_CATALOG.map((t) => t.id);
// Piece counts at "regular" quantity on a medium pizza.
const BASE_COUNT = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t.baseCount]));
// Real-world relative sizes (radius in SVG units before per-piece variation).
const TYPE_SIZE = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t.pieceRadius]));

// Light/Regular/Extra — matches the real quantity tiers used by Domino's,
// Pizza Hut, and Papa John's, rather than an in-house "medium" scale.
const QTY_MULTIPLIER = { light: 0.6, regular: 1.0, extra: 1.6 };
const SIZE_FACTOR = { small: 0.8, medium: 1.0, large: 1.25 };

const MAX_FACTOR = SIZE_FACTOR.large * QTY_MULTIPLIER.extra;
const MAX_COUNT = TYPE_ORDER.reduce((acc, type) => {
  acc[type] = Math.round(BASE_COUNT[type] * MAX_FACTOR);
  return acc;
}, {});
const TOTAL_SLOTS = Object.values(MAX_COUNT).reduce((a, b) => a + b, 0);

// Small, fast, seedable PRNG so the splatter is identical on every render.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInDisc(rnd, radius) {
  const r = radius * Math.sqrt(rnd());
  const a = rnd() * 2 * Math.PI;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

// Mitchell's best-candidate blue-noise points, ordered most-spread-first.
function blueNoise(count, radius, seed) {
  const rnd = mulberry32(seed);
  const points = [randomInDisc(rnd, radius)];
  for (let i = 1; i < count; i++) {
    let best = null;
    let bestDist = -1;
    const candidates = Math.min(8 + i, 28);
    for (let c = 0; c < candidates; c++) {
      const p = randomInDisc(rnd, radius);
      let nearest = Infinity;
      for (const q of points) {
        const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
        if (d < nearest) nearest = d;
      }
      if (nearest > bestDist) {
        bestDist = nearest;
        best = p;
      }
    }
    points.push(best);
  }
  return points;
}

// Permanent layout: round-robin interleave of every type at max count, mapped
// onto the blue-noise sequence. Each (type, index) keeps the same point and
// size forever, so toggling one topping never disturbs the others.
const FULL_LAYOUT = (() => {
  const points = blueNoise(TOTAL_SLOTS, PLACEMENT_RADIUS, 1337);
  const jitter = mulberry32(54321);

  const ordered = [];
  const maxLen = Math.max(...Object.values(MAX_COUNT));
  for (let i = 0; i < maxLen; i++) {
    for (const type of TYPE_ORDER) {
      if (i < MAX_COUNT[type]) ordered.push({ type, indexWithinType: i });
    }
  }

  return ordered.map((piece, slot) => {
    const { x, y } = points[slot];
    return {
      ...piece,
      id: `${piece.type}-${piece.indexWithinType}`,
      x,
      y,
      // Base size for the type, plus +/- ~22% natural per-piece variation.
      radius: TYPE_SIZE[piece.type] * (0.82 + jitter() * 0.4),
      rotate: Math.round(jitter() * 360),
    };
  });
})();

// The pieces visible for the current selection. Stable identity by `id`, so
// Framer Motion's AnimatePresence only animates the ones added/removed.
export function visiblePieces(toppings, size) {
  const factor = SIZE_FACTOR[size] ?? 1;
  const counts = {};
  for (const type of TYPE_ORDER) {
    const t = toppings?.[type];
    const qtyMultiplier = QTY_MULTIPLIER[t?.quantity] ?? QTY_MULTIPLIER.regular;
    counts[type] = t && t.checked
      ? Math.round(BASE_COUNT[type] * factor * qtyMultiplier)
      : 0;
  }
  return FULL_LAYOUT.filter((p) => p.indexWithinType < counts[p.type]);
}
