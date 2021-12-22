import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
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

export const headerActions = authSlice.actions;

export default authSlice;
