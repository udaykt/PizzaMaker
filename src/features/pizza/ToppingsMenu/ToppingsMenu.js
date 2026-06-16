import { useDispatch, useSelector } from 'react-redux';
import { pizzaHubActions } from '@/store/pizzaHubSlice';
import usePizzaSound from '@/hooks/usePizzaSound';
import styles from './toppingsMenu.module.css';

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

  // Explicitly set medium to true/false rather than toggling, so that selecting
  // "regular" always means regular and "medium" always means medium.
  const regularHandler = (key) => {
    dispatch(pizzaHubActions.setToppingMedium({ title: key, medium: false }));
  };

  const mediumHandler = (key) => {
    dispatch(pizzaHubActions.setToppingMedium({ title: key, medium: true }));
  };

  return (
    <div className={styles.toppingsMenu}>
      <h1 title='toppings'>Toppings</h1>
      <div className={styles.toppings}>
        {Object.entries(toppings).map(([key, value]) => {
          return (
            <div className={`${styles.topping} ${value.checked ? styles.toppingActive : ''}`} key={key + value}>
              <div>
                <h3>{key}</h3>
              </div>
              <div className={styles.checkbox}>
                <input
                  type='checkbox'
                  name={key}
                  id={key}
                  key={key + value + 'checkbox'}
                  onChange={(e) => checkboxChangeHandler(e, key)}
                />
                <label htmlFor={key}></label>
              </div>
              <div className={styles.radio}>
                <input
                  type='radio'
                  id={key + '_small'}
                  value='regular'
                  name={key}
                  key={key + value + 'small'}
                  defaultChecked
                  onChange={() => regularHandler(key)}
                  disabled={!toppings[key].checked}
                />
                <label htmlFor={key + '_small'}>regular</label>
                <input
                  type='radio'
                  id={key + '_medium'}
                  value='medium'
                  name={key}
                  key={key + value + 'radio'}
                  onChange={() => mediumHandler(key)}
                  disabled={!toppings[key].checked}
                />
                <label htmlFor={key + '_medium'}>medium</label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToppingsMenu;
