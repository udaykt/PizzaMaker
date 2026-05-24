import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    loggedIn: false,
    uid: '',
    firstName: '',
    emailId: '',
    userType: '',
  },
  reducers: {
    setLoggedIn(state, action) {
      state.loggedIn = action.payload;
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
    reset(state) {
      state.loggedIn = false;
      state.uid = '';
      state.firstName = '';
      state.emailId = '';
      state.userType = '';
    },
  },
});

export const authActions = authSlice.actions;

export default authSlice;
