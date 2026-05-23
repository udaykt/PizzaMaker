import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { uiActions } from '../../../store/uiSlice';
import { HOME_PATH, ORDERS_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './modal.css';

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
    <div className='modal'>
      <div className='modalSuccess'>
        <span className='modalCheckmark'>✓</span>
        <h2>Order Placed!</h2>
      </div>
      <div className='modalReceipt'>
        <div className='receiptRow'>
          <span className='receiptLabel'>Order ID</span>
          <span className='receiptValue receiptOid'>#{currentOrder?.oid || '—'}</span>
        </div>
        <div className='receiptRow'>
          <span className='receiptLabel'>Size</span>
          <span className='receiptValue'>{currentOrder?.pizzaSize || 'Medium'}</span>
        </div>
        {ingredients.length > 0 && (
          <div className='receiptRow'>
            <span className='receiptLabel'>Toppings</span>
            <span className='receiptValue'>{ingredients.join(', ')}</span>
          </div>
        )}
        <div className='receiptRow'>
          <span className='receiptLabel'>Status</span>
          <span className='receiptValue receiptStatus'>{currentOrder?.status || 'PENDING'}</span>
        </div>
      </div>
      <p className='modalNote'>We're making your pizza! You'll see it in orders.</p>
      <div className='modalActions'>
        <Button onClick={handleViewOrders} className='modalOrdersBtn'>View Orders</Button>
        <Button onClick={handleOk} className='modalOkBtn'>Back to Menu</Button>
      </div>
    </div>
  );
};

export default withRouter(Modal);
