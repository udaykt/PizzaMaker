import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { uiActions } from '../../../store/uiSlice';
import { HOME_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './modal.css';

const Modal = (props) => {
  const orderState = useSelector((state) => state.order);
  const orderId = orderState.currentOrder.oid;
  const history = useHistory();
  const dispatch = useDispatch();
  const handleOk = (e) => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  return (
    <div className='modal'>
      <h4>Your order : {orderId} is placed.</h4>
      <Button onClick={handleOk}>Ok</Button>
    </div>
  );
};

export default withRouter(Modal);
