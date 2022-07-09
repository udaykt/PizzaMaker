import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { SLICESSIZES } from '../../components/Utils/Utility';
import DummyPizza from '../DummyPizza/DummyPizza';
import Slice from '../Slice/Slice';
import './pizza.css';

const REGULAR = '6';
const MEDIUM = '12';
const LARGE = '5';

const Pizza = (props) => {
  const userState = useSelector((state) => state.user);
  const size = useSelector((state) => state.pizza.size);
  const loggedIn = userState.loggedIn;

  const slicesSizes = SLICESSIZES;

  const state = {
    quantity: {
      regular: { active: false, value: REGULAR },
      medium: { active: false, value: MEDIUM },
      large: { active: false, value: LARGE },
    },
    value: 'regular',
    sliced: true,
    loggedIn,
  };

  const getRand = () => {
    return Math.floor(Math.random().toFixed(2) * 45 + 2);
  };

  const toppingSprinkler = (max, min) => {
    var toggler = Math.floor(Math.random().toFixed(2) * 2);
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
      <div className={'pizza'}>
        {(state.loggedIn &&
          slicesSizes[size].map((slice) => {
            return (
              <Slice
                key={slice.rotate}
                part={slice.size}
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
