import { Fragment, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { pizzaHubActions, TOPPING_QUANTITIES } from '@/store/pizzaHubSlice';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';
import { TOPPING_ART } from '@/features/pizza/PizzaCanvas/toppingArt';
import usePizzaSound from '@/hooks/usePizzaSound';
import styles from './toppingsMenu.module.css';

const CHEESE_SWATCHES = {
  mozzarella:     '#e8d9bc',
  cheddar:        '#f08020',
  parmesanAsiago: '#e8c060',
  feta:           '#eeeadc',
  ricotta:        '#ece0c8',
  veganCheese:    '#f5cc50',
};

const DOT_COUNT = {
  [TOPPING_QUANTITIES.LIGHT]:   1,
  [TOPPING_QUANTITIES.REGULAR]: 2,
  [TOPPING_QUANTITIES.EXTRA]:   3,
};

const TOPPING_META = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t]));

const GROUPS = [
  { key: 'nonveg', label: 'Non-Veg', color: '#b05030' },
  { key: 'veg',    label: 'Veg',     color: '#2d7a2d' },
];

const ToppingsMenu = () => {
  const toppings = useSelector((state) => state.pizzaHub.toppings);
  const bases    = useSelector((state) => state.pizzaHub.base);
  const dispatch = useDispatch();
  const playPlop = usePizzaSound();

  const cheeseEntries = Object.entries(bases).filter(([k]) => k !== 'sauce');

  const handleCheeseToggle = useCallback((key, isChecked) => {
    if (!isChecked) playPlop();
    dispatch(pizzaHubActions.toggleBase(key));
  }, [dispatch, playPlop]);

  const handleToppingCycle = useCallback((key) => {
    if (toppings[key] && !toppings[key].checked) playPlop();
    dispatch(pizzaHubActions.cycleToppingQuantity(key));
  }, [toppings, dispatch, playPlop]);

  return (
    <div className={styles.toppingsMenu}>
      <h1>Toppings</h1>
      <div className={styles.toppings}>

        <div className={styles.categoryHeader} style={{ '--cat-color': '#c89030' }}>
          Cheese
        </div>
        <div className={styles.cheeseGrid}>
          {cheeseEntries.map(([key, value]) => (
            <motion.button
              key={key}
              type='button'
              title={value.title}
              className={`${styles.cheeseCard} ${value.checked ? styles.cheeseActive : ''}`}
              onClick={() => handleCheeseToggle(key, value.checked)}
              whileTap={{ scale: 0.93 }}
            >
              <span className={styles.cheeseDot} style={{ background: CHEESE_SWATCHES[key] }} />
              <span className={styles.cheeseName}>{value.title}</span>
            </motion.button>
          ))}
        </div>

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
                const art  = TOPPING_ART[key];
                const dotCount = value.checked ? (DOT_COUNT[value.quantity] ?? 2) : 0;
                return (
                  <motion.button
                    key={key}
                    type='button'
                    title={value.checked ? `${meta.label} — ${value.quantity}` : meta.label}
                    className={`${styles.topping} ${value.checked ? styles.toppingActive : ''}`}
                    onClick={() => handleToppingCycle(key)}
                    whileTap={{ scale: 0.93 }}
                  >
                    <div className={styles.toppingMain}>
                      <img
                        className={styles.toppingImg}
                        src={art.image}
                        alt={meta.label}
                        loading='lazy'
                      />
                      <span className={styles.toppingName}>{meta.label}</span>
                      <div className={styles.dots}>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className={`${styles.dot} ${i < dotCount ? styles.dotFilled : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.button>
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
