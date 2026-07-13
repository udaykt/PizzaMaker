import toast from 'react-hot-toast';
import api from '@/api/axiosClient';
import store from '@/store';
import { navigationActions } from '@/store/navigationSlice';
import { orderActions } from '@/store/orderSlice';
import { buildUserDataInStore } from '@/utils/userState';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';

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
  const payload = {
    sauceType:         SAUCE_TYPE_TO_ENUM[base.sauce.sauceType] || 'NONE',
    mozzarella:        base.mozzarella.checked,
    cheddar:           base.cheddar.checked,
    parmesanAsiago:    base.parmesanAsiago.checked,
    feta:              base.feta.checked,
    ricotta:           base.ricotta.checked,
    veganCheese:       base.veganCheese.checked,
    pizzaSize:         SIZE_TO_ENUM[selectedSize] || 'M',
    crustStyle:        CRUST_STYLE_TO_ENUM[pizzaState.crustStyle] || 'HAND_TOSSED',
    bakeLevel:         BAKE_LEVEL_TO_ENUM[pizzaState.bakeLevel] || 'NORMAL',
    deliveryMethod:    DELIVERY_METHOD_TO_ENUM[pizzaState.deliveryMethod] || 'DELIVERY',
  };
  // Toppings are sent as a generic list of the selected ones, driven by the
  // catalog, so adding a topping needs no edit here.
  payload.toppings = TOPPING_CATALOG.filter((t) => toppings[t.id].checked).map((t) => ({
    id: t.id,
    quantity: QUANTITY_TO_ENUM[toppings[t.id].quantity] || 'REGULAR',
  }));
  return payload;
};

// idempotencyKey is forwarded as the Idempotency-Key header the backend already
// keys a unique index on: if this exact request is ever sent twice (a double
// click racing the click-guard in Checkout, a browser retry, etc.) the backend
// returns the original order instead of creating a second one.
const createOrder = async (idempotencyKey, orderState) => {
  const { data } = await api.post('/api/v1/orders', buildOrderPayload(orderState), {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
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
