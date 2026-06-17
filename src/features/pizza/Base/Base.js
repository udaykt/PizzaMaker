import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PIZZASIZES } from '@/utils/helpers';
import { pizzaHubActions, SAUCE_TYPES } from '@/store/pizzaHubSlice';
import { pizzaActions, CRUST_STYLES, BAKE_LEVELS } from '@/store/pizzaSlice';
import styles from './base.module.css';

// Real chain terminology: "Hand Tossed" (not "Classic"), sizes shown with
// inch diameter, and Domino's real sauce menu instead of a flat checkbox.
const SIZE_LABELS = { [PIZZASIZES.R]: 'Small (10")', [PIZZASIZES.M]: 'Medium (12")', [PIZZASIZES.L]: 'Large (14")' };
const CRUST_STYLE_LABELS = { [CRUST_STYLES.THIN]: 'Thin', [CRUST_STYLES.HAND_TOSSED]: 'Classic Hand Tossed', [CRUST_STYLES.STUFFED]: 'Stuffed' };
const BAKE_LEVEL_LABELS = { [BAKE_LEVELS.NORMAL]: 'Normal Bake', [BAKE_LEVELS.WELL_DONE]: 'Well Done' };
const SAUCE_TYPE_LABELS = {
  [SAUCE_TYPES.NONE]: 'None',
  [SAUCE_TYPES.ROBUST_TOMATO]: 'Robust Tomato',
  [SAUCE_TYPES.MARINARA]: 'Marinara',
  [SAUCE_TYPES.GARLIC_PARMESAN]: 'Garlic Parmesan',
  [SAUCE_TYPES.ALFREDO]: 'Alfredo',
  [SAUCE_TYPES.BBQ]: 'BBQ',
};
const SAUCE_TYPE_ORDER = [
  SAUCE_TYPES.NONE,
  SAUCE_TYPES.ROBUST_TOMATO,
  SAUCE_TYPES.MARINARA,
  SAUCE_TYPES.GARLIC_PARMESAN,
  SAUCE_TYPES.ALFREDO,
  SAUCE_TYPES.BBQ,
];

const Base = (props) => {
  const bases = useSelector((state) => state.pizzaHub.base);
  const size = useSelector((state) => state.pizza.size);
  const crustStyle = useSelector((state) => state.pizza.crustStyle);
  const bakeLevel = useSelector((state) => state.pizza.bakeLevel);
  const dispatch = useDispatch();

  // Collapsed by default — the defaults (Hand Tossed/Normal Bake/no sauce)
  // suit most people, so toppings stay one step closer instead of making
  // everyone scroll past decisions they probably don't need to make.
  const [showCrustOptions, setShowCrustOptions] = useState(false);

  const onChangeHandler = (e, key) => {
    dispatch(pizzaHubActions.toggleBase(key));
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
  const sauceTypeHandler = (sauceType) => {
    dispatch(pizzaHubActions.setSauceType(sauceType));
  };

  // Cheese checkboxes only — sauce is a single-select handled in its own grid.
  const cheeseEntries = Object.entries(bases).filter(([key]) => key !== 'sauce');

  return (
    <div className={styles.baseRoot}>
      <div className={styles.section}>
        <h2>Crust Size</h2>
        <div className={styles.sizeSlider}>
          {Object.values(PIZZASIZES).map((v) => (
            <input
              label={SIZE_LABELS[v]}
              type='radio'
              id={v}
              key={v}
              name='size'
              value={v}
              checked={size === v}
              onChange={(e) => sizeHandler(e)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button
          type='button'
          className={styles.crustSummary}
          onClick={() => setShowCrustOptions((s) => !s)}
          aria-expanded={showCrustOptions}
        >
          <span>Customize Crust & Sauce</span>
          <ChevronDown size={15} className={showCrustOptions ? styles.chevronOpen : styles.chevron} />
        </button>
        <AnimatePresence initial={false}>
          {showCrustOptions && (
            <motion.div
              className={styles.crustOptions}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className={styles.subSection}>
                <h3>Crust Style</h3>
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
              <div className={styles.subSection}>
                <h3>Bake</h3>
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
              <div className={styles.subSection}>
                <h3>Sauce</h3>
                <div className={styles.sauceGrid}>
                  {SAUCE_TYPE_ORDER.map((v) => (
                    <button
                      type='button'
                      key={v}
                      className={`${styles.sauceOption} ${bases.sauce.sauceType === v ? styles.sauceOptionActive : ''}`}
                      onClick={() => sauceTypeHandler(v)}
                    >
                      {SAUCE_TYPE_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.section}>
        <h3>Cheese</h3>
        <div className={styles.baseDiv}>
          {cheeseEntries.map(([key, value]) => (
            <div key={'_' + key} className={`${styles.base} ${value.checked ? styles.baseActive : ''}`}>
              <label>
                <input
                  type='checkbox'
                  key={key}
                  name={key}
                  value='1'
                  checked={value.checked}
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
