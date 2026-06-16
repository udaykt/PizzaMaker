import { createSlice } from '@reduxjs/toolkit';
import { PIZZASIZES } from '@/utils/helpers';

// "Hand Tossed" is the real term Domino's/Pizza Hut use for the standard
// middle-ground crust — "Classic" was a made-up name.
export const CRUST_STYLES = { THIN: 'thin', HAND_TOSSED: 'hand-tossed', STUFFED: 'stuffed' };
// Real chains (Domino's) only offer a binary bake choice, not a 3-tier scale.
export const BAKE_LEVELS = { NORMAL: 'normal', WELL_DONE: 'well-done' };
// The universal Delivery vs Carryout split every pizza chain's checkout offers.
export const DELIVERY_METHODS = { DELIVERY: 'delivery', CARRYOUT: 'carryout' };

const pizzaSlice = createSlice({
  name: 'pizza',
  initialState: {
    isSliced: false,
    size: PIZZASIZES.R,
    crustStyle: CRUST_STYLES.HAND_TOSSED,
    bakeLevel: BAKE_LEVELS.NORMAL,
    deliveryMethod: DELIVERY_METHODS.DELIVERY,
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
    setDeliveryMethod(state, action) {
      state.deliveryMethod = action.payload;
    },
  },
});

export const pizzaActions = pizzaSlice.actions;

export default pizzaSlice;
