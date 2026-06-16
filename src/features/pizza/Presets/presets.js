// Quick-start pizza presets — tapping one loads its full config into the
// live builder via the same restorePizza mechanism "Order Again" uses, so
// it's instantly a real, editable pizza, not a static picture.
//
// Deliberately scoped to ingredients this app actually has (pepperoni,
// sausage, peppers, olives; no ham/pineapple/chicken/basil) — Hawaiian and
// "BBQ Chicken" would be dishonest names for a pizza we can't really put
// ham, pineapple, or chicken on.

const noToppings = () => ({
  pepperoni: { checked: false, quantity: 'regular' },
  sausage: { checked: false, quantity: 'regular' },
  peppers: { checked: false, quantity: 'regular' },
  olives: { checked: false, quantity: 'regular' },
});

const noCheese = () => ({
  mozzarella: { checked: false },
  provolone: { checked: false },
  feta: { checked: false },
  veganCheese: { checked: false },
});

export const PRESET_PIZZAS = [
  {
    id: 'supreme',
    name: 'Supreme',
    config: {
      size: 'medium',
      crustStyle: 'hand-tossed',
      bakeLevel: 'normal',
      base: { sauce: { sauceType: 'robust-tomato' }, ...noCheese(), mozzarella: { checked: true } },
      toppings: {
        pepperoni: { checked: true, quantity: 'regular' },
        sausage: { checked: true, quantity: 'regular' },
        peppers: { checked: true, quantity: 'regular' },
        olives: { checked: true, quantity: 'regular' },
      },
    },
  },
  {
    id: 'meat-lovers',
    name: "Meat Lover's",
    config: {
      size: 'medium',
      crustStyle: 'hand-tossed',
      bakeLevel: 'normal',
      base: { sauce: { sauceType: 'robust-tomato' }, ...noCheese(), mozzarella: { checked: true }, provolone: { checked: true } },
      toppings: {
        ...noToppings(),
        pepperoni: { checked: true, quantity: 'extra' },
        sausage: { checked: true, quantity: 'extra' },
      },
    },
  },
  {
    id: 'veggie',
    name: 'Veggie',
    config: {
      size: 'medium',
      crustStyle: 'thin',
      bakeLevel: 'normal',
      base: { sauce: { sauceType: 'marinara' }, ...noCheese(), mozzarella: { checked: true } },
      toppings: {
        ...noToppings(),
        peppers: { checked: true, quantity: 'extra' },
        olives: { checked: true, quantity: 'extra' },
      },
    },
  },
  {
    id: 'bbq-sausage',
    name: 'BBQ Sausage',
    config: {
      size: 'medium',
      crustStyle: 'hand-tossed',
      bakeLevel: 'well-done',
      base: { sauce: { sauceType: 'bbq' }, ...noCheese(), mozzarella: { checked: true } },
      toppings: { ...noToppings(), sausage: { checked: true, quantity: 'extra' } },
    },
  },
  {
    id: 'margherita',
    name: 'Margherita',
    config: {
      size: 'medium',
      crustStyle: 'thin',
      bakeLevel: 'normal',
      base: { sauce: { sauceType: 'marinara' }, ...noCheese(), mozzarella: { checked: true } },
      toppings: noToppings(),
    },
  },
  {
    id: 'white-feta',
    name: 'White & Feta',
    config: {
      size: 'medium',
      crustStyle: 'hand-tossed',
      bakeLevel: 'normal',
      base: { sauce: { sauceType: 'garlic-parmesan' }, ...noCheese(), mozzarella: { checked: true }, feta: { checked: true } },
      toppings: { ...noToppings(), olives: { checked: true, quantity: 'regular' } },
    },
  },
];
