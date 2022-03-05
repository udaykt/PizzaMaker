import { createSlice } from '@reduxjs/toolkit';

const pizzahubSlice = createSlice({
  name: 'pizzahub',
  initialState: {
    base: {
      sauce: {
        title: 'sauce',
        checked: false,
      },
      mozzarella: {
        title: 'mozzarella',
        checked: false,
      },
      cheese: {
        title: 'cheese',
        checked: false,
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
    toggleToppingQuantity(state, action) {
      state.toppings[action.payload.title].medium =
        !state.toppings[action.payload.title].medium;
    },
    toggleBase(state, action) {
      state.base[action.payload.title].checked =
        !state.base[action.payload.title].checked;
    },
  },
});

export const pizzahubActions = pizzahubSlice.actions;

export default pizzahubSlice;
