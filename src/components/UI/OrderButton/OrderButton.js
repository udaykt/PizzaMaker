import { useDispatch } from 'react-redux';
import { pizzaActions } from '../../../store/pizzaSlice';
import Button from '../Buttons/Button';
import styles from './orderButton.module.css';

const OrderButton = (props) => {
  const dispatch = useDispatch();

  const onClickhandler = () => {
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
