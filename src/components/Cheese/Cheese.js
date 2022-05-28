import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './cheese.module.css';

const Cheese = (props) => {
  const quantity = useSelector((state) => state.pizzahub.base.cheese);
  const sliced = useSelector((state) => state.pizza.isSliced);

  return (
    <Fragment>
      {quantity.checked && (
        <div
          className={sliced ? styles[`slicedCheese`] : styles['cheese']}
        ></div>
      )}
    </Fragment>
  );
};

export default Cheese;
