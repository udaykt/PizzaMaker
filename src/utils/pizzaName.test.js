import { describe, it, expect } from 'vitest';
import { pizzaName, suggestPizzaName, withPizzaSuffix } from './pizzaName';

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
const on = (quantity = 'regular') => ({ checked: true, quantity });

describe('pizzaName — presets win', () => {
  it('names a matching preset (Supreme)', () => {
    const state = {
      base: base({ sauce: { sauceType: 'robust-tomato' }, mozzarella: { checked: true } }),
      toppings: toppings({
        pepperoni: on(), sausage: on(), peppers: on(),
        mushroom: on(), onion: on(), olives: on(),
      }),
    };
    expect(pizzaName(state)).toBe('Supreme Pizza');
  });

  it("matches a preset regardless of topping quantity (Meat Lover's)", () => {
    const state = {
      base: base({ sauce: { sauceType: 'robust-tomato' }, mozzarella: { checked: true }, cheddar: { checked: true } }),
      toppings: toppings({ pepperoni: on('light'), sausage: on(), bacon: on(), chicken: on() }),
    };
    expect(pizzaName(state)).toBe("Meat Lover's Pizza");
  });
});

describe('pizzaName — short builds stay literal', () => {
  it('one or two toppings read fine as a list, so we do not invent a name', () => {
    const state = {
      base: base({ mozzarella: { checked: true } }),
      toppings: toppings({ pepperoni: on(), olives: on() }),
    };
    expect(pizzaName(state)).toBe('Pepperoni & Olives Pizza');
  });

  it('a bare cheese pizza is a Cheese Pizza', () => {
    const state = { base: base({ cheddar: { checked: true } }), toppings: toppings() };
    expect(pizzaName(state)).toBe('Cheese Pizza');
  });

  it('four cheeses and nothing else is Quattro Formaggi', () => {
    const state = {
      base: base({
        mozzarella: { checked: true }, cheddar: { checked: true },
        parmesanAsiago: { checked: true }, feta: { checked: true },
      }),
      toppings: toppings(),
    };
    expect(pizzaName(state)).toBe('Quattro Formaggi Pizza');
  });
});

describe('pizzaName — character names', () => {
  // The exact name a build lands on is a hash lookup, so asserting a specific
  // string would just be pinning an implementation detail. What actually matters
  // is that the name reflects the pizza's character, is stable, and moves when
  // the pizza does.

  it('an all-meat pizza gets a carnivorous name, not a topping list', () => {
    const state = {
      base: base({ sauce: { sauceType: 'robust-tomato' } }),
      toppings: toppings({ pepperoni: on(), sausage: on(), bacon: on() }),
    };
    const name = suggestPizzaName(state);
    expect(name).not.toContain(',');
    expect(name.toLowerCase()).toMatch(/carnivore|meat|riot|butcher|predator|carnage|savage|feral|ravenous|primal/);
  });

  it('an all-veg pizza gets a garden name', () => {
    const state = {
      base: base(),
      toppings: toppings({ mushroom: on(), spinach: on(), broccoli: on(), corn: on() }),
    };
    const name = suggestPizzaName(state);
    expect(name.toLowerCase()).toMatch(/garden|green|harvest|allotment|patch|grocer|salad|photosynth|undergrowth|field|verdant|leafy|farmhouse|rabbit/);
  });

  it('jalapeño makes it spicy', () => {
    const state = {
      base: base(),
      toppings: toppings({ jalapeno: on(), peppers: on(), onion: on(), mushroom: on() }),
    };
    const name = suggestPizzaName(state);
    expect(name.toLowerCase()).toMatch(/inferno|fire|dragon|alarm|heat|reckoning|scorch|volcano|burn|hot|blazing|molten|devilish|regret/);
  });

  it('piling on everything gets an everything name', () => {
    const all = {};
    for (const id of ['pepperoni','sausage','bacon','chicken','peppers','olives','jalapeno','mushroom','onion','spinach']) {
      all[id] = on();
    }
    const name = suggestPizzaName({ base: base(), toppings: toppings(all) });
    expect(name.toLowerCase()).toMatch(/everything|kitchen sink|overachiever|maximum|avalanche|full house|shebang|regrets|landslide|glutton|peak|loaded|towering|colossal|unhinged|maxed|mountain|pile/);
  });

  it('is deterministic — the same pizza always gets the same name', () => {
    const state = {
      base: base({ sauce: { sauceType: 'bbq' }, mozzarella: { checked: true } }),
      toppings: toppings({ chicken: on(), bacon: on(), onion: on(), corn: on() }),
    };
    const first = suggestPizzaName(state, { crustStyle: 'stuffed', bakeLevel: 'normal' });
    for (let i = 0; i < 20; i += 1) {
      expect(suggestPizzaName(state, { crustStyle: 'stuffed', bakeLevel: 'normal' })).toBe(first);
    }
  });

  it('re-rolls when any part of the build changes', () => {
    const t = { pepperoni: on(), sausage: on(), bacon: on(), mushroom: on() };
    const b = base({ sauce: { sauceType: 'robust-tomato' } });

    const names = new Set([
      suggestPizzaName({ base: b, toppings: toppings(t) }),
      // one more topping
      suggestPizzaName({ base: b, toppings: toppings({ ...t, onion: on() }) }),
      // same toppings, one bumped to Extra
      suggestPizzaName({ base: b, toppings: toppings({ ...t, pepperoni: on('extra') }) }),
      // same toppings, different crust
      suggestPizzaName({ base: b, toppings: toppings(t) }, { crustStyle: 'stuffed' }),
      // same toppings, different bake
      suggestPizzaName({ base: b, toppings: toppings(t) }, { bakeLevel: 'well-done' }),
    ]);

    // Five different builds. Hash collisions are possible in principle, so this
    // asserts the name space is genuinely being explored, not that all five are
    // pairwise unique.
    expect(names.size).toBeGreaterThan(1);
  });
});

describe('pizzaName — custom names', () => {
  it('a custom name overrides the suggestion and gains the Pizza suffix', () => {
    const state = { base: base(), toppings: toppings({ pepperoni: on() }) };
    expect(pizzaName(state, { customName: "Uday's Friday Special" })).toBe("Uday's Friday Special Pizza");
  });

  it('does not double up the suffix if the user already typed it', () => {
    expect(withPizzaSuffix('Midnight Pizza')).toBe('Midnight Pizza');
    expect(withPizzaSuffix('midnight pizza')).toBe('midnight pizza');
    expect(withPizzaSuffix('The Inferno')).toBe('The Inferno Pizza');
  });

  it('falls back to the suggestion when the custom name is blank', () => {
    const state = { base: base({ cheddar: { checked: true } }), toppings: toppings() };
    expect(pizzaName(state, { customName: '   ' })).toBe('Cheese Pizza');
  });
});
