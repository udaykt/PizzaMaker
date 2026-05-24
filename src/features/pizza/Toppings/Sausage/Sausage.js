import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './sausage.module.css';

const Sausage = (props) => {
  const quantity = useSelector((state) => state.pizzaHub.toppings.sausage);

  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={styles.sausage} style={props.sprinkler()}></div>
          <div className={styles.sausage} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={styles.sausage} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Sausage;
