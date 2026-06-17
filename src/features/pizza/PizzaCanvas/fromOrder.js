// Map a placed order (flat ingredient booleans + R/M/L size) back into the
// shape PizzaCanvas expects, so the served pizza renders identically to the
// one the customer built — true WYSIWYG.

import { pizzaHubActions } from '@/store/pizzaHubSlice';
import { pizzaActions } from '@/store/pizzaSlice';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';

const ENUM_TO_SIZE = { R: 'small', M: 'medium', L: 'large' };
const ENUM_TO_CRUST_STYLE = { THIN: 'thin', HAND_TOSSED: 'hand-tossed', STUFFED: 'stuffed' };
const ENUM_TO_BAKE_LEVEL = { NORMAL: 'normal', WELL_DONE: 'well-done' };
const ENUM_TO_QUANTITY = { LIGHT: 'light', REGULAR: 'regular', EXTRA: 'extra' };
const ENUM_TO_DELIVERY_METHOD = { DELIVERY: 'delivery', CARRYOUT: 'carryout' };
const ENUM_TO_SAUCE_TYPE = {
  NONE: 'none',
  ROBUST_TOMATO: 'robust-tomato',
  MARINARA: 'marinara',
  GARLIC_PARMESAN: 'garlic-parmesan',
  ALFREDO: 'alfredo',
  BBQ: 'bbq',
};

// Sizes shown with their inch diameter, the way every major chain's
// ordering UI does (10"/12"/14").
const SIZE_LABEL = { R: 'Small (10")', M: 'Medium (12")', L: 'Large (14")' };
const CRUST_STYLE_LABEL = { THIN: 'Thin', HAND_TOSSED: 'Hand Tossed', STUFFED: 'Stuffed' };
const BAKE_LEVEL_LABEL = { NORMAL: 'Normal Bake', WELL_DONE: 'Well Done' };
const DELIVERY_METHOD_LABEL = { DELIVERY: 'Delivery', CARRYOUT: 'Carryout' };
const SAUCE_TYPE_LABEL = {
  NONE: 'None',
  ROBUST_TOMATO: 'Robust Tomato',
  MARINARA: 'Marinara',
  GARLIC_PARMESAN: 'Garlic Parmesan',
  ALFREDO: 'Alfredo',
  BBQ: 'BBQ',
};

// Human-readable size/crust/bake/sauce/delivery text for receipts and order
// lists — distinct from pizzaPropsFromOrder's lowercase keys, which feed
// PizzaCanvas.
export function orderDisplayLabels(order) {
  return {
    size: SIZE_LABEL[order?.pizzaSize] || 'Medium (12")',
    crustStyle: CRUST_STYLE_LABEL[order?.crustStyle] || 'Hand Tossed',
    bakeLevel: BAKE_LEVEL_LABEL[order?.bakeLevel] || 'Normal Bake',
    deliveryMethod: DELIVERY_METHOD_LABEL[order?.deliveryMethod] || 'Delivery',
    sauceType: SAUCE_TYPE_LABEL[order?.ingredients?.sauceType] || 'None',
  };
}

export function pizzaPropsFromOrder(order) {
  const ing = order?.ingredients || {};
  return {
    size: ENUM_TO_SIZE[order?.pizzaSize] || 'medium',
    crustStyle: ENUM_TO_CRUST_STYLE[order?.crustStyle] || 'hand-tossed',
    bakeLevel: ENUM_TO_BAKE_LEVEL[order?.bakeLevel] || 'normal',
    base: {
      sauce: { sauceType: ENUM_TO_SAUCE_TYPE[ing.sauceType] || 'none' },
      mozzarella: { checked: !!ing.mozzarella },
      provolone: { checked: !!ing.provolone },
      feta: { checked: !!ing.feta },
      veganCheese: { checked: !!ing.veganCheese },
    },
    toppings: Object.fromEntries(
      TOPPING_CATALOG.map((t) => [
        t.id,
        { checked: !!ing[t.id], quantity: ENUM_TO_QUANTITY[ing[`${t.id}Quantity`]] || 'regular' },
      ])
    ),
  };
}

export function deliveryMethodFromOrder(order) {
  return ENUM_TO_DELIVERY_METHOD[order?.deliveryMethod] || 'delivery';
}

// Shared by "Order Again" and preset pizzas — both just need to push a
// frontend-shaped pizza config (the same shape pizzaPropsFromOrder returns)
// into the live builder's redux state.
export function applyPizzaConfigToBuilder(props, dispatch) {
  dispatch(pizzaActions.setSize(props.size));
  dispatch(pizzaActions.setCrustStyle(props.crustStyle));
  dispatch(pizzaActions.setBakeLevel(props.bakeLevel));
  if (props.deliveryMethod) dispatch(pizzaActions.setDeliveryMethod(props.deliveryMethod));
  dispatch(pizzaHubActions.restorePizza({ base: props.base, toppings: props.toppings }));
}

// "Order Again" — restores a past order's exact pizza into the live builder.
export function applyOrderToBuilder(order, dispatch) {
  const props = pizzaPropsFromOrder(order);
  applyPizzaConfigToBuilder({ ...props, deliveryMethod: deliveryMethodFromOrder(order) }, dispatch);
}
