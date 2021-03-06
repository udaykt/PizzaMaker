import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './pepperoni.css';

const Pepperoni = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.pepperoni);

  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={'pepperoni'} style={props.sprinkler()}></div>
          <div className={'pepperoni'} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={'pepperoni'} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Pepperoni;
