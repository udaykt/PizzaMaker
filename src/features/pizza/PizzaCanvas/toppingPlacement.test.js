import { describe, it, expect } from 'vitest';
import { visiblePieces, PLACEMENT_RADIUS } from './toppingPlacement';

const noToppings = {
  pepperoni: { checked: false, medium: false },
  sausage: { checked: false, medium: false },
  peppers: { checked: false, medium: false },
  olives: { checked: false, medium: false },
};

describe('visiblePieces', () => {
  it('returns nothing when no toppings are selected', () => {
    expect(visiblePieces(noToppings, 'medium')).toHaveLength(0);
  });

  it('only emits pieces for the checked toppings', () => {
    const pieces = visiblePieces(
      { ...noToppings, pepperoni: { checked: true, medium: false } },
      'medium'
    );
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.every((p) => p.type === 'pepperoni')).toBe(true);
  });

  it('medium quantity places more pieces than regular', () => {
    const regular = visiblePieces(
      { ...noToppings, olives: { checked: true, medium: false } },
      'medium'
    );
    const medium = visiblePieces(
      { ...noToppings, olives: { checked: true, medium: true } },
      'medium'
    );
    expect(medium.length).toBeGreaterThan(regular.length);
  });

  it('a larger pizza places more pieces than a smaller one', () => {
    const small = visiblePieces({ ...noToppings, sausage: { checked: true } }, 'regular');
    const large = visiblePieces({ ...noToppings, sausage: { checked: true } }, 'large');
    expect(large.length).toBeGreaterThan(small.length);
  });

  it('is deterministic — same selection yields identical placement', () => {
    const selection = { ...noToppings, peppers: { checked: true, medium: true } };
    expect(visiblePieces(selection, 'large')).toEqual(visiblePieces(selection, 'large'));
  });

  it('keeps every piece inside the placement radius', () => {
    const all = {
      pepperoni: { checked: true, medium: true },
      sausage: { checked: true, medium: true },
      peppers: { checked: true, medium: true },
      olives: { checked: true, medium: true },
    };
    for (const p of visiblePieces(all, 'large')) {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(PLACEMENT_RADIUS + 0.001);
    }
  });

  it('gives each piece a stable, unique id', () => {
    const pieces = visiblePieces(
      { ...noToppings, pepperoni: { checked: true, medium: true } },
      'medium'
    );
    const ids = pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
