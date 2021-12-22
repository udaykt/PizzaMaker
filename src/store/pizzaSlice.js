import { createSlice } from '@reduxjs/toolkit';

const pizzaSlice = createSlice({
  name: 'pizza',
  initialState: { isSliced: false },
  reducers: {
    toggleIsSliced(state) {
      state.isSliced = !state.isSliced;
    },
  },
});

export const pizzaActions = pizzaSlice.actions;

export default pizzaSlice;
