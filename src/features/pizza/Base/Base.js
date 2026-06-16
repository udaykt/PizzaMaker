import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PIZZASIZES } from '@/utils/helpers';
import { pizzaHubActions } from '@/store/pizzaHubSlice';
import { pizzaActions, CRUST_STYLES, BAKE_LEVELS } from '@/store/pizzaSlice';
import styles from './base.module.css';

const CRUST_STYLE_LABELS = { [CRUST_STYLES.THIN]: 'Thin', [CRUST_STYLES.CLASSIC]: 'Classic', [CRUST_STYLES.STUFFED]: 'Stuffed' };
const BAKE_LEVEL_LABELS = { [BAKE_LEVELS.LIGHT]: 'Light', [BAKE_LEVELS.GOLDEN]: 'Golden', [BAKE_LEVELS.WELL_DONE]: 'Well-done' };

const Base = (props) => {
  const bases = useSelector((state) => state.pizzaHub.base);
  const size = useSelector((state) => state.pizza.size);
  const crustStyle = useSelector((state) => state.pizza.crustStyle);
  const bakeLevel = useSelector((state) => state.pizza.bakeLevel);
  const dispatch = useDispatch();

  const onChangeHandler = (e, key) => {
    let base = bases[key];
    base = { ...base, checked: e.target.checked };
    dispatch(pizzaHubActions.toggleBase(base));
  };
  const sizeHandler = (e) => {
    dispatch(pizzaActions.setSize(e.target.value));
  };
  const crustStyleHandler = (e) => {
    dispatch(pizzaActions.setCrustStyle(e.target.value));
  };
  const bakeLevelHandler = (e) => {
    dispatch(pizzaActions.setBakeLevel(e.target.value));
  };

  return (
    <div className={styles.baseRoot}>
      <div className={styles.section}>
        <h2>Crust Size</h2>
        <div className={styles.sizeSlider}>
          {Object.values(PIZZASIZES).map((v) => (
            <input
              label={v}
              type='radio'
              id={v}
              key={v}
              name='size'
              value={v}
              defaultChecked={v === PIZZASIZES.R}
              onChange={(e) => sizeHandler(e)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Crust Style</h2>
        <div className={styles.sizeSlider}>
          {Object.values(CRUST_STYLES).map((v) => (
            <input
              label={CRUST_STYLE_LABELS[v]}
              type='radio'
              id={`crust-${v}`}
              key={v}
              name='crustStyle'
              value={v}
              checked={crustStyle === v}
              onChange={(e) => crustStyleHandler(e)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Bake</h2>
        <div className={styles.sizeSlider}>
          {Object.values(BAKE_LEVELS).map((v) => (
            <input
              label={BAKE_LEVEL_LABELS[v]}
              type='radio'
              id={`bake-${v}`}
              key={v}
              name='bakeLevel'
              value={v}
              checked={bakeLevel === v}
              onChange={(e) => bakeLevelHandler(e)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Base Topping</h3>
        <div className={styles.baseDiv}>
          {Object.entries(bases).map(([key, value]) => (
            <div key={'_' + key} className={styles.base}>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Base;
