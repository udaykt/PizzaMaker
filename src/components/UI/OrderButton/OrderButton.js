import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { pizzaActions } from '../../../store/pizzaSlice';
import { CHECKOUT_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import styles from './orderButton.module.css';

const OrderButton = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const onClickhandler = () => {
    history.push(CHECKOUT_PATH);
    dispatch(pizzaActions.toggleIsSliced());
  };
  return (
    <Button
      className={styles.orderButton}
      type='submit'
      value='Order'
      onClick={onClickhandler}
    >
      Order
    </Button>
  );
};

export default OrderButton;
