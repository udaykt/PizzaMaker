import toast from 'react-hot-toast';
import api from '@/api/axiosClient';
import store from '@/store';
import { navigationActions } from '@/store/navigationSlice';
import { orderActions } from '@/store/orderSlice';
import { buildUserDataInStore } from '@/utils/userState';

const SIZE_TO_ENUM = { regular: 'R', medium: 'M', large: 'L' };
const CRUST_STYLE_TO_ENUM = { thin: 'THIN', classic: 'CLASSIC', stuffed: 'STUFFED' };
const BAKE_LEVEL_TO_ENUM = { light: 'LIGHT', golden: 'GOLDEN', 'well-done': 'WELL_DONE' };

const buildOrderPayload = (orderState) => {
  const { base, toppings } = orderState;
  const pizzaState = store.getState().pizza;
  const selectedSize = pizzaState.size;
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
    pizzaSize:       SIZE_TO_ENUM[selectedSize] || 'M',
    crustStyle:      CRUST_STYLE_TO_ENUM[pizzaState.crustStyle] || 'CLASSIC',
    bakeLevel:       BAKE_LEVEL_TO_ENUM[pizzaState.bakeLevel] || 'GOLDEN',
  };
};

const createOrder = async (_user, orderState) => {
  const { data } = await api.post('/api/v1/orders', buildOrderPayload(orderState));
  store.dispatch(orderActions.setCurrentOrder(data));
  toast.success(`Order #${data.oid} placed! We're making your pizza.`);
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

const fetchMenuPricing = async () => {
  try {
    const { data } = await api.get('/api/v1/menu/sizes');
    store.dispatch(navigationActions.setSizePricing(data));
  } catch (_) {
    // fallback defaults already in slice
  }
};

export { createOrder, fetchUserOrders, fetchLoggedInUser, fetchMenuPricing };
