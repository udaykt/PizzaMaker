import { createSlice } from '@reduxjs/toolkit';
import { PIZZASIZES } from '../components/Utils/Utility';

const pizzaSlice = createSlice({
  name: 'pizza',
  initialState: { isSliced: false, size: PIZZASIZES.R },
  reducers: {
    toggleIsSliced(state) {
      state.isSliced = !state.isSliced;
    },
    setSize(state, action) {
      state.size = action.payload;
    },
  },
});

export const pizzaActions = pizzaSlice.actions;

export default pizzaSlice;
