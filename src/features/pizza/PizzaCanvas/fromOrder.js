// Map a placed order (flat ingredient booleans + R/M/L size) back into the
// shape PizzaCanvas expects, so the served pizza renders identically to the
// one the customer built — true WYSIWYG.

const ENUM_TO_SIZE = { R: 'regular', M: 'medium', L: 'large' };

export function pizzaPropsFromOrder(order) {
  const ing = order?.ingredients || {};
  return {
    size: ENUM_TO_SIZE[order?.pizzaSize] || 'medium',
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
