import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './peppers.css';

const Peppers = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.peppers);
  return (
    <Fragment>
      {quantity.checked && (
        <div>
          <div className={`peppers`} style={props.sprinkler()}></div>
          <div className={`peppers`} style={props.sprinkler()}></div>
        </div>
      )}
      {quantity.checked && quantity.medium && (
        <div className={`peppers`} style={props.sprinkler()}></div>
      )}
    </Fragment>
  );
};

export default Peppers;
