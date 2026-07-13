import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import useOrderUpdates from '@/hooks/useOrderUpdates';
import { fetchUserOrders } from '@/api/appApi';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import { applyOrderToBuilder, orderDisplayLabels, pizzaPropsFromOrder } from '@/features/pizza/PizzaCanvas/fromOrder';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH } from '@/utils/routes';
import { orderPizzaName } from '@/utils/pizzaName';
import { formatPrice } from '@/utils/formatPrice';
import { STATUS_EMOJI, statusLabel } from '@/utils/orderStatusLabels';
import Button from '@/shared/Button/Button';
import LazyMount from '@/shared/LazyMount/LazyMount';
import styles from './orders.module.css';

const STATUS_COLORS = {
  PENDING:    { bg: '#fff3cd', color: '#856404' },
  CONFIRMED:  { bg: '#cce5ff', color: '#004085' },
  PREPARING:  { bg: '#d4edda', color: '#155724' },
  READY:      { bg: '#d1ecf1', color: '#0c5460' },
  DELIVERED:  { bg: '#d6d8d9', color: '#383d41' },
};

// camelCase keys like "veganCheese" need a real label — naive capitalize
// would render "VeganCheese" with no space.
const INGREDIENT_LABELS = {
  mozzarella: 'Mozzarella', provolone: 'Provolone', feta: 'Feta', veganCheese: 'Vegan Cheese',
  pepperoni: 'Pepperoni', sausage: 'Sausage', peppers: 'Peppers', olives: 'Olives',
};

const formatIngredients = (ingredients) => {
  if (!ingredients) return '—';
  // sauceType and the *Quantity fields are strings, not booleans — the
  // strict === true check already excludes them on its own.
  return Object.entries(ingredients)
    .filter(([, v]) => v === true)
    .map(([k]) => INGREDIENT_LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1))
    .join(', ') || 'Plain';
};

const Orders = () => {
  const reduxOrders = useSelector((state) => state.order.userOrders);
  const currentUserUid = useSelector((state) => state.auth.uid);
  const dispatch = useDispatch();
  const history = useHistory();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOrderAgain = (order) => {
    applyOrderToBuilder(order, dispatch);
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
    toast.success('Loaded into the builder — tweak it or order as-is!');
  };

  useEffect(() => { setOrders(reduxOrders); }, [reduxOrders]);

  useEffect(() => {
    setLoading(true);
    fetchUserOrders()
      .catch(() => toast.error('Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLiveUpdate = useCallback((update) => {
    if (update.userUid !== currentUserUid) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.oid === update.oid ? { ...o, status: update.status } : o
      )
    );
    const emoji = STATUS_EMOJI[update.status] || '🍕';
    toast(`${emoji} Order #${update.oid.slice(0, 8)}…: ${statusLabel(update.status)}`, {
      duration: 4000,
      icon: null,
    });
  }, [currentUserUid]);

  useOrderUpdates(handleLiveUpdate);

  if (loading) {
    return (
      <div className={styles.orders}>
        <h1>My Orders</h1>
        <div className={styles.ordersLoading}>
          <div className={styles.spinner} />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.orders}>
      <div className={styles.ordersHeader}>
        <h1>My Orders</h1>
        <span className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          Live
        </span>
      </div>
      {orders.length === 0 ? (
        <div className={styles.ordersEmpty}>
          <span className={styles.ordersEmptyIcon}>🍕</span>
          <p>No orders yet! Go make your first pizza.</p>
        </div>
      ) : (
        <ul className={styles.ordersList}>
          {orders.map((order) => {
            const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            const emoji = STATUS_EMOJI[order.status] || '🍕';
            const labels = orderDisplayLabels(order);
            const canvasProps = pizzaPropsFromOrder(order);
            return (
              <li key={order.oid} className={styles.orderCard}>
                <div className={styles.orderCardHeader}>
                  {/* The name leads, because that's what a customer recognises
                      their order by — the OID is a support handle, not a title. */}
                  <span className={styles.orderName}>{orderPizzaName(order, canvasProps)}</span>
                  <span
                    className={styles.orderStatus}
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {emoji} {statusLabel(order.status)}
                  </span>
                </div>
                <span className={styles.orderOid}>#{order.oid}</span>
                <div className={styles.orderCardBody}>
                  <div className={styles.orderThumb}>
                    <LazyMount placeholder={<div className={styles.thumbPlaceholder} />}>
                      <PizzaCanvas {...canvasProps} textured={false} />
                    </LazyMount>
                  </div>
                  <div className={styles.orderDetails}>
                    <div className={styles.orderDetail}>
                      <span className={styles.orderDetailLabel}>Size</span>
                      <span className={styles.orderDetailValue}>{labels.size}, {labels.crustStyle}</span>
                    </div>
                    <div className={styles.orderDetail}>
                      <span className={styles.orderDetailLabel}>Toppings</span>
                      <span className={styles.orderDetailValue}>{formatIngredients(order.ingredients)}</span>
                    </div>
                    {labels.sauceType !== 'None' && (
                      <div className={styles.orderDetail}>
                        <span className={styles.orderDetailLabel}>Sauce</span>
                        <span className={styles.orderDetailValue}>{labels.sauceType}</span>
                      </div>
                    )}
                    <div className={styles.orderDetail}>
                      <span className={styles.orderDetailLabel}>Method</span>
                      <span className={styles.orderDetailValue}>{labels.deliveryMethod}</span>
                    </div>
                    <div className={styles.orderDetail}>
                      <span className={styles.orderDetailLabel}>Placed</span>
                      <span className={styles.orderDetailValue}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className={styles.orderDetail}>
                      <span className={styles.orderDetailLabel}>Total</span>
                      <span className={`${styles.orderDetailValue} ${styles.orderPrice}`}>{formatPrice(order.price)}</span>
                    </div>
                  </div>
                </div>
                <Button className={styles.orderAgainBtn} onClick={() => handleOrderAgain(order)}>
                  Order Again
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Orders;
