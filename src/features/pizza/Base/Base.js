import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PIZZASIZES } from '@/utils/helpers';
import { pizzaHubActions } from '@/store/pizzaHubSlice';
import { pizzaActions } from '@/store/pizzaSlice';
import styles from './base.module.css';

const Base = (props) => {
  const bases = useSelector((state) => state.pizzaHub.base);
  const size = useSelector((state) => state.pizza.size);
  const dispatch = useDispatch();
  const onChangeHandler = (e, key) => {
    let base = bases[key];
    base = { ...base, checked: e.target.checked };
    dispatch(pizzaHubActions.toggleBase(base));
  };
  const sizeHandler = (e) => {
    dispatch(pizzaActions.setSize(e.target.value));
  };

  return (
    <div className={styles.baseRoot}>
      <h2>Crust Size</h2>
      <div className={styles.pizzaSizeContainer}>
        <div className={styles.sizeSlider}>
          {Object.values(PIZZASIZES).map((v) => {
            return (
              <input
                label={v}
                type='radio'
                id={v}
                key={v}
                name='size'
                value={v}
                defaultChecked={v === PIZZASIZES.R}
                onChange={(e) => sizeHandler(e)}
                style={size !== { v } ? { color: 'white' } : {}}
              />
            );
          })}
        </div>
      </div>
      <h3>Base Topping</h3>
      <div className={styles.baseDiv}>
        {Object.entries(bases).map(([key, value]) => {
          return (
            <div key={'_' + key} className={styles.base}>
              {console.log(key)}
              <label>
                <input
                  type='checkbox'
                  key={key}
                  name={key}
                  value='1'
                  onChange={(e) => onChangeHandler(e, key)}
                  hidden
                />
                <span>{value.title}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Base;
