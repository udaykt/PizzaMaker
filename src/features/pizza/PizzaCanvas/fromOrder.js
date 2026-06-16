// Map a placed order (flat ingredient booleans + R/M/L size) back into the
// shape PizzaCanvas expects, so the served pizza renders identically to the
// one the customer built — true WYSIWYG.

import { pizzaHubActions } from '@/store/pizzaHubSlice';
import { pizzaActions } from '@/store/pizzaSlice';

const ENUM_TO_SIZE = { R: 'regular', M: 'medium', L: 'large' };
const ENUM_TO_CRUST_STYLE = { THIN: 'thin', CLASSIC: 'classic', STUFFED: 'stuffed' };
const ENUM_TO_BAKE_LEVEL = { LIGHT: 'light', GOLDEN: 'golden', WELL_DONE: 'well-done' };

export function pizzaPropsFromOrder(order) {
  const ing = order?.ingredients || {};
  return {
    size: ENUM_TO_SIZE[order?.pizzaSize] || 'medium',
    crustStyle: ENUM_TO_CRUST_STYLE[order?.crustStyle] || 'classic',
    bakeLevel: ENUM_TO_BAKE_LEVEL[order?.bakeLevel] || 'golden',
    base: {
      sauce: { checked: !!ing.sauce },
      mozzarella: { checked: !!ing.mozzarella },
      cheese: { checked: !!ing.cheese },
    },
    toppings: {
      pepperoni: { checked: !!ing.pepperoni, medium: !!ing.pepperoniMedium },
      sausage: { checked: !!ing.sausage, medium: !!ing.sausageMedium },
      peppers: { checked: !!ing.peppers, medium: !!ing.peppersMedium },
      olives: { checked: !!ing.olives, medium: !!ing.olivesMedium },
    },
  };
}

// "Order Again" — restores a past order's exact pizza into the live builder.
export function applyOrderToBuilder(order, dispatch) {
  const props = pizzaPropsFromOrder(order);
  dispatch(pizzaActions.setSize(props.size));
  dispatch(pizzaActions.setCrustStyle(props.crustStyle));
  dispatch(pizzaActions.setBakeLevel(props.bakeLevel));
  dispatch(pizzaHubActions.restorePizza({ base: props.base, toppings: props.toppings }));
}
