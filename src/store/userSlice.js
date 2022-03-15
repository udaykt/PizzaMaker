import { createSlice } from '@reduxjs/toolkit';
import store from '.';
import { auth } from '../containers/Firebase/Firebase';

const userSlice = createSlice({
  name: 'user',
  initialState: { loggedIn: false, firstName: '', emailId: '' },
  reducers: {
    setLoggedIn(state, action) {
      state.loggedIn = auth.currentUser ? true : false;
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
  const { emailId, firstName } = userData || {};
  store.dispatch(userActions.setFirstName(firstName));
  store.dispatch(userActions.setEmailId(emailId));
};
export const userActions = userSlice.actions;

export default userSlice;
