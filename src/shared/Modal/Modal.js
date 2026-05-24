import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH, ORDERS_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
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

  const formatIngredients = (order) => {
    if (!order || !order.ingredients) return [];
    return Object.entries(order.ingredients)
      .filter(([k, v]) => v === true && !k.toLowerCase().includes('medium'))
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
  };

  const ingredients = formatIngredients(currentOrder);

  return (
    <div className={styles.modal}>
      <div className={styles.modalSuccess}>
        <span className={styles.modalCheckmark}>✔</span>
        <h2>Order Placed!</h2>
      </div>
      <div className={styles.modalReceipt}>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Order ID</span>
          <span className={`${styles.receiptValue} ${styles.receiptOid}`}>#{currentOrder?.oid || '—'}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Size</span>
          <span className={styles.receiptValue}>{currentOrder?.pizzaSize || 'Medium'}</span>
        </div>
        {ingredients.length > 0 && (
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Toppings</span>
            <span className={styles.receiptValue}>{ingredients.join(', ')}</span>
          </div>
        )}
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Status</span>
          <span className={`${styles.receiptValue} ${styles.receiptStatus}`}>{currentOrder?.status || 'PENDING'}</span>
        </div>
      </div>
      <p className={styles.modalNote}>We're making your pizza! You'll see it in orders.</p>
      <div className={styles.modalActions}>
        <Button onClick={handleViewOrders} className={styles.modalOrdersBtn}>View Orders</Button>
        <Button onClick={handleOk} className={styles.modalOkBtn}>Back to Menu</Button>
      </div>
    </div>
  );
};

export default withRouter(Modal);
