import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './sausage.css';

const Sausage = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.sausage);

  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={'sausage'} style={props.sprinkler()}></div>
          <div className={'sausage'} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={'sausage'} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Sausage;
