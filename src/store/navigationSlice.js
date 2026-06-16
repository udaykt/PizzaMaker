import { createSlice } from '@reduxjs/toolkit';

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    showLoginPage: false,
    showMenuPage: false,
    showSignUpPage: false,
    showProfileMenu: false,
    sizePricing: { R: 8, M: 12, L: 16 },
  },
  reducers: {
    toggleMenuPage(state) {
      state.showMenuPage = !state.showMenuPage;
    },
    toggleLoginPage(state) {
      state.showLoginPage = !state.showLoginPage;
    },
    toggleSignupPage(state) {
      state.showSignUpPage = !state.showSignUpPage;
    },
    toggleProfileMenu(state, action) {
      state.showProfileMenu = action.payload;
    },
    setSizePricing(state, action) {
      state.sizePricing = action.payload;
    },
  },
});

export const navigationActions = navigationSlice.actions;

export default navigationSlice;
