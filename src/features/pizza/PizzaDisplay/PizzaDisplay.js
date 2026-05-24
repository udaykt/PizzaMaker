import { Fragment, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { SLICESSIZES } from '@/utils/helpers';
import PizzaPreview from '@/features/pizza/PizzaPreview/PizzaPreview';
import Slice from '@/features/pizza/Slice/Slice';
import styles from './pizzaDisplay.module.css';

const REGULAR = '6';
const MEDIUM = '12';
const LARGE = '5';

const PizzaDisplay = (props) => {
  const userState = useSelector((state) => state.auth);
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

  // Pre-generate 50 stable positions; recompute only when pizza size changes.
  // Using plain Math.random() (not .toFixed()) to avoid string-coercion arithmetic.
  const positions = useMemo(() => {
    const diff = 85;
    return Array.from({ length: 50 }, () => {
      const val = Math.floor(Math.random() * 45 + 2);
      return Math.floor(Math.random() * 2) === 0
        ? { right: `${val}%`, bottom: `${val}%` }
        : { left: `${diff - val}%`, top: `${diff - val}%` };
    });
  }, [size]);

  // Reset before each render so topping components read positions in the same
  // order every time, giving stable layout across re-renders.
  const cursor = useRef(0);
  cursor.current = 0;
  const toppingSprinkler = () => positions[cursor.current++ % positions.length];

  return (
    <Fragment>
      <div className={styles.pizza}>
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
          (!state.loggedIn && <PizzaPreview />)}
      </div>
    </Fragment>
  );
};

export default PizzaDisplay;
