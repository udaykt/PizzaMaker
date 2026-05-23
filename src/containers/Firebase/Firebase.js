import api from '../../api/axiosClient';
import store from '../../store';
import { orderActions } from '../../store/orderSlice';
import { buildUserDataInStore } from '../User/User';

// Translate pizzahub Redux state → OrderRequest body expected by the backend
const buildOrderPayload = (orderState) => {
  const { base, toppings } = orderState;
  return {
    sauce:           base.sauce.checked,
    mozzarella:      base.mozzarella.checked,
    cheese:          base.cheese.checked,
    pepperoni:       toppings.pepperoni.checked,
    pepperoniMedium: toppings.pepperoni.checked && toppings.pepperoni.medium,
    sausage:         toppings.sausage.checked,
    sausageMedium:   toppings.sausage.checked && toppings.sausage.medium,
    peppers:         toppings.peppers.checked,
    peppersMedium:   toppings.peppers.checked && toppings.peppers.medium,
    olives:          toppings.olives.checked,
    olivesMedium:    toppings.olives.checked && toppings.olives.medium,
    pizzaSize:       'M',
  };
};

// Called from Checkout.js — user param ignored, auth comes from token via interceptor
const createOrder = async (_user, orderState) => {
  const { data } = await api.post('/api/v1/orders', buildOrderPayload(orderState));
  store.dispatch(orderActions.setCurrentOrder(data));
  return data;
};

const fetchUserOrders = async () => {
  const { data } = await api.get('/api/v1/orders/my');
  store.dispatch(orderActions.setUserOrders(data.content));
  return data.content;
};

const fetchLoggedInUser = async () => {
  const { data } = await api.get('/api/v1/users/me');
  buildUserDataInStore({ uid: data.uid, firstName: data.firstName, emailId: data.emailId, userType: data.userType });
  return data;
};

export { createOrder, fetchUserOrders, fetchLoggedInUser };
export default {};
