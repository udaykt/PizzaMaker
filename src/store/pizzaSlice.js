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
    // True for the brief window between clicking "Order" and navigating to
    // checkout, while PizzaDisplay plays the one-shot slice animation. See
    // OrderButton and PizzaCanvas's sliceMode prop.
    isSlicing: false,
    size: PIZZASIZES.R,
    crustStyle: CRUST_STYLES.HAND_TOSSED,
    bakeLevel: BAKE_LEVELS.NORMAL,
    deliveryMethod: DELIVERY_METHODS.DELIVERY,
  },
  reducers: {
    startSlicing(state) {
      state.isSlicing = true;
    },
    stopSlicing(state) {
      state.isSlicing = false;
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
    resetPizza(state) {
      state.size = PIZZASIZES.R;
      state.crustStyle = CRUST_STYLES.HAND_TOSSED;
      state.bakeLevel = BAKE_LEVELS.NORMAL;
    },
  },
});

export const pizzaActions = pizzaSlice.actions;

export default pizzaSlice;
