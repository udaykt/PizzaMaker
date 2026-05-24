import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './pepperoni.module.css';

const Pepperoni = (props) => {
  const quantity = useSelector((state) => state.pizzaHub.toppings.pepperoni);

  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={styles.pepperoni} style={props.sprinkler()}></div>
          <div className={styles.pepperoni} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={styles.pepperoni} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Pepperoni;
