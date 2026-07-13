import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isPizzaEmpty } from '@/store/pizzaHubSlice';
import { pizzaActions, DELIVERY_METHODS } from '@/store/pizzaSlice';
import { computePriceBreakdown } from '@/utils/pricing';
import { pizzaName } from '@/utils/pizzaName';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/shared/Button/Button';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import { CONFIRM_PATH, HOME_PATH } from '@/utils/routes';
import { createOrder } from '@/api/appApi';
import { uiActions } from '@/store/uiSlice';
import styles from './checkout.module.css';

// crypto.randomUUID() needs a secure context (HTTPS or localhost), which is what
// this app is always served over — but a tiny fallback keeps a rare older
// browser from crashing on this rather than being able to place an order at all.
const generateIdempotencyKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const SIZE_LABELS = { small: 'Small (10")', medium: 'Medium (12")', large: 'Large (14")' };
const CRUST_STYLE_LABELS = { thin: 'Thin', 'hand-tossed': 'Classic Hand Tossed', stuffed: 'Stuffed' };
const BAKE_LEVEL_LABELS = { normal: 'Normal Bake', 'well-done': 'Well Done' };
const DELIVERY_METHOD_LABELS = { [DELIVERY_METHODS.DELIVERY]: 'Delivery', [DELIVERY_METHODS.CARRYOUT]: 'Carryout' };

const Checkout = () => {
  const orderState = useSelector((state) => state.pizzaHub);
  const { base: baseState, toppings: toppingsState } = orderState;
  const sizePricing = useSelector((state) => state.navigation.sizePricing);
  const pizzaSize = useSelector((state) => state.pizza.size);
  const crustStyle = useSelector((state) => state.pizza.crustStyle);
  const bakeLevel = useSelector((state) => state.pizza.bakeLevel);
  const deliveryMethod = useSelector((state) => state.pizza.deliveryMethod);

  const history = useHistory();
  const dispatch = useDispatch();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // One key per checkout visit, generated lazily on first submit and reused on
  // any retry — so a failed request that's retried still carries the SAME key,
  // and a genuinely new order (after navigating back to checkout again) gets a
  // fresh one.
  const idempotencyKeyRef = useRef(null);

  const customizeHandler = () => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  const deliveryMethodHandler = (method) => {
    dispatch(pizzaActions.setDeliveryMethod(method));
  };

  const orderHandler = () => {
    // Guards against a double-click/double-tap firing two requests before the
    // first response (and its navigation away) lands — that's how an order was
    // getting placed twice.
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    createOrder(idempotencyKeyRef.current, orderState)
      .then((order) => {
        // setCurrentOrder is already dispatched inside createOrder (appApi)
        history.push(CONFIRM_PATH + '?orderId=' + order.oid);
      })
      .catch((e) => {
        console.error('Error in creating order' + e);
        setIsPlacingOrder(false);
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
    deliveryMethod,
  });

  return (
    <div className={styles.checkout}>
      {/* Left: the pizza, centred in its own block, with the actions beneath it. */}
      <div className={styles.leftPane}>
        <div className={styles.previewPanel}>
          <div className={styles.previewGlow} />
          {/* Not editable here: this is a receipt/summary view, not the builder
              (that's what "Customize" sends you back to), and dragging a topping
              on a continuously rotating/slicing pizza wouldn't track anyway.
              sliceMode="loop" is the rotate → slice apart → reassemble → repeat
              showpiece. */}
          <PizzaCanvas sliceMode="loop" />
        </div>

        <div className={styles.checkoutButtons}>
          <Button className={styles.customizeButton} onClick={customizeHandler}>
            Customize
          </Button>
          <Button
            className={styles.checkoutOrderButton}
            onClick={orderHandler}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? 'Placing Order…' : 'Place Order'}
          </Button>
        </div>
      </div>

      {/* Right: a fixed header (name + delivery method), a scrolling list of
          line items, and a pinned total. Only the middle section moves — the
          things you need to stay oriented (what you're buying, and what it
          costs) never scroll out of view. */}
      <div className={styles.ticketCard}>
        <div className={styles.ticketHead}>
          <h2 className={styles.ticketHeader}>{pizzaName(orderState)}</h2>

          <div className={styles.deliveryToggle}>
            {Object.values(DELIVERY_METHODS).map((m) => (
              <button
                type='button'
                key={m}
                className={`${styles.deliveryOption} ${deliveryMethod === m ? styles.deliveryOptionActive : ''}`}
                onClick={() => deliveryMethodHandler(m)}
              >
                {DELIVERY_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.ticketBody}>
          <div className={styles.ticketRow}>
            <span className={styles.ticketLabel}>Size</span>
            <span className={styles.ticketValue}>{SIZE_LABELS[pizzaSize] || 'Medium (12")'}</span>
          </div>
          <div className={styles.ticketRow}>
            <span className={styles.ticketLabel}>Crust</span>
            <span className={styles.ticketValue}>
              {CRUST_STYLE_LABELS[crustStyle] || 'Classic Hand Tossed'}, {BAKE_LEVEL_LABELS[bakeLevel] || 'Normal Bake'}
            </span>
          </div>

          <div className={styles.ticketDivider} />

          {lineItems.map((item) => (
            <div className={styles.ticketRow} key={item.key}>
              <span className={styles.ticketLabel}>{item.label}</span>
              <span className={styles.ticketValue}>{formatPrice(item.price)}</span>
            </div>
          ))}
        </div>

        <div className={styles.ticketFoot}>
          <div className={styles.ticketRow}>
            <span className={styles.ticketTotalLabel}>Total</span>
            <span className={styles.ticketTotalValue}>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
