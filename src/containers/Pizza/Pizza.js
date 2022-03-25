import { Component, Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import DummyPizza from '../DummyPizza/DummyPizza';
import MainPizza from '../MainPizza/MainPizza';
import Slice from '../Slice/Slice';
import styles from './pizza.module.css';

const SMALL = '6';
const MEDIUM = '12';
const LARGE = '5';

const Pizza = (props) => {
  const userState = useSelector((state) => state.user);
  const loggedIn = userState.loggedIn;
  const state = {
    quantity: {
      small: { active: false, value: SMALL },
      medium: { active: false, value: MEDIUM },
      large: { active: false, value: LARGE },
    },
    value: 'small',
    sliced: true,
    loggedIn,
  };

  const quantityHandler = (value) => {
    switch (props.quantity) {
      case 'small':
        return state.quantity.small.value;
      case 'medium':
        return state.quantity.medium.value;
      case 'large':
        return state.quantity.large.value;
      default:
        return state.quantity.small.value;
    }
  };
  const buildStyle = () => {
    let top = Math.floor(Math.random() * (70 - 5) + 5);
    let left = Math.floor(Math.random() * (70 - 20) + 30);
    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  //slices is singular
  return (
    <Fragment>
      <div className={styles.pizza}>
        {(state.loggedIn &&
          Object.entries(props.parts).map(([k, v]) => {
            return (
              <Slice
                key={k + v}
                part={v}
                quantity={quantityHandler(props.value)}
                {...props}
                style={buildStyle}
              />
            );
          })) ||
          (!state.loggedIn && <DummyPizza />)}
      </div>
    </Fragment>
  );
};

export default Pizza;
