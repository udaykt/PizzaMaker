import { createSlice } from '@reduxjs/toolkit';

const pizzaHubSlice = createSlice({
  name: 'pizzaHub',
  initialState: {
    base: {
      sauce: {
        title: 'sauce',
        checked: false,
        color: 'var(--sauce-color)',
      },
      mozzarella: {
        title: 'mozzarella',
        checked: false,
        color: 'var(--mozzarella-color)',
      },
      cheese: {
        title: 'cheese',
        checked: false,
        color: 'var(--cheese-color)',
      },
    },
    toppings: {
      pepperoni: {
        title: 'pepperoni',
        checked: false,
        medium: false,
      },
      sausage: {
        title: 'sausage',
        checked: false,
        medium: false,
      },
      peppers: {
        title: 'peppers',
        checked: false,
        medium: false,
      },
      olives: {
        title: 'olives',
        checked: false,
        medium: false,
      },
    },
  },
  reducers: {
    toggleTopping(state, action) {
      state.toppings[action.payload.title].checked =
        !state.toppings[action.payload.title].checked;
    },
    // Kept for any existing callers that rely on the toggle behaviour.
    toggleToppingQuantity(state, action) {
      state.toppings[action.payload.title].medium =
        !state.toppings[action.payload.title].medium;
    },
    // Sets quantity explicitly: medium=true for medium, medium=false for regular.
    setToppingMedium(state, action) {
      state.toppings[action.payload.title].medium = action.payload.medium;
    },
    toggleBase(state, action) {
      state.base[action.payload.title].checked =
        !state.base[action.payload.title].checked;
    },
    // Bulk-restore checked/medium flags (e.g. "Order Again"), keeping each
    // item's own title/color so unrelated shape fields aren't disturbed.
    restorePizza(state, action) {
      const { base, toppings } = action.payload;
      Object.entries(base || {}).forEach(([key, value]) => {
        if (state.base[key]) state.base[key].checked = !!value.checked;
      });
      Object.entries(toppings || {}).forEach(([key, value]) => {
        if (state.toppings[key]) {
          state.toppings[key].checked = !!value.checked;
          state.toppings[key].medium = !!value.medium;
        }
      });
    },
  },
});

export const pizzaHubActions = pizzaHubSlice.actions;

// Checks whether the pizza has any selection at all (no base, no toppings).
// Uses field-level comparison so shape differences (e.g. color) don't matter.
export const isPizzaEmpty = (state) => {
  const noBase = Object.values(state.base).every((b) => !b.checked);
  const noToppings = Object.values(state.toppings).every((t) => !t.checked);
  return noBase && noToppings;
};

export default pizzaHubSlice;
