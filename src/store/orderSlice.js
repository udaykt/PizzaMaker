import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'order',
  initialState: { currentOrder: '' },
  reducers: {
    setCurrentOrder(state, action) {
      state.currentOrder = action.payload;
      console.log(action.payload);
    },
  },
});

export const orderActions = orderSlice.actions;

export default orderSlice;
