import { Fragment } from 'react';
import Olive from '../../components/Olive/Olive';
import './mainPizza.css';
import olive from '../../assets/Logos/olive.png';

const MainPizza = (props) => {
  const pizzaSlices = {
    regular: 4,
    medium: 6,
    large: 8,
    extraLarge: 10,
  };
  const sliceSizes = {
    regular: [
      {
        rotate: 0,
        skew: 0,
      },
      {
        rotate: 180,
        skew: 0,
      },
      {
        rotate: 270,
        skew: 0,
      },
      {
        rotate: 90,
        skew: 0,
      },
    ],
    medium: [
      {
        rotate: 60,
        skew: 30,
      },
      {
        rotate: 120,
        skew: 30,
      },
      {
        rotate: 180,
        skew: 30,
      },
      {
        rotate: 240,
        skew: 30,
      },
      {
        rotate: 300,
        skew: 30,
      },
      {
        rotate: 360,
        skew: 30,
      },
    ],
    large: [
      {
        rotate: 45,
        skew: 45,
      },
      {
        rotate: 90,
        skew: 45,
      },
      {
        rotate: 135,
        skew: 45,
      },
      {
        rotate: 180,
        skew: 45,
      },
      {
        rotate: 225,
        skew: 45,
      },
      {
        rotate: 270,
        skew: 45,
      },
      {
        rotate: 315,
        skew: 45,
      },
      {
        rotate: 360,
        skew: 45,
      },
    ],
    extraLarge: [
      {
        rotate: 72,
        skew: 54,
      },
      {
        rotate: 36 * 3,
        skew: 54,
      },
      {
        rotate: 36 * 4,
        skew: 54,
      },
      {
        rotate: 36 * 5,
        skew: 54,
      },
      {
        rotate: 36 * 6,
        skew: 54,
      },
      {
        rotate: 36 * 7,
        skew: 54,
      },
      {
        rotate: 36 * 8,
        skew: 54,
      },
      {
        rotate: 36 * 9,
        skew: 54,
      },
      {
        rotate: 36 * 10,
        skew: 54,
      },
      {
        rotate: 36 * 11,
        skew: 54,
      },
    ],
  };
  const state = {
    base: {
      sauce: {
        title: 'sauce',
        checked: false,
      },
      mozzarella: {
        title: 'mozzarella',
        checked: false,
      },
      cheese: {
        title: 'cheese',
        checked: false,
      },
    },
    toppings: {
      pepperoni: {
        title: 'pepperoni',
        medium: false,
        checked: false,
      },
      sausage: {
        title: 'sausage',
        medium: false,
        checked: false,
      },
      peppers: {
        title: 'peppers',
        medium: false,
        checked: false,
      },
      olives: {
        title: 'olives',
        medium: false,
        checked: false,
      },
    },
  };

  return (
    <div className='mainPizza'>
      {sliceSizes.regular.map((slice) => {
        console.log(slice);
        return (
          <Fragment key={slice.rotate + slice.skew}>
            <div
              className='slice'
              style={{
                transform: `rotate(${slice.rotate}deg) skew(${slice.skew}deg)`,
              }}
            ></div>
            <div
              className='sauceSlice'
              style={{
                transform: `rotate(${slice.rotate}deg) skew(${slice.skew}deg)`,
              }}
            ></div>
            <div
              className='cheeseSlice'
              style={{
                transform: `rotate(${slice.rotate}deg) skew(${slice.skew}deg)`,
              }}
            >
              <img
                src={olive}
                alt='olive'
                style={{
                  objectFit: 'contain',
                  width: '100px',
                  height: '100px',
                }}
              />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
};

export default MainPizza;
