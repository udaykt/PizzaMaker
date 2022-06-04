import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PIZZASIZES } from '../../components/Utils/Utility';
import { pizzahubActions } from '../../store/pizzahubSlice';
import { pizzaActions } from '../../store/pizzaSlice';
import styles from './base.module.css';

const Base = (props) => {
  const bases = useSelector((state) => state.pizzahub.base);
  const size = useSelector((state) => state.pizza.size);
  const dispatch = useDispatch();
  const [color, setColor] = useState();

  const onChangeHandler = (e, key) => {
    let base = bases[key];
    setColor(base.color);
    base = { ...base, checked: e.target.checked };
    dispatch(pizzahubActions.toggleBase(base));
  };
  const sizeHandler = (e) => {
    dispatch(pizzaActions.setSize(e.target.value));
  };

  const onBaseClick = (e, key) => {
    let base = bases[key];
    console.log(base.color);
    e.target.style.color = base.color;
  };
  const onHoverColor = (e, key) => {
    switch (key) {
      case 'sauce':
        return (e.target.style.color = 'var(--sauce-color)');
      case 'mozzarella':
        return (e.target.style.color = 'var(--mozzarella-color)');
      case 'cheese':
        return (e.target.style.color = 'var(--cheese-color)');
      default:
        return (e.target.style.color = 'white');
    }
  };

  const baseColor = (e, key) => {
    switch (key) {
      case 'sauce':
        setColor('var(--sauce-color)');
        break;
      case 'mozzarella':
        return 'var(--mozzarella-color)';
      case 'cheese':
        return 'var(--cheese-color)';
      default:
        return 'white';
    }
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
