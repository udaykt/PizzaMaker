import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isPizzaEmpty } from '@/store/pizzaHubSlice';
import { computePriceBreakdown } from '@/utils/pricing';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/shared/Button/Button';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import { CONFIRM_PATH, HOME_PATH } from '@/utils/routes';
import { createOrder } from '@/api/appApi';
import { uiActions } from '@/store/uiSlice';
import styles from './checkout.module.css';

const SIZE_LABELS = { regular: 'Regular', medium: 'Medium', large: 'Large' };
const CRUST_STYLE_LABELS = { thin: 'Thin', classic: 'Classic', stuffed: 'Stuffed' };
const BAKE_LEVEL_LABELS = { light: 'Light', golden: 'Golden', 'well-done': 'Well-done' };

const Checkout = () => {
  const orderState = useSelector((state) => state.pizzaHub);
  const { base: baseState, toppings: toppingsState } = orderState;
  const sizePricing = useSelector((state) => state.navigation.sizePricing);
  const pizzaSize = useSelector((state) => state.pizza.size);
  const crustStyle = useSelector((state) => state.pizza.crustStyle);
  const bakeLevel = useSelector((state) => state.pizza.bakeLevel);

  const history = useHistory();
  const dispatch = useDispatch();

  const customizeHandler = () => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  const orderHandler = () => {
    createOrder(null, orderState)
      .then((order) => {
        // setCurrentOrder is already dispatched inside createOrder (appApi)
        history.push(CONFIRM_PATH + '?orderId=' + order.oid);
      })
      .catch((e) => {
        console.error('Error in creating order' + e);
      });
  };

  const empty = isPizzaEmpty(orderState);

  if (empty) {
    return (
      <div className={styles.checkoutEmpty}>
        <span className={styles.emptyIcon}>🍕</span>
        <p>Nothing to checkout yet.</p>
        <Button className={styles.emptyCta} onClick={customizeHandler}>
          Customize Your Pizza
        </Button>
      </div>
    );
  }

  const { lineItems, total } = computePriceBreakdown({
    base: baseState,
    toppings: toppingsState,
    sizePricing,
    size: pizzaSize,
  });

  return (
    <div className={styles.checkout}>
      <div className={styles.previewPanel}>
        <div className={styles.previewGlow} />
        <PizzaCanvas editable />
      </div>

      <div className={styles.ticketCard}>
        <h2 className={styles.ticketHeader}>Your Pizza</h2>

        <div className={styles.ticketRow}>
          <span className={styles.ticketLabel}>Size</span>
          <span className={styles.ticketValue}>{SIZE_LABELS[pizzaSize] || 'Medium'}</span>
        </div>
        <div className={styles.ticketRow}>
          <span className={styles.ticketLabel}>Crust</span>
          <span className={styles.ticketValue}>
            {CRUST_STYLE_LABELS[crustStyle] || 'Classic'}, {BAKE_LEVEL_LABELS[bakeLevel] || 'Golden'}
          </span>
        </div>

        <div className={styles.ticketDivider} />

        {lineItems.map((item) => (
          <div className={styles.ticketRow} key={item.key}>
            <span className={styles.ticketLabel}>{item.label}</span>
            <span className={styles.ticketValue}>{formatPrice(item.price)}</span>
          </div>
        ))}

        <div className={styles.ticketDivider} />

        <div className={styles.ticketRow}>
          <span className={styles.ticketTotalLabel}>Total</span>
          <span className={styles.ticketTotalValue}>{formatPrice(total)}</span>
        </div>

        <div className={styles.checkoutButtons}>
          <Button className={styles.customizeButton} onClick={customizeHandler}>
            Customize
          </Button>
          <Button className={styles.checkoutOrderButton} onClick={orderHandler}>
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
