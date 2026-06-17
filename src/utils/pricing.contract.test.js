import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';
import {
  STANDARD_CHEESE_PRICE,
  SPECIALTY_CHEESE_PRICE,
  STANDARD_SAUCE_PRICE,
  SPECIALTY_SAUCE_PRICE,
  DELIVERY_FEE,
  TOPPING_PRICE,
  computePriceBreakdown,
} from './pricing';
import { TOPPING_QUANTITIES } from '@/store/pizzaHubSlice';

// The shared price book that the backend (PricingService.java) is also tested
// against. If the estimate constants below drift from it, the customer would
// see a total that differs from what they're actually charged — fail loudly.
const contract = JSON.parse(readFileSync(resolve(process.cwd(), 'pricing.contract.json'), 'utf-8'));

const noBase = {
  sauce: { sauceType: 'none' },
  mozzarella: { checked: false },
  provolone: { checked: false },
  feta: { checked: false },
  veganCheese: { checked: false },
};
const noToppings = {
  pepperoni: { checked: false, quantity: 'regular' },
  sausage: { checked: false, quantity: 'regular' },
  peppers: { checked: false, quantity: 'regular' },
  olives: { checked: false, quantity: 'regular' },
};

describe('frontend pricing matches the shared price contract', () => {
  it('cheese prices match the contract', () => {
    expect(STANDARD_CHEESE_PRICE).toBe(contract.cheese.standard);
    expect(SPECIALTY_CHEESE_PRICE).toBe(contract.cheese.specialty);
  });

  it('sauce prices match the contract', () => {
    expect(STANDARD_SAUCE_PRICE).toBe(contract.sauce.standard);
    expect(SPECIALTY_SAUCE_PRICE).toBe(contract.sauce.specialty);
  });

  it('topping tier prices match the contract', () => {
    expect(TOPPING_PRICE[TOPPING_QUANTITIES.LIGHT]).toBe(contract.topping.light);
    expect(TOPPING_PRICE[TOPPING_QUANTITIES.REGULAR]).toBe(contract.topping.regular);
    expect(TOPPING_PRICE[TOPPING_QUANTITIES.EXTRA]).toBe(contract.topping.extra);
  });

  it('delivery fee matches the contract', () => {
    expect(DELIVERY_FEE).toBe(contract.deliveryFee);
  });

  // The silent fallback at pricing.js:55 is used when /menu/sizes can't be
  // fetched. It must equal the contract too, or an offline estimate would
  // disagree with the charge.
  it('the hardcoded size fallback matches the contract', () => {
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, size: 'small' }).total).toBe(contract.size.R);
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, size: 'medium' }).total).toBe(contract.size.M);
    expect(computePriceBreakdown({ base: noBase, toppings: noToppings, size: 'large' }).total).toBe(contract.size.L);
  });

  // End-to-end: a fully specced pizza priced from the contract's own size map
  // must total exactly the sum of the contract's parts — proving the estimate
  // is composed entirely from contract numbers.
  it('composes a full estimate purely from contract numbers', () => {
    const base = {
      sauce: { sauceType: 'bbq' }, // specialty sauce
      mozzarella: { checked: true }, // standard cheese
      provolone: { checked: false },
      feta: { checked: true }, // specialty cheese
      veganCheese: { checked: false },
    };
    const toppings = {
      ...noToppings,
      pepperoni: { checked: true, quantity: 'extra' },
      olives: { checked: true, quantity: 'light' },
    };
    const { total } = computePriceBreakdown({
      base,
      toppings,
      sizePricing: contract.size,
      size: 'large',
      deliveryMethod: 'delivery',
    });
    const expected =
      contract.size.L +
      contract.sauce.specialty +
      contract.cheese.standard +
      contract.cheese.specialty +
      contract.topping.extra +
      contract.topping.light +
      contract.deliveryFee;
    expect(total).toBeCloseTo(expected, 5);
  });
});
