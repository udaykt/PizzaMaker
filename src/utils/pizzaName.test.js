import { describe, it, expect } from 'vitest';
import { pizzaName } from './pizzaName';

const base = (over = {}) => ({
  sauce: { sauceType: 'none' },
  mozzarella:     { checked: false },
  cheddar:        { checked: false },
  parmesanAsiago: { checked: false },
  feta:           { checked: false },
  ricotta:        { checked: false },
  veganCheese:    { checked: false },
  ...over,
});
const toppings = (over = {}) => ({
  pepperoni: { checked: false, quantity: 'regular' },
  sausage:   { checked: false, quantity: 'regular' },
  bacon:     { checked: false, quantity: 'regular' },
  chicken:   { checked: false, quantity: 'regular' },
  peppers:   { checked: false, quantity: 'regular' },
  olives:    { checked: false, quantity: 'regular' },
  jalapeno:  { checked: false, quantity: 'regular' },
  mushroom:  { checked: false, quantity: 'regular' },
  onion:     { checked: false, quantity: 'regular' },
  spinach:   { checked: false, quantity: 'regular' },
  tomato:    { checked: false, quantity: 'regular' },
  zucchini:  { checked: false, quantity: 'regular' },
  broccoli:  { checked: false, quantity: 'regular' },
  corn:      { checked: false, quantity: 'regular' },
  ...over,
});

describe('pizzaName', () => {
  it('names a matching preset (Supreme: tomato sauce + mozzarella + six toppings)', () => {
    const state = {
      base: base({ sauce: { sauceType: 'robust-tomato' }, mozzarella: { checked: true } }),
      toppings: toppings({
        pepperoni: { checked: true, quantity: 'regular' },
        sausage:   { checked: true, quantity: 'regular' },
        peppers:   { checked: true, quantity: 'regular' },
        mushroom:  { checked: true, quantity: 'regular' },
        onion:     { checked: true, quantity: 'regular' },
        olives:    { checked: true, quantity: 'regular' },
      }),
    };
    expect(pizzaName(state)).toBe('Supreme Pizza');
  });

  it("matches a preset regardless of topping quantity (Meat Lover's)", () => {
    const state = {
      base: base({ sauce: { sauceType: 'robust-tomato' }, mozzarella: { checked: true }, cheddar: { checked: true } }),
      toppings: toppings({
        pepperoni: { checked: true, quantity: 'light' },
        sausage:   { checked: true, quantity: 'regular' },
        bacon:     { checked: true, quantity: 'regular' },
        chicken:   { checked: true, quantity: 'regular' },
      }),
    };
    expect(pizzaName(state)).toBe("Meat Lover's Pizza");
  });

  it('names a custom pizza after its toppings', () => {
    const state = {
      base: base({ mozzarella: { checked: true } }),
      toppings: toppings({
        pepperoni: { checked: true, quantity: 'regular' },
        olives:    { checked: true, quantity: 'regular' },
      }),
    };
    expect(pizzaName(state)).toBe('Pepperoni & Olives Pizza');
  });

  it('lists three toppings with a comma and ampersand', () => {
    const state = {
      base: base(),
      toppings: toppings({
        pepperoni: { checked: true, quantity: 'regular' },
        sausage:   { checked: true, quantity: 'regular' },
        peppers:   { checked: true, quantity: 'regular' },
      }),
    };
    expect(pizzaName(state)).toBe('Pepperoni, Sausage & Peppers Pizza');
  });

  it('calls a cheese-only pizza a Cheese Pizza', () => {
    const state = { base: base({ cheddar: { checked: true } }), toppings: toppings() };
    expect(pizzaName(state)).toBe('Cheese Pizza');
  });
});
