import { configureStore } from '@reduxjs/toolkit';
import dashboardSlice from './dashboardSlice';
import headerSlice from './headerSlice';
import orderSlice from './orderSlice';
import pizzahubSlice from './pizzahubSlice';
import pizzaSlice from './pizzaSlice';
import uiSlice from './uiSlice';
import userSlice from './userSlice';

const store = configureStore({
  reducer: {
    header: headerSlice.reducer,
    pizzahub: pizzahubSlice.reducer,
    pizza: pizzaSlice.reducer,
    user: userSlice.reducer,
    dashboard: dashboardSlice.reducer,
    order: orderSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
