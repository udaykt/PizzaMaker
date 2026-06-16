import { describe, it, expect } from 'vitest';
import { computePriceBreakdown } from './pricing';

const noBase = {
  sauce: { checked: false },
  mozzarella: { checked: false },
  cheese: { checked: false },
};
const noToppings = {
  pepperoni: { checked: false, medium: false },
  sausage: { checked: false, medium: false },
  peppers: { checked: false, medium: false },
  olives: { checked: false, medium: false },
};
const sizePricing = { R: 8, M: 12, L: 16 };

describe('computePriceBreakdown', () => {
  it('charges only the size price for a plain pizza', () => {
    const { lineItems, total } = computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems).toHaveLength(0);
    expect(total).toBe(12);
  });

  it('adds a line item and price per checked base', () => {
    const base = { ...noBase, sauce: { checked: true }, cheese: { checked: true } };
    const { lineItems, total } = computePriceBreakdown({ base, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems).toEqual([
      { key: 'sauce', label: 'Sauce', price: 0.5 },
      { key: 'cheese', label: 'Cheese', price: 0.5 },
    ]);
    expect(total).toBe(13);
  });

  it('labels topping quantity and charges medium vs regular correctly', () => {
    const toppings = { ...noToppings, pepperoni: { checked: true, medium: true }, olives: { checked: true, medium: false } };
    const { lineItems, total } = computePriceBreakdown({ base: noBase, toppings, sizePricing, size: 'medium' });
    expect(lineItems).toEqual([
      { key: 'pepperoni', label: 'Pepperoni (Medium)', price: 2.0 },
      { key: 'olives', label: 'Olives (Regular)', price: 1.5 },
    ]);
    expect(total).toBe(15.5);
  });

  it('uses the right size price for regular/large', () => {
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'regular' }).total).toBe(8);
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'large' }).total).toBe(16);
  });

  it('falls back to default size pricing when sizePricing is missing', () => {
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, size: 'large' }).total).toBe(16);
  });
});
