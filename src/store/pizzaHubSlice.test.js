import { describe, it, expect } from 'vitest';
import pizzaHubSlice, { isPizzaEmpty, SAUCE_TYPES, TOPPING_QUANTITIES } from './pizzaHubSlice';

const { reducer, actions } = pizzaHubSlice;

describe('isPizzaEmpty', () => {
  it('is true for the initial (untouched) pizza', () => {
    expect(isPizzaEmpty(reducer(undefined, { type: '@@INIT' }))).toBe(true);
  });

  it('is false once a sauce is picked', () => {
    const state = reducer(undefined, actions.setSauceType(SAUCE_TYPES.MARINARA));
    expect(isPizzaEmpty(state)).toBe(false);
  });

  it('is false once a cheese is selected', () => {
    const state = reducer(undefined, actions.toggleBase('mozzarella'));
    expect(isPizzaEmpty(state)).toBe(false);
  });

  it('is false once a topping is selected', () => {
    const state = reducer(undefined, actions.toggleTopping({ title: 'pepperoni' }));
    expect(isPizzaEmpty(state)).toBe(false);
  });
});

describe('pizzaHub reducers', () => {
  it('toggleTopping flips the checked flag', () => {
    const state = reducer(undefined, actions.toggleTopping({ title: 'olives' }));
    expect(state.toppings.olives.checked).toBe(true);
  });

  it('defaults every topping to regular quantity', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.toppings.pepperoni.quantity).toBe(TOPPING_QUANTITIES.REGULAR);
    expect(state.toppings.sausage.quantity).toBe(TOPPING_QUANTITIES.REGULAR);
    expect(state.toppings.peppers.quantity).toBe(TOPPING_QUANTITIES.REGULAR);
    expect(state.toppings.olives.quantity).toBe(TOPPING_QUANTITIES.REGULAR);
  });

  it('setToppingQuantity sets one of light/regular/extra explicitly', () => {
    let state = reducer(undefined, actions.setToppingQuantity({ title: 'sausage', quantity: TOPPING_QUANTITIES.EXTRA }));
    expect(state.toppings.sausage.quantity).toBe('extra');
    state = reducer(state, actions.setToppingQuantity({ title: 'sausage', quantity: TOPPING_QUANTITIES.LIGHT }));
    expect(state.toppings.sausage.quantity).toBe('light');
  });

  it('toggleBase flips a cheese checked flag', () => {
    const state = reducer(undefined, actions.toggleBase('cheddar'));
    expect(state.base.cheddar.checked).toBe(true);
  });

  it('toggleBase works for veganCheese whose key differs from its display title', () => {
    const state = reducer(undefined, actions.toggleBase('veganCheese'));
    expect(state.base.veganCheese.checked).toBe(true);
  });

  it('setSauceType sets the single sauce choice directly (not a toggle)', () => {
    const state = reducer(undefined, actions.setSauceType(SAUCE_TYPES.BBQ));
    expect(state.base.sauce.sauceType).toBe('bbq');
  });

  it('restorePizza bulk-sets sauce type and cheese/topping selections (Order Again)', () => {
    const state = reducer(undefined, actions.restorePizza({
      base: {
        sauce: { sauceType: SAUCE_TYPES.MARINARA },
        mozzarella: { checked: true },
        cheddar: { checked: false },
        feta: { checked: true },
        veganCheese: { checked: false },
      },
      toppings: { pepperoni: { checked: true, quantity: 'extra' }, olives: { checked: false, quantity: 'regular' } },
    }));
    expect(state.base.sauce.sauceType).toBe('marinara');
    expect(state.base.mozzarella.checked).toBe(true);
    expect(state.base.feta.checked).toBe(true);
    expect(state.base.cheddar.checked).toBe(false);
    expect(state.toppings.pepperoni).toMatchObject({ checked: true, quantity: 'extra' });
    expect(state.toppings.olives).toMatchObject({ checked: false, quantity: 'regular' });
    // unrelated fields (title) survive the bulk restore
    expect(state.base.sauce.title).toBe('sauce');
  });

  it('restorePizza defaults sauce to none and topping quantity to regular when missing from payload', () => {
    const state = reducer(undefined, actions.restorePizza({
      base: { sauce: {} },
      toppings: { pepperoni: { checked: true } },
    }));
    expect(state.base.sauce.sauceType).toBe('none');
    expect(state.toppings.pepperoni.quantity).toBe('regular');
  });
});
