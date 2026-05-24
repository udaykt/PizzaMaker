import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isPizzaEmpty } from '@/store/pizzaHubSlice';
import Button from '@/shared/Button/Button';
import Pizza from '@/features/pizza/PizzaDisplay/PizzaDisplay';
import styles from './checkout.module.css';
import { useHistory } from 'react-router-dom';
import { CONFIRM_PATH, HOME_PATH } from '@/utils/routes';
import { createOrder } from '@/api/appApi';
import { uiActions } from '@/store/uiSlice';

const SELECTED = 'selected';
const NOTSELECTED = 'not selected';
const REGULAR = 'regular';
const MEDIUM = 'medium';

const Checkout = (props) => {
  const orderState = useSelector((state) => state.pizzaHub);
  const baseState = orderState.base;
  const toppingsState = orderState.toppings;
  const order = { base: baseState, toppings: toppingsState };
  const state = {
    parts: {
      1: 'one',
      2: 'two',
      3: 'three',
      4: 'four',
      5: 'five',
      6: 'six',
    },
  };
  const history = useHistory();
  const dispatch = useDispatch();

  const customizeHandler = (e) => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  const orderHandler = (e) => {
    createOrder(null, orderState)
      .then((order) => {
        // setCurrentOrder is already dispatched inside createOrder (appApi)
        history.push(CONFIRM_PATH + '?orderId=' + order.oid);
      })
      .catch((e) => {
        console.error('Error in creating order' + e);
      });
  };

  const empty = isPizzaEmpty(order);

  return (
    (!empty && (
      <div className={styles.checkout}>
        <div className={styles.pizzaCheckoutDiv}>
          <Pizza {...state} />
        </div>
        <table className={styles.ingredients}>
          <thead>
            <tr>
              <td colSpan={2}>
                <h1>Ingredients</h1>
              </td>
            </tr>
          </thead>
          <tbody>
            {Object.entries(baseState).map(([k, v]) => {
              return (
                <tr key={k}>
                  <td>
                    <h3>{k}</h3>
                  </td>
                  <td id='baseValues'>
                    <h3>{v.checked ? SELECTED : NOTSELECTED}</h3>
                  </td>
                </tr>
              );
            })}
            {Object.entries(toppingsState).map(([k, v]) => {
              return (
                <tr key={k}>
                  <td>
                    <h3>{k}</h3>
                  </td>
                  <td>
                    <h3>
                      {v.checked ? (v.medium ? MEDIUM : REGULAR) : NOTSELECTED}
                    </h3>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={styles.checkoutButtons}>
          <Button className={styles.customizeButton} onClick={customizeHandler}>
            Customize
          </Button>
          <Button className={styles.checkoutOrderButton} onClick={orderHandler}>
            Order
          </Button>
        </div>
      </div>
    )) ||
    (empty && (
      <p className={styles.emptyCheckout}>
        Nothing to checkout! Customize and click order to checkout!
      </p>
    ))
  );
};

export default Checkout;
