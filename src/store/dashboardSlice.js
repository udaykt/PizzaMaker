import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { showProfile: false, showMenuPage: false },
  reducers: {
    toggleLoginPage(state) {
      state.showLoginPage = !state.showLoginPage;
    },
    toggleMenuPage(state) {
      state.showMenuPage = !state.showMenuPage;
    },
  },
});

export const headerActions = dashboardSlice.actions;

export default dashboardSlice;
