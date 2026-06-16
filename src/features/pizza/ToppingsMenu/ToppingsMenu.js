import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { pizzaHubActions, TOPPING_QUANTITIES } from '@/store/pizzaHubSlice';
import usePizzaSound from '@/hooks/usePizzaSound';
import styles from './toppingsMenu.module.css';

// Ties each row's identity dot to the same colors the topping renders with
// on the pizza itself, so picking feels directly connected to what you'll see.
const TOPPING_COLOR_VAR = {
  pepperoni: 'var(--pepperoni-color)',
  sausage: 'var(--sausage-color)',
  peppers: 'var(--pepper-color)',
  olives: 'var(--olives-color)',
};

// Light/Regular/Extra — the terms Domino's, Pizza Hut, and Papa John's all
// use for topping quantity on their own ordering sites.
const QUANTITY_LABELS = {
  [TOPPING_QUANTITIES.LIGHT]: 'Light',
  [TOPPING_QUANTITIES.REGULAR]: 'Regular',
  [TOPPING_QUANTITIES.EXTRA]: 'Extra',
};
const QUANTITY_ORDER = [TOPPING_QUANTITIES.LIGHT, TOPPING_QUANTITIES.REGULAR, TOPPING_QUANTITIES.EXTRA];

const ToppingsMenu = (props) => {
  const toppings = useSelector((state) => state.pizzaHub.toppings);

  const dispatch = useDispatch();
  const playPlop = usePizzaSound();

  const checkboxChangeHandler = (e, key) => {
    let topping = toppings[key];
    topping = { ...topping, checked: e.target.checked };
    dispatch(pizzaHubActions.toggleTopping(topping));
    // Only on add, not remove — a sound on every uncheck gets noisy fast.
    if (e.target.checked) playPlop();
  };

  const quantityHandler = (key, quantity) => {
    dispatch(pizzaHubActions.setToppingQuantity({ title: key, quantity }));
  };

  return (
    <div className={styles.toppingsMenu}>
      <h1 title='toppings'>Toppings</h1>
      <div className={styles.toppings}>
        {Object.entries(toppings).map(([key, value]) => {
          return (
            <div className={`${styles.topping} ${value.checked ? styles.toppingActive : ''}`} key={key}>
              <div className={styles.toppingMain}>
                <div className={styles.checkbox}>
                  <input
                    type='checkbox'
                    name={key}
                    id={key}
                    onChange={(e) => checkboxChangeHandler(e, key)}
                  />
                  <label htmlFor={key}></label>
                </div>
                <span className={styles.toppingName}>
                  <span className={styles.toppingDot} style={{ background: TOPPING_COLOR_VAR[key] }} />
                  {key}
                </span>
              </div>

              <div className={styles.quantityPill}>
                {QUANTITY_ORDER.map((q) => (
                  <Fragment key={q}>
                    <input
                      type='radio'
                      id={`${key}_${q}`}
                      value={q}
                      name={key}
                      checked={value.quantity === q}
                      onChange={() => quantityHandler(key, q)}
                      disabled={!value.checked}
                    />
                    <label htmlFor={`${key}_${q}`}>{QUANTITY_LABELS[q]}</label>
                  </Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToppingsMenu;
