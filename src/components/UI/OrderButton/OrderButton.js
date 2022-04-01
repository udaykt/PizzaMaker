import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { auth } from '../../../containers/Firebase/Firebase';
import { pizzaActions } from '../../../store/pizzaSlice';
import { CHECKOUT_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import styles from './orderButton.module.css';

const OrderButton = (props) => {
  const pizzahubState = useSelector((state) => state.pizzahub);
  const loggedIn = useSelector((state) => state.user.loggedIn);
  const baseState = pizzahubState.base;
  const toppingsState = pizzahubState.toppings;

  const dispatch = useDispatch();
  const history = useHistory();

  const OrderSubmitHandler = (e) => {
    //createOrder(auth.currentUser, { baseState, toppingsState });
    history.push(CHECKOUT_PATH);
    dispatch(pizzaActions.toggleIsSliced());
  };
  return (
    <Button
      className={styles.orderButton}
      type='submit'
      value='Order'
      onClick={OrderSubmitHandler}
      disabled={!loggedIn}
    >
      Order
    </Button>
  );
};

export default OrderButton;
