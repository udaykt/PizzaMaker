import { createSlice } from '@reduxjs/toolkit';
import { PIZZASIZES } from '@/utils/helpers';

// "Hand Tossed" is the real term Domino's/Pizza Hut use for the standard
// middle-ground crust — "Classic" was a made-up name.
export const CRUST_STYLES = { THIN: 'thin', HAND_TOSSED: 'hand-tossed', STUFFED: 'stuffed' };
// Real chains (Domino's) only offer a binary bake choice, not a 3-tier scale.
export const BAKE_LEVELS = { NORMAL: 'normal', WELL_DONE: 'well-done' };
// The universal Delivery vs Carryout split every pizza chain's checkout offers.
export const DELIVERY_METHODS = { DELIVERY: 'delivery', CARRYOUT: 'carryout' };

// Kept in step with the column width and @Size on the backend (OrderRequest).
export const MAX_CUSTOM_NAME_LENGTH = 40;

const pizzaSlice = createSlice({
  name: 'pizza',
  initialState: {
    // True for the brief window between clicking "Order" and navigating to
    // checkout, while PizzaDisplay plays the one-shot slice animation. See
    // OrderButton and PizzaCanvas's sliceMode prop.
    isSlicing: false,
    // The name the customer typed for their pizza, if they bothered. Empty means
    // "use whatever the generator suggests" — we deliberately do NOT seed this
    // with the suggestion, because then we couldn't tell an accepted suggestion
    // from a deliberate choice, and the name would stop tracking the build.
    customName: '',
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
    setCustomName(state, action) {
      // Bounded here as well as on the server: a name is a title, not an essay.
      state.customName = (action.payload ?? '').slice(0, MAX_CUSTOM_NAME_LENGTH);
    },
    clearCustomName(state) {
      state.customName = '';
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
      // Reset means reset — the name belonged to the pizza you just threw away.
      state.customName = '';
    },
  },
});

export const pizzaActions = pizzaSlice.actions;

export default pizzaSlice;
