import { describe, it, expect } from 'vitest';
import pizzaHubSlice, { isPizzaEmpty } from './pizzaHubSlice';

const { reducer, actions } = pizzaHubSlice;

describe('isPizzaEmpty', () => {
  it('is true for the initial (untouched) pizza', () => {
    expect(isPizzaEmpty(reducer(undefined, { type: '@@INIT' }))).toBe(true);
  });

  it('is false once a base is selected', () => {
    const state = reducer(undefined, actions.toggleBase({ title: 'sauce' }));
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

  it('setToppingMedium sets quantity explicitly', () => {
    let state = reducer(undefined, actions.setToppingMedium({ title: 'sausage', medium: true }));
    expect(state.toppings.sausage.medium).toBe(true);
    state = reducer(state, actions.setToppingMedium({ title: 'sausage', medium: false }));
    expect(state.toppings.sausage.medium).toBe(false);
  });

  it('toggleBase flips the base checked flag', () => {
    const state = reducer(undefined, actions.toggleBase({ title: 'cheese' }));
    expect(state.base.cheese.checked).toBe(true);
  });
});
