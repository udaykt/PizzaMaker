import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initialPizzaState, pizzahubActions } from '../../store/pizzahubSlice';
import Button from '../../components/UI/Buttons/Button';
import Pizza from '../Pizza/Pizza';
import './checkout.css';
import { useHistory } from 'react-router-dom';
import { CONFIRM_PATH, HOME_PATH } from '../../components/Utils/Constants';
import { auth, createOrder } from '../Firebase/Firebase';
import { orderActions } from '../../store/orderSlice';
import { uiActions } from '../../store/uiSlice';

const SELECTED = 'selected';
const NOTSELECTED = 'not selected';
const REGULAR = 'regular';
const MEDIUM = 'medium';

const Checkout = (props) => {
  const orderState = useSelector((state) => state.pizzahub);
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
    createOrder(auth.currentUser, orderState)
      .then((order) => {
        console.log(order);
        history.push(CONFIRM_PATH + '?orderId=' + order.orderId);
        dispatch(orderActions.setCurrentOrder(order));
      })
      .catch((e) => {
        console.error('Error in creating order' + e);
      });
  };

  return (
    (JSON.stringify(initialPizzaState) !== JSON.stringify(order) && (
      <div className='checkout'>
        <div className='pizzaCheckoutDiv'>
          <Pizza {...state} />
        </div>
        <table className='ingredients'>
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
        <div className='checkoutButtons'>
          <Button className='customizeButton' onClick={customizeHandler}>
            Customize
          </Button>
          <Button className='checkoutOrderButton' onClick={orderHandler}>
            Order
          </Button>
        </div>
      </div>
    )) ||
    (JSON.stringify(initialPizzaState) === JSON.stringify(order) && (
      <p className='emptyCheckout'>
        Nothing to checkout! Customize and click order to checkout!
      </p>
    ))
  );
};

export default Checkout;
