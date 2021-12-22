import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './pepperoni.css';

const Pepperoni = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.pepperoni);

  return (
    <Fragment>
      {quantity.checked ? (
        <div>
          <div className={'pepperoni'} style={props.style()}></div>
          <div className={'pepperoni'} style={props.style()}></div>
        </div>
      ) : (
        <div className={'void'} />
      )}
      {quantity.checked && quantity.medium ? (
        <div className={'pepperoni'} style={props.style()}></div>
      ) : (
        <div className={'void'} />
      )}
    </Fragment>
  );
};

export default Pepperoni;
