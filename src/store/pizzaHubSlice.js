import { createSlice } from '@reduxjs/toolkit';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';

// Light/Regular/Extra — the same tiers Domino's, Pizza Hut, and Papa John's
// use on their own online ordering, rather than an in-house "medium" scale.
export const TOPPING_QUANTITIES = { LIGHT: 'light', REGULAR: 'regular', EXTRA: 'extra' };

// A pizza has exactly one sauce (or none) — Domino's real sauce menu.
export const SAUCE_TYPES = {
  NONE: 'none',
  ROBUST_TOMATO: 'robust-tomato',
  MARINARA: 'marinara',
  GARLIC_PARMESAN: 'garlic-parmesan',
  ALFREDO: 'alfredo',
  BBQ: 'bbq',
};

const pizzaHubSlice = createSlice({
  name: 'pizzaHub',
  initialState: {
    base: {
      sauce: {
        title: 'sauce',
        sauceType: SAUCE_TYPES.NONE,
      },
      // Cheese types are independent toggles — a pizza can combine
      // mozzarella with feta, unlike sauce, which is a single choice.
      mozzarella: {
        title: 'mozzarella',
        checked: false,
      },
      cheddar: {
        title: 'cheddar',
        checked: false,
      },
      parmesanAsiago: {
        title: 'parmesan & asiago',
        checked: false,
      },
      feta: {
        title: 'feta',
        checked: false,
      },
      ricotta: {
        title: 'ricotta',
        checked: false,
      },
      veganCheese: {
        title: 'vegan cheese',
        checked: false,
      },
    },
    // Built from the topping catalog so a new topping needs no edit here —
    // each starts unchecked at regular quantity, keyed by its catalog id.
    toppings: Object.fromEntries(
      TOPPING_CATALOG.map((t) => [
        t.id,
        { title: t.id, checked: false, quantity: TOPPING_QUANTITIES.REGULAR },
      ])
    ),
  },
  reducers: {
    toggleTopping(state, action) {
      state.toppings[action.payload.title].checked =
        !state.toppings[action.payload.title].checked;
    },
    // Sets quantity explicitly to one of TOPPING_QUANTITIES.
    setToppingQuantity(state, action) {
      state.toppings[action.payload.title].quantity = action.payload.quantity;
    },
    toggleBase(state, action) {
      state.base[action.payload].checked = !state.base[action.payload].checked;
    },
    // Sauce is a single choice, not a toggle — set it explicitly.
    setSauceType(state, action) {
      state.base.sauce.sauceType = action.payload;
    },
    // Bulk-restore checked/quantity/sauceType flags (e.g. "Order Again" or a
    // preset pizza), keeping each item's own title so unrelated shape fields
    // aren't disturbed.
    restorePizza(state, action) {
      const { base, toppings } = action.payload;
      Object.entries(base || {}).forEach(([key, value]) => {
        if (!state.base[key]) return;
        if (key === 'sauce') {
          state.base.sauce.sauceType = value.sauceType || SAUCE_TYPES.NONE;
        } else {
          state.base[key].checked = !!value.checked;
        }
      });
      Object.entries(toppings || {}).forEach(([key, value]) => {
        if (state.toppings[key]) {
          state.toppings[key].checked = !!value.checked;
          state.toppings[key].quantity = value.quantity || TOPPING_QUANTITIES.REGULAR;
        }
      });
    },
  },
});

export const pizzaHubActions = pizzaHubSlice.actions;

// Checks whether the pizza has any selection at all (no base, no toppings).
// Uses field-level comparison so shape differences don't matter — sauce is
// "set" when it has a real type, every other base item when checked.
export const isPizzaEmpty = (state) => {
  const noBase = Object.entries(state.base).every(([key, b]) =>
    key === 'sauce' ? b.sauceType === SAUCE_TYPES.NONE : !b.checked
  );
  const noToppings = Object.values(state.toppings).every((t) => !t.checked);
  return noBase && noToppings;
};

export default pizzaHubSlice;
