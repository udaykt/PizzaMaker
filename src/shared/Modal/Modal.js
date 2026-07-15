import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH, ORDERS_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import { orderDisplayLabels, orderIngredientLabels, pizzaPropsFromOrder } from '@/features/pizza/PizzaCanvas/fromOrder';
import { orderPizzaName } from '@/utils/pizzaName';
import { formatPrice } from '@/utils/formatPrice';
import { statusLabel } from '@/utils/orderStatusLabels';
import logoBadge from '@/assets/images/logo-badge-nobg.png';
import styles from './modal.module.css';

const Modal = (props) => {
  const orderState = useSelector((state) => state.order);
  const currentOrder = orderState.currentOrder;
  const history = useHistory();
  const dispatch = useDispatch();

  const handleOk = () => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  const handleViewOrders = () => {
    history.push(ORDERS_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  const ingredients = orderIngredientLabels(currentOrder?.ingredients);
  const labels = orderDisplayLabels(currentOrder);
  const canvasProps = currentOrder ? pizzaPropsFromOrder(currentOrder) : null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalSuccess}>
        <img src={logoBadge} alt="Pizza Maker" className={styles.modalStamp} />
        <h2>Order Placed!</h2>
      </div>
      {currentOrder && (
        <div className={styles.modalPizza}>
          <PizzaCanvas {...canvasProps} />
        </div>
      )}
      {currentOrder && (
        <p className={styles.modalPizzaName}>{orderPizzaName(currentOrder, canvasProps)}</p>
      )}
      <div className={styles.modalReceipt}>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Order ID</span>
          <span className={`${styles.receiptValue} ${styles.receiptOid}`}>#{currentOrder?.oid || '—'}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Size</span>
          <span className={styles.receiptValue}>{labels.size}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Crust</span>
          <span className={styles.receiptValue}>{labels.crustStyle}, {labels.bakeLevel}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Method</span>
          <span className={styles.receiptValue}>{labels.deliveryMethod}</span>
        </div>
        {labels.sauceType !== 'None' && (
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Sauce</span>
            <span className={styles.receiptValue}>{labels.sauceType}</span>
          </div>
        )}
        {ingredients.length > 0 && (
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Toppings</span>
            <span className={styles.receiptValue}>{ingredients.join(', ')}</span>
          </div>
        )}
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Total</span>
          <span className={`${styles.receiptValue} ${styles.receiptPrice}`}>{formatPrice(currentOrder?.price)}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Status</span>
          <span className={`${styles.receiptValue} ${styles.receiptStatus}`}>{statusLabel(currentOrder?.status || 'PENDING')}</span>
        </div>
      </div>
      <p className={styles.modalNote}>Into the oven it goes. Follow along in your orders.</p>
      <div className={styles.modalActions}>
        <Button onClick={handleViewOrders} className={styles.modalOrdersBtn}>View Orders</Button>
        <Button onClick={handleOk} className={styles.modalOkBtn}>Back to Menu</Button>
      </div>
    </div>
  );
};

export default withRouter(Modal);
