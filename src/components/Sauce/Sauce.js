import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import styles from './sauce.module.css';

const Sauce = (props) => {
  const quantity = useSelector((state) => state.pizzahub.base.sauce);

  const sliced = useSelector((state) => state.pizza.isSliced);
  return (
    <Fragment>
      {quantity.checked ? (
        <div className={sliced ? styles[`slicedSauce`] : styles[`sauce`]} />
      ) : (
        <div className={'void'} />
      )}
    </Fragment>
  );
};

export default Sauce;
