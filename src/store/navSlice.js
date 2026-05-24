import { createSlice } from '@reduxjs/toolkit';

const navSlice = createSlice({
  name: 'nav',
  initialState: {
    showLoginPage: false,
    showMenuPage: false,
    sizePricing: { R: 8, M: 12, L: 16 },
  },
  reducers: {
    toggleLoginPage(state) {
      state.showLoginPage = !state.showLoginPage;
    },
    toggleMenuPage(state) {
      state.showMenuPage = !state.showMenuPage;
    },
    setSizePricing(state, action) {
      state.sizePricing = action.payload;
    },
  },
});

export const navActions = navSlice.actions;

export default navSlice;
