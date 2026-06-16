import { createSlice } from '@reduxjs/toolkit';
import { PIZZASIZES } from '@/utils/helpers';

export const CRUST_STYLES = { THIN: 'thin', CLASSIC: 'classic', STUFFED: 'stuffed' };
export const BAKE_LEVELS = { LIGHT: 'light', GOLDEN: 'golden', WELL_DONE: 'well-done' };

const pizzaSlice = createSlice({
  name: 'pizza',
  initialState: {
    isSliced: false,
    size: PIZZASIZES.R,
    crustStyle: CRUST_STYLES.CLASSIC,
    bakeLevel: BAKE_LEVELS.GOLDEN,
  },
  reducers: {
    toggleIsSliced(state) {
      state.isSliced = !state.isSliced;
    },
    setSize(state, action) {
      state.size = action.payload;
    },
    setCrustStyle(state, action) {
      state.crustStyle = action.payload;
    },
    setBakeLevel(state, action) {
      state.bakeLevel = action.payload;
    },
  },
});

export const pizzaActions = pizzaSlice.actions;

export default pizzaSlice;
