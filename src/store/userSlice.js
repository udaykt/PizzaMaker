import { createSlice } from '@reduxjs/toolkit';
import { auth } from '../containers/Firebase/Firebase';

const userSlice = createSlice({
  name: 'user',
  initialState: { loggedIn: false, firstName: '', emailId: '' },
  reducers: {
    setLoggedIn(state) {
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

export const userActions = userSlice.actions;

export default userSlice;
