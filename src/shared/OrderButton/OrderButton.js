import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isPizzaEmpty } from '@/store/pizzaHubSlice';
import { pizzaActions } from '@/store/pizzaSlice';
import { CHECKOUT_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import styles from './orderButton.module.css';

const OrderButton = (props) => {
  const pizzahubState = useSelector((state) => state.pizzaHub);
  const loggedIn = useSelector((state) => state.auth.loggedIn);
  const baseState = pizzahubState.base;
  const toppingsState = pizzahubState.toppings;
  const orderState = { base: baseState, toppings: toppingsState };
  const dispatch = useDispatch();
  const history = useHistory();

  const OrderSubmitHandler = (e) => {
    history.push(CHECKOUT_PATH);
    dispatch(pizzaActions.toggleIsSliced());
  };
  return (
    <Button
      className={styles.orderButton}
      type='submit'
      value='Order'
      onClick={OrderSubmitHandler}
      disabled={!loggedIn || isPizzaEmpty(orderState)}
    >
      Order
    </Button>
  );
};

export default OrderButton;
