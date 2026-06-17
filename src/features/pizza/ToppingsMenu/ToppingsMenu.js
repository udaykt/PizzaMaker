import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { pizzaHubActions, TOPPING_QUANTITIES } from '@/store/pizzaHubSlice';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';
import { TOPPING_ART } from '@/features/pizza/PizzaCanvas/toppingArt';
import usePizzaSound from '@/hooks/usePizzaSound';
import styles from './toppingsMenu.module.css';

const QUANTITY_LABELS = {
  [TOPPING_QUANTITIES.LIGHT]: 'Light',
  [TOPPING_QUANTITIES.REGULAR]: 'Regular',
  [TOPPING_QUANTITIES.EXTRA]: 'Extra',
};
const QUANTITY_ORDER = [TOPPING_QUANTITIES.LIGHT, TOPPING_QUANTITIES.REGULAR, TOPPING_QUANTITIES.EXTRA];

const TOPPING_META = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t]));

const GROUPS = [
  { key: 'nonveg', label: 'Non-Veg', color: '#b05030' },
  { key: 'veg',    label: 'Veg',     color: '#2d7a2d' },
];

const ToppingsMenu = () => {
  const toppings = useSelector((state) => state.pizzaHub.toppings);
  const dispatch = useDispatch();
  const playPlop = usePizzaSound();

  const checkboxChangeHandler = (e, key) => {
    let topping = toppings[key];
    topping = { ...topping, checked: e.target.checked };
    dispatch(pizzaHubActions.toggleTopping(topping));
    if (e.target.checked) playPlop();
  };

  const quantityHandler = (key, quantity) => {
    dispatch(pizzaHubActions.setToppingQuantity({ title: key, quantity }));
  };

  return (
    <div className={styles.toppingsMenu}>
      <h1 title='toppings'>Toppings</h1>
      <div className={styles.toppings}>
        {GROUPS.map((group) => {
          const ids = TOPPING_CATALOG.filter((t) => t.category === group.key).map((t) => t.id);
          return (
            <Fragment key={group.key}>
              <div className={styles.categoryHeader} style={{ '--cat-color': group.color }}>
                {group.label}
              </div>
              {ids.map((key) => {
                const value = toppings[key];
                if (!value) return null;
                const meta = TOPPING_META[key];
                const art = TOPPING_ART[key];
                return (
                  <div className={`${styles.topping} ${value.checked ? styles.toppingActive : ''}`} key={key}>
                    <div className={styles.toppingMain}>
                      <div className={styles.checkbox}>
                        <input
                          type='checkbox'
                          name={key}
                          id={key}
                          checked={value.checked}
                          onChange={(e) => checkboxChangeHandler(e, key)}
                        />
                        <label
                          htmlFor={key}
                          style={{ '--knob-img': `url(${art.knob})`, '--knob-size': art.knobSize }}
                        ></label>
                      </div>
                      <span className={styles.toppingName}>
                        <span className={styles.toppingDot} style={{ background: art.swatch }} />
                        {meta.label}
                      </span>
                    </div>

                    <div className={styles.quantityPill}>
                      {QUANTITY_ORDER.map((q) => (
                        <Fragment key={q}>
                          <input
                            type='radio'
                            id={`${key}_${q}`}
                            value={q}
                            name={`qty_${key}`}
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
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ToppingsMenu;
