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
        medium: false,
        checked: false,
      },
      sausage: {
        title: 'sausage',
        medium: false,
        checked: false,
      },
      peppers: {
        title: 'peppers',
        medium: false,
        checked: false,
      },
      olives: {
        title: 'olives',
        medium: false,
        checked: false,
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
