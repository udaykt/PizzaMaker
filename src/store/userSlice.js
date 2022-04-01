import { createSlice } from '@reduxjs/toolkit';
import { auth } from '../containers/Firebase/Firebase';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    loggedIn: false,
    uid: '',
    firstName: '',
    emailId: '',
    userType: '',
  },
  reducers: {
    setLoggedIn(state) {
      state.loggedIn = auth.currentUser ? true : false;
    },
    setUid(state, action) {
      state.uid = action.payload;
    },
    setFirstName(state, action) {
      state.firstName = action.payload;
    },
    setEmailId(state, action) {
      state.emailId = action.payload;
    },
    setUserType(state, action) {
      state.userType = action.payload;
    },
  },
});

export const userActions = userSlice.actions;

export default userSlice;
