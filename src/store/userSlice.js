import { createSlice } from '@reduxjs/toolkit';
import store from '.';

const userSlice = createSlice({
  name: 'user',
  initialState: { loggedIn: false, firstName: '', emailId: '' },
  reducers: {
    setLoggedIn(state, action) {
      state.loggedIn = action.payload;
    },
    setFirstName(state, action) {
      state.firstName = action.payload;
    },
    setEmailId(state, action) {
      state.emailId = action.payload;
    },
  },
});

export const buildUserDataInStore = (userData) => {
  var { emailId, firstName } = userData || {};
  store.dispatch(userActions.setFirstName(firstName));
  store.dispatch(userActions.setEmailId(emailId));
};
export const userActions = userSlice.actions;

export default userSlice;
