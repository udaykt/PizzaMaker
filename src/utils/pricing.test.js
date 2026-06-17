import { describe, it, expect } from 'vitest';
import { computePriceBreakdown } from './pricing';

const noBase = {
  sauce: { sauceType: 'none' },
  mozzarella:     { checked: false },
  cheddar:        { checked: false },
  parmesanAsiago: { checked: false },
  feta:           { checked: false },
  ricotta:        { checked: false },
  veganCheese:    { checked: false },
};
const noToppings = {
  pepperoni: { checked: false, quantity: 'regular' },
  sausage: { checked: false, quantity: 'regular' },
  peppers: { checked: false, quantity: 'regular' },
  olives: { checked: false, quantity: 'regular' },
};
const sizePricing = { R: 8, M: 12, L: 16 };

describe('computePriceBreakdown', () => {
  it('charges only the size price for a plain pizza', () => {
    const { lineItems, total } = computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems).toHaveLength(0);
    expect(total).toBe(12);
  });

  it('standard sauce and cheese each charge fifty cents', () => {
    const base = { ...noBase, sauce: { sauceType: 'marinara' }, mozzarella: { checked: true } };
    const { lineItems, total } = computePriceBreakdown({ base, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems).toEqual([
      { key: 'sauce', label: 'Marinara', price: 0.5 },
      { key: 'mozzarella', label: 'Mozzarella', price: 0.5 },
    ]);
    expect(total).toBe(13);
  });

  it('specialty sauces (Garlic Parmesan/Alfredo/BBQ) cost more than standard ones', () => {
    const standard = computePriceBreakdown({ base: { ...noBase, sauce: { sauceType: 'robust-tomato' } }, toppings: noToppings, sizePricing, size: 'medium' }).total;
    const specialty = computePriceBreakdown({ base: { ...noBase, sauce: { sauceType: 'bbq' } }, toppings: noToppings, sizePricing, size: 'medium' }).total;
    expect(specialty).toBeGreaterThan(standard);
    expect(specialty - 12).toBe(1.25);
  });

  it('specialty cheeses (parmesan-asiago/feta/ricotta/vegan) cost more than mozzarella', () => {
    const mozz = computePriceBreakdown({ base: { ...noBase, mozzarella: { checked: true } }, toppings: noToppings, sizePricing, size: 'medium' }).total;
    const feta = computePriceBreakdown({ base: { ...noBase, feta: { checked: true } }, toppings: noToppings, sizePricing, size: 'medium' }).total;
    expect(feta).toBeGreaterThan(mozz);
    expect(feta - 12).toBe(1.0);
  });

  it('multiple cheeses stack', () => {
    const base = { ...noBase, mozzarella: { checked: true }, cheddar: { checked: true }, feta: { checked: true } };
    const { lineItems, total } = computePriceBreakdown({ base, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems).toEqual([
      { key: 'mozzarella', label: 'Mozzarella', price: 0.5 },
      { key: 'cheddar', label: 'Cheddar', price: 0.5 },
      { key: 'feta', label: 'Feta', price: 1.0 },
    ]);
    expect(total).toBe(14);
  });

  it('charges nothing for sauce when sauceType is none', () => {
    const { lineItems, total } = computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems.find((i) => i.key === 'sauce')).toBeUndefined();
    expect(total).toBe(12);
  });

  it('labels topping quantity and charges each tier correctly', () => {
    const toppings = {
      ...noToppings,
      pepperoni: { checked: true, quantity: 'extra' },
      olives: { checked: true, quantity: 'light' },
    };
    const { lineItems, total } = computePriceBreakdown({ base: noBase, toppings, sizePricing, size: 'medium' });
    expect(lineItems).toEqual([
      { key: 'pepperoni', label: 'Pepperoni (Extra)', price: 3.0 },
      { key: 'olives', label: 'Olives (Light)', price: 1.0 },
    ]);
    expect(total).toBe(16);
  });

  it('extra costs roughly double regular, matching real-world pizza chain pricing', () => {
    const regular = computePriceBreakdown({
      base: noBase,
      toppings: { ...noToppings, pepperoni: { checked: true, quantity: 'regular' } },
      sizePricing,
      size: 'medium',
    }).total;
    const extra = computePriceBreakdown({
      base: noBase,
      toppings: { ...noToppings, pepperoni: { checked: true, quantity: 'extra' } },
      sizePricing,
      size: 'medium',
    }).total;
    expect(extra - 12).toBeCloseTo((regular - 12) * 2, 5);
  });

  it('uses the right size price for small/large', () => {
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'small' }).total).toBe(8);
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'large' }).total).toBe(16);
  });

  it('falls back to default size pricing when sizePricing is missing', () => {
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, size: 'large' }).total).toBe(16);
  });

  it('treats a missing/unknown quantity as regular pricing', () => {
    const toppings = { ...noToppings, sausage: { checked: true, quantity: undefined } };
    const { lineItems } = computePriceBreakdown({ base: noBase, toppings, sizePricing, size: 'medium' });
    expect(lineItems[0]).toEqual({ key: 'sausage', label: 'Sausage (Regular)', price: 1.5 });
  });

  it('adds a delivery fee line item only when deliveryMethod is "delivery"', () => {
    const carryout = computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'medium', deliveryMethod: 'carryout' });
    expect(carryout.lineItems).toHaveLength(0);
    expect(carryout.total).toBe(12);

    const delivery = computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'medium', deliveryMethod: 'delivery' });
    expect(delivery.lineItems).toEqual([{ key: 'deliveryFee', label: 'Delivery Fee', price: 2.99 }]);
    expect(delivery.total).toBeCloseTo(14.99, 5);
  });

  it('omits the delivery fee when deliveryMethod is not passed at all (live builder estimate)', () => {
    const { lineItems, total } = computePriceBreakdown({ base: noBase, toppings: noToppings, sizePricing, size: 'medium' });
    expect(lineItems).toHaveLength(0);
    expect(total).toBe(12);
  });
});
