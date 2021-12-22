import React from 'react';
import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './peppers.css';

const Peppers = (props) => {
  const quantity = useSelector((state) => state.pizzahub.toppings.peppers);
  return (
    <Fragment>
      {quantity.checked ? (
        <div>
          <div className={`peppers`} style={props.style()}></div>
          <div className={`peppers`} style={props.style()}></div>
        </div>
      ) : (
        <div className={'void'} />
      )}
      {quantity.checked && quantity.medium ? (
        <div className={`peppers`} style={props.style()}></div>
      ) : (
        <div className={'void'} />
      )}
    </Fragment>
  );
};

export default Peppers;
