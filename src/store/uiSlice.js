import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { backdrop: false },
  reducers: {
    setBackdrop(state, action) {
      state.backdrop = action.payload;
    },
  },
});

export const uiActions = uiSlice.actions;

export default uiSlice;
