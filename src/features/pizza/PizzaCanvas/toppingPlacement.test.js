import { describe, it, expect } from 'vitest';
import { visiblePieces, PLACEMENT_RADIUS } from './toppingPlacement';

const noToppings = {
  pepperoni: { checked: false, quantity: 'regular' },
  sausage: { checked: false, quantity: 'regular' },
  peppers: { checked: false, quantity: 'regular' },
  olives: { checked: false, quantity: 'regular' },
};

describe('visiblePieces', () => {
  it('returns nothing when no toppings are selected', () => {
    expect(visiblePieces(noToppings, 'medium')).toHaveLength(0);
  });

  it('only emits pieces for the checked toppings', () => {
    const pieces = visiblePieces(
      { ...noToppings, pepperoni: { checked: true, quantity: 'regular' } },
      'medium'
    );
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.every((p) => p.type === 'pepperoni')).toBe(true);
  });

  it('extra quantity places more pieces than regular, which places more than light', () => {
    const light = visiblePieces({ ...noToppings, olives: { checked: true, quantity: 'light' } }, 'medium');
    const regular = visiblePieces({ ...noToppings, olives: { checked: true, quantity: 'regular' } }, 'medium');
    const extra = visiblePieces({ ...noToppings, olives: { checked: true, quantity: 'extra' } }, 'medium');
    expect(regular.length).toBeGreaterThan(light.length);
    expect(extra.length).toBeGreaterThan(regular.length);
  });

  it('a larger pizza places more pieces than a smaller one', () => {
    const small = visiblePieces({ ...noToppings, sausage: { checked: true, quantity: 'regular' } }, 'small');
    const large = visiblePieces({ ...noToppings, sausage: { checked: true, quantity: 'regular' } }, 'large');
    expect(large.length).toBeGreaterThan(small.length);
  });

  it('is deterministic — same selection yields identical placement', () => {
    const selection = { ...noToppings, peppers: { checked: true, quantity: 'extra' } };
    expect(visiblePieces(selection, 'large')).toEqual(visiblePieces(selection, 'large'));
  });

  it('keeps every piece inside the placement radius', () => {
    const all = {
      pepperoni: { checked: true, quantity: 'extra' },
      sausage: { checked: true, quantity: 'extra' },
      peppers: { checked: true, quantity: 'extra' },
      olives: { checked: true, quantity: 'extra' },
    };
    for (const p of visiblePieces(all, 'large')) {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(PLACEMENT_RADIUS + 0.001);
    }
  });

  it('gives each piece a stable, unique id', () => {
    const pieces = visiblePieces(
      { ...noToppings, pepperoni: { checked: true, quantity: 'extra' } },
      'medium'
    );
    const ids = pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('treats a missing/unknown quantity as regular', () => {
    const withUnknown = visiblePieces({ ...noToppings, olives: { checked: true, quantity: 'bogus' } }, 'medium');
    const withRegular = visiblePieces({ ...noToppings, olives: { checked: true, quantity: 'regular' } }, 'medium');
    expect(withUnknown.length).toBe(withRegular.length);
  });
});
