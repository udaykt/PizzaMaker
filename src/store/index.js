import { configureStore } from '@reduxjs/toolkit';
import headerSlice from './headerSlice';
import pizzahubSlice from './pizzahubSlice';
import pizzaSlice from './pizzaSlice';
import userSlice from './userSlice';

const store = configureStore({
  reducer: {
    header: headerSlice.reducer,
    pizzahub: pizzahubSlice.reducer,
    pizza: pizzaSlice.reducer,
    user: userSlice.reducer,
  },
});

export default store;
