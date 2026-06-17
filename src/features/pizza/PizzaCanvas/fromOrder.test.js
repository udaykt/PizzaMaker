import { describe, it, expect } from 'vitest';
import { deliveryMethodFromOrder, orderDisplayLabels, pizzaPropsFromOrder } from './fromOrder';

describe('pizzaPropsFromOrder', () => {
  it('maps R/M/L enum to size names', () => {
    expect(pizzaPropsFromOrder({ pizzaSize: 'R' }).size).toBe('small');
    expect(pizzaPropsFromOrder({ pizzaSize: 'M' }).size).toBe('medium');
    expect(pizzaPropsFromOrder({ pizzaSize: 'L' }).size).toBe('large');
  });

  it('defaults to medium for unknown or missing size', () => {
    expect(pizzaPropsFromOrder({}).size).toBe('medium');
    expect(pizzaPropsFromOrder({ pizzaSize: 'X' }).size).toBe('medium');
  });

  it('maps sauce type and cheese booleans and quantity enums into base and toppings', () => {
    const props = pizzaPropsFromOrder({
      pizzaSize: 'L',
      ingredients: {
        sauceType: 'ROBUST_TOMATO',
        mozzarella: true,
        provolone: false,
        feta: true,
        veganCheese: false,
        toppings: [
          { id: 'pepperoni', quantity: 'EXTRA' },
          { id: 'olives', quantity: 'LIGHT' },
        ],
      },
    });
    expect(props.base.sauce.sauceType).toBe('robust-tomato');
    expect(props.base.mozzarella.checked).toBe(true);
    expect(props.base.feta.checked).toBe(true);
    expect(props.base.provolone.checked).toBe(false);
    expect(props.toppings.pepperoni).toEqual({ checked: true, quantity: 'extra' });
    expect(props.toppings.olives).toEqual({ checked: true, quantity: 'light' });
  });

  it('treats missing ingredients as unchecked/no-sauce, defaulting quantity to regular', () => {
    const props = pizzaPropsFromOrder({ pizzaSize: 'M' });
    expect(props.base.sauce.sauceType).toBe('none');
    expect(props.base.mozzarella.checked).toBe(false);
    expect(props.toppings.sausage).toEqual({ checked: false, quantity: 'regular' });
  });

  it('maps crust style and bake level enums, defaulting when missing', () => {
    expect(pizzaPropsFromOrder({ crustStyle: 'STUFFED' }).crustStyle).toBe('stuffed');
    expect(pizzaPropsFromOrder({ bakeLevel: 'WELL_DONE' }).bakeLevel).toBe('well-done');
    expect(pizzaPropsFromOrder({ crustStyle: 'HAND_TOSSED' }).crustStyle).toBe('hand-tossed');
    expect(pizzaPropsFromOrder({}).crustStyle).toBe('hand-tossed');
    expect(pizzaPropsFromOrder({}).bakeLevel).toBe('normal');
  });
});

describe('orderDisplayLabels', () => {
  it('produces human-readable labels for size, crust style, bake level, delivery method, and sauce', () => {
    expect(orderDisplayLabels({
      pizzaSize: 'L',
      crustStyle: 'STUFFED',
      bakeLevel: 'WELL_DONE',
      deliveryMethod: 'CARRYOUT',
      ingredients: { sauceType: 'BBQ' },
    })).toEqual({
      size: 'Large (14")',
      crustStyle: 'Stuffed',
      bakeLevel: 'Well Done',
      deliveryMethod: 'Carryout',
      sauceType: 'BBQ',
    });
  });

  it('defaults sensibly when fields are missing', () => {
    expect(orderDisplayLabels({})).toEqual({
      size: 'Medium (12")',
      crustStyle: 'Hand Tossed',
      bakeLevel: 'Normal Bake',
      deliveryMethod: 'Delivery',
      sauceType: 'None',
    });
  });
});

describe('deliveryMethodFromOrder', () => {
  it('maps the backend enum to the frontend lowercase value', () => {
    expect(deliveryMethodFromOrder({ deliveryMethod: 'CARRYOUT' })).toBe('carryout');
    expect(deliveryMethodFromOrder({ deliveryMethod: 'DELIVERY' })).toBe('delivery');
  });

  it('defaults to delivery when missing', () => {
    expect(deliveryMethodFromOrder({})).toBe('delivery');
  });
});
