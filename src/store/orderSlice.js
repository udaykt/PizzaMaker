import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'order',
  initialState: { currentOrder: null, userOrders: [] },
  reducers: {
    setCurrentOrder(state, action) {
      state.currentOrder = action.payload;
    },
    setUserOrders(state, action) {
      state.userOrders = action.payload;
    },
  },
});

export const orderActions = orderSlice.actions;

export default orderSlice;
