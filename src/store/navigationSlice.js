import { createSlice } from '@reduxjs/toolkit';

const LOGIN_PATH = '/login';
const SIGNUP_PATH = '/signup';
const GUEST_PATH = '/guest';
const MENU_PATH = '/menu';
const PROFILE_PATH = '/profile';
const HOME_PATH = '/';

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    showLoginPage: false,
    showMenuPage: false,
    showSignUpPage: false,
    showGuestPage: false,
    showProfileMenu: false,
    sizePricing: { R: 8, M: 12, L: 16 },
    menuPath: MENU_PATH,
    loginPath: LOGIN_PATH,
    signupPath: SIGNUP_PATH,
    guestPath: GUEST_PATH,
    homePath: HOME_PATH,
    profilePath: PROFILE_PATH,
  },
  reducers: {
    toggleMenuPage(state) {
      state.showMenuPage = !state.showMenuPage;
      if (state.menuPath === MENU_PATH) state.menuPath = HOME_PATH;
      else state.menuPath = MENU_PATH;
    },
    toggleLoginPage(state) {
      state.showLoginPage = !state.showLoginPage;
      if (state.loginPath === LOGIN_PATH) state.loginPath = HOME_PATH;
      else state.loginPath = LOGIN_PATH;
    },
    toggleSignupPage(state) {
      state.showSignUpPage = !state.showSignUpPage;
      if (state.signupPath === SIGNUP_PATH) state.signupPath = HOME_PATH;
      else state.signupPath = SIGNUP_PATH;
    },
    toggleGuestPage(state) {
      state.showGuestPage = !state.showGuestPage;
      if (state.guestPath === GUEST_PATH) state.guestPath = HOME_PATH;
      else state.guestPath = GUEST_PATH;
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
