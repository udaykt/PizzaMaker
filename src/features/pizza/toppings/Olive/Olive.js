import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './olive.module.css';

const Olive = (props) => {
  const quantity = useSelector((state) => state.pizzaHub.toppings.olives);

  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={styles.olive} style={props.sprinkler()}></div>
          <div className={styles.olive} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={styles.olive} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Olive;
