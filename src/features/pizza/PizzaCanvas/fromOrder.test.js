import { describe, it, expect } from 'vitest';
import { pizzaPropsFromOrder } from './fromOrder';

describe('pizzaPropsFromOrder', () => {
  it('maps R/M/L enum to size names', () => {
    expect(pizzaPropsFromOrder({ pizzaSize: 'R' }).size).toBe('regular');
    expect(pizzaPropsFromOrder({ pizzaSize: 'M' }).size).toBe('medium');
    expect(pizzaPropsFromOrder({ pizzaSize: 'L' }).size).toBe('large');
  });

  it('defaults to medium for unknown or missing size', () => {
    expect(pizzaPropsFromOrder({}).size).toBe('medium');
    expect(pizzaPropsFromOrder({ pizzaSize: 'X' }).size).toBe('medium');
  });

  it('maps flat ingredient booleans into base and toppings', () => {
    const props = pizzaPropsFromOrder({
      pizzaSize: 'L',
      ingredients: {
        sauce: true,
        cheese: true,
        mozzarella: false,
        pepperoni: true,
        pepperoniMedium: true,
        olives: true,
        olivesMedium: false,
      },
    });
    expect(props.base.sauce.checked).toBe(true);
    expect(props.base.cheese.checked).toBe(true);
    expect(props.base.mozzarella.checked).toBe(false);
    expect(props.toppings.pepperoni).toEqual({ checked: true, medium: true });
    expect(props.toppings.olives).toEqual({ checked: true, medium: false });
  });

  it('treats missing ingredients as unchecked', () => {
    const props = pizzaPropsFromOrder({ pizzaSize: 'M' });
    expect(props.base.sauce.checked).toBe(false);
    expect(props.toppings.sausage).toEqual({ checked: false, medium: false });
  });
});
