import toast from 'react-hot-toast';
import api from '@/api/axiosClient';
import store from '@/store';
import { navigationActions } from '@/store/navigationSlice';
import { orderActions } from '@/store/orderSlice';
import { buildUserDataInStore } from '@/utils/userState';

const SIZE_TO_ENUM = { small: 'R', medium: 'M', large: 'L' };
const CRUST_STYLE_TO_ENUM = { thin: 'THIN', 'hand-tossed': 'HAND_TOSSED', stuffed: 'STUFFED' };
const BAKE_LEVEL_TO_ENUM = { normal: 'NORMAL', 'well-done': 'WELL_DONE' };
const QUANTITY_TO_ENUM = { light: 'LIGHT', regular: 'REGULAR', extra: 'EXTRA' };
const DELIVERY_METHOD_TO_ENUM = { delivery: 'DELIVERY', carryout: 'CARRYOUT' };
const SAUCE_TYPE_TO_ENUM = {
  none: 'NONE',
  'robust-tomato': 'ROBUST_TOMATO',
  marinara: 'MARINARA',
  'garlic-parmesan': 'GARLIC_PARMESAN',
  alfredo: 'ALFREDO',
  bbq: 'BBQ',
};

const buildOrderPayload = (orderState) => {
  const { base, toppings } = orderState;
  const pizzaState = store.getState().pizza;
  const selectedSize = pizzaState.size;
  return {
    sauceType:         SAUCE_TYPE_TO_ENUM[base.sauce.sauceType] || 'NONE',
    mozzarella:        base.mozzarella.checked,
    provolone:         base.provolone.checked,
    feta:              base.feta.checked,
    veganCheese:       base.veganCheese.checked,
    pepperoni:         toppings.pepperoni.checked,
    pepperoniQuantity: QUANTITY_TO_ENUM[toppings.pepperoni.quantity] || 'REGULAR',
    sausage:           toppings.sausage.checked,
    sausageQuantity:   QUANTITY_TO_ENUM[toppings.sausage.quantity] || 'REGULAR',
    peppers:           toppings.peppers.checked,
    peppersQuantity:   QUANTITY_TO_ENUM[toppings.peppers.quantity] || 'REGULAR',
    olives:            toppings.olives.checked,
    olivesQuantity:    QUANTITY_TO_ENUM[toppings.olives.quantity] || 'REGULAR',
    pizzaSize:         SIZE_TO_ENUM[selectedSize] || 'M',
    crustStyle:        CRUST_STYLE_TO_ENUM[pizzaState.crustStyle] || 'HAND_TOSSED',
    bakeLevel:         BAKE_LEVEL_TO_ENUM[pizzaState.bakeLevel] || 'NORMAL',
    deliveryMethod:    DELIVERY_METHOD_TO_ENUM[pizzaState.deliveryMethod] || 'DELIVERY',
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
