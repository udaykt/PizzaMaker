import { configureStore } from '@reduxjs/toolkit';
import headerSlice from './headerSlice';
import pizzahubSlice from './pizzahubSlice';
import pizzaSlice from './pizzaSlice';

const store = configureStore({
  reducer: {
    header: headerSlice.reducer,
    pizzahub: pizzahubSlice.reducer,
    pizza: pizzaSlice.reducer,
  },
});

export default store;
