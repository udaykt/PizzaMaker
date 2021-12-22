import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './olive.css';

const Olive = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.olives);

  return (
    <Fragment>
      {quantity.checked ? (
        <div>
          <div className={'olive'} style={props.style()}></div>
          <div className={'olive'} style={props.style()}></div>
          <div className={'olive'} style={props.style()}></div>
        </div>
      ) : (
        <div className={'void'} />
      )}
      {quantity.checked && quantity.medium ? (
        <div className={'olive'} style={props.style()}></div>
      ) : (
        <div className={'void'} />
      )}
    </Fragment>
  );
};

export default Olive;
