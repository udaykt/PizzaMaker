import { describe, it, expect } from 'vitest';
import { TOPPING_CATALOG } from './toppingCatalog';
import { TOPPING_ART } from '@/features/pizza/PizzaCanvas/toppingArt';

// The catalog (data) and the art registry (visuals) are the two halves a
// topping is defined in. This guards them against drifting apart: adding a
// catalog row without art (or vice versa) fails here rather than rendering a
// blank piece or shipping an orphan.
describe('topping catalog and art registry stay in sync', () => {
  it('every catalog topping has an art entry with an image', () => {
    for (const t of TOPPING_CATALOG) {
      expect(TOPPING_ART[t.id], `missing art for "${t.id}"`).toBeDefined();
      expect(TOPPING_ART[t.id].image, `art for "${t.id}" has no image`).toBeTruthy();
    }
  });

  it('every art entry corresponds to a catalog topping', () => {
    const ids = new Set(TOPPING_CATALOG.map((t) => t.id));
    for (const id of Object.keys(TOPPING_ART)) {
      expect(ids.has(id), `art entry "${id}" has no catalog row`).toBe(true);
    }
  });

  it('catalog ids are unique', () => {
    const ids = TOPPING_CATALOG.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
