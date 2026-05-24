import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './peppers.module.css';

const Peppers = (props) => {
  const quantity = useSelector((state) => state.pizzaHub.toppings.peppers);
  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={styles.peppers} style={props.sprinkler()}></div>
          <div className={styles.peppers} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={styles.peppers} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Peppers;
