import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './sausage.css';

const Sausage = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.sausage);

  return (
    <Fragment>
      {quantity.checked ? (
        <div>
          <div className={'sausage'} style={props.style()}></div>
          <div className={'sausage'} style={props.style()}></div>
        </div>
      ) : (
        <div className={'void'} />
      )}
      {quantity.checked && quantity.medium ? (
        <div className={'sausage'} style={props.style()}></div>
      ) : (
        <div className={'void'} />
      )}
    </Fragment>
  );
};

export default Sausage;
