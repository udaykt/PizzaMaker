import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './mozzarella.module.css';

const Mozzarella = (props) => {
  const quantity = useSelector((state) => state.pizzaHub.base.mozzarella);

  return (
    <Fragment>
      {quantity.checked && <div className={styles.mozzarella}></div>}
    </Fragment>
  );
};

export default Mozzarella;
