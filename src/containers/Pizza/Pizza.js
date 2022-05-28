import { Fragment, useRef } from 'react';
import { useSelector } from 'react-redux';
import { SLICESSIZES, TOPPING_COUNT } from '../../components/Utils/Utility';
import DummyPizza from '../DummyPizza/DummyPizza';
import Slice from '../Slice/Slice';
import styles from './pizza.module.css';

const SMALL = '6';
const MEDIUM = '12';
const LARGE = '5';

const Pizza = (props) => {
  const userState = useSelector((state) => state.user);
  const loggedIn = userState.loggedIn;

  const slicesSizes = SLICESSIZES;
  const toppingCount = TOPPING_COUNT;
  const vals = useRef([[]]);

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
    // console.log(props.quantity);
    // switch (props.quantity) {
    //   case 'small':
    //     return state.quantity.small.value;
    //   case 'medium':
    //     return state.quantity.medium.value;
    //   case 'large':
    //     return state.quantity.large.value;
    //   default:
    //     return state.quantity.small.value;
    // }
  };
  const buildStyle = () => {
    let bottom = Math.floor(Math.random() * (70 - 30) + 30);
    let left = Math.floor(Math.random() * (70 - 30) + 30);
    return {
      bottom: `${bottom}px`,
      left: `${left}px`,
    };
  };

  const getRand = () => {
    return Math.floor(Math.random().toFixed(2) * 45 + 2);
  };

  console.log(vals.current);

  const toppingSprinkler = (max, min) => {
    var toggler = Math.floor(Math.random().toFixed(2) * 2);
    //vals.current.push([getRand(), getRand()]);
    // if (vals.current.length !== 0) {
    //   var last = vals.current.pop();
    //   var r = last[0];
    //   var b = last[1];
    // }
    var diff = 85;
    var ret =
      toggler === 0
        ? {
            right: `${getRand()}%`,
            bottom: `${getRand()}%`,
          }
        : {
            left: `${diff - getRand()}%`,
            top: `${diff - getRand()}%`,
          };
    console.log(ret);
    return ret;
  };

  return (
    <Fragment>
      <div className={styles.pizza}>
        {(state.loggedIn &&
          slicesSizes.medium.map((slice) => {
            return (
              <Slice
                key={slice.rotate}
                part={slice.size}
                quantity={quantityHandler(props.value)}
                {...slice}
                sprinkler={toppingSprinkler}
                style={{
                  height: `${slice.size}px`,
                  width: `${slice.size}px`,
                  transform: `rotate(${slice.rotate}deg) skew(${0}deg)`,
                }}
              />
            );
          })) ||
          (!state.loggedIn && <DummyPizza />)}
      </div>
    </Fragment>
  );
};

export default Pizza;
