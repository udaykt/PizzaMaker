import { createSlice } from '@reduxjs/toolkit';

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
  },
});

export const userActions = userSlice.actions;

export default userSlice;
