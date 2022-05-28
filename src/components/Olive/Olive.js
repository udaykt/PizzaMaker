import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './olive.css';

const Olive = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.olives);

  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={'olive'} style={props.sprinkler()}></div>
          <div className={'olive'} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={'olive'} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Olive;
