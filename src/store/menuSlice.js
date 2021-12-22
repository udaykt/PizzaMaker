import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
  name: 'menu',
  initialState: { showLoginPage: false, showMenuPage: false },
  reducers: {
    toggleLoginPage(state) {
      state.showLoginPage = !state.showLoginPage;
    },
    toggleMenuPage(state) {
      state.showMenuPage = !state.showMenuPage;
    },
  },
});

export const menuActions = menuSlice.actions;

export default menuSlice;
