import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './mozzarella.css';

const Mozzarella = (props) => {
  const quantity = useSelector((state) => state.pizzahub.base.mozzarella);

  return (
    <Fragment>
      {quantity.checked && <div className={'mozzarella'}></div>}
    </Fragment>
  );
};

export default Mozzarella;
