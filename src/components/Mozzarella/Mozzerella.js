import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './mozzarella.css';

const Mozzarella = (props) => {
  const quantity = useSelector((state) => state.pizzahub.base.mozzarella);

  const randomAngle = Math.floor(Math.random() * 360 + 1);
  return (
    <Fragment>
      {quantity.checked ? (
        <div
          className={'mozzarella'}
          style={{ transform: `rotate(${randomAngle}deg)` }}
        ></div>
      ) : (
        <div className={'void'} />
      )}
    </Fragment>
  );
};

export default Mozzarella;
