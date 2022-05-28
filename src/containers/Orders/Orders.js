import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/UI/Buttons/Button';
import { fetchUserOrders } from '../Firebase/Firebase';
import './orders.css';

const Orders = (props) => {
  const orderState = useSelector((state) => state.order);
  const userOrders = orderState.userOrders;
  useEffect(() => {
    fetchUserOrders();
  }, []);

  console.log(userOrders);
  return (
    <div className='orders'>
      <h1>Orders</h1>
      {userOrders.length !== 0 ? (
        <ul className='ordersList'>
          {userOrders.map((o) => {
            return (
              <li key={o.uid}>
                <Button className='ordersButton'>Order No: {o.oid}</Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No orders yet!</p>
      )}
    </div>
  );
};

export default Orders;
