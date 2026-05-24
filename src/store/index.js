import { configureStore } from '@reduxjs/toolkit';
import dashboardSlice from './dashboardSlice';
import navigationSlice from './navigationSlice';
import navSlice from './navSlice';
import orderSlice from './orderSlice';
import pizzaHubSlice from './pizzaHubSlice';
import pizzaSlice from './pizzaSlice';
import uiSlice from './uiSlice';
import authSlice from './authSlice';

const store = configureStore({
  reducer: {
    navigation: navigationSlice.reducer,
    nav: navSlice.reducer,
    pizzaHub: pizzaHubSlice.reducer,
    pizza: pizzaSlice.reducer,
    auth: authSlice.reducer,
    dashboard: dashboardSlice.reducer,
    order: orderSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware(),
});

export default store;
