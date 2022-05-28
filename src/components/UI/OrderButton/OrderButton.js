import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { initialPizzaState } from '../../../store/pizzahubSlice';
import { pizzaActions } from '../../../store/pizzaSlice';
import { CHECKOUT_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import styles from './orderButton.module.css';

const OrderButton = (props) => {
  const pizzahubState = useSelector((state) => state.pizzahub);
  const loggedIn = useSelector((state) => state.user.loggedIn);
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
      disabled={
        !loggedIn ||
        JSON.stringify(initialPizzaState) === JSON.stringify(orderState)
      }
    >
      Order
    </Button>
  );
};

export default OrderButton;
