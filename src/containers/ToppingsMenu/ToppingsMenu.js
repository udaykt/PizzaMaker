import { useDispatch, useSelector } from 'react-redux';
import { pizzahubActions } from '../../store/pizzahubSlice';
import styles from './toppingsMenu.module.css';

const ToppingsMenu = (props) => {
  const toppings = useSelector((state) => state.pizzahub.toppings);

  const dispatch = useDispatch();

  const getStyle = (name) => {
    switch (name) {
      case 'pepperoni':
        return `var(--pepperoni-color)`;
      case 'sausage':
        return `var(--sausage-color)`;
      case 'peppers':
        return `var(--pepper-color)`;
      case 'olives':
        return `var(--olives-color)`;
      default:
        return '#fff';
    }
  };

  const checkboxChangeHandler = (e, key) => {
    let topping = toppings[key];
    topping = { ...topping, checked: e.target.checked };
    dispatch(pizzahubActions.toggleTopping(topping));
  };

  const radioChangeHandler = (e, key) => {
    let topping = toppings[key];
    topping = { ...topping, medium: e.target.value };
    dispatch(pizzahubActions.toggleToppingQuantity(topping));
  };

  return (
    <div className={styles.toppingsMenu}>
      <h1 title='toppings'>Toppings</h1>
      <div className={styles.toppings}>
        {Object.entries(toppings).map(([key, value]) => {
          return (
            <div className={styles.topping} key={key + value}>
              <h3>{key}</h3>
              <div className={styles.checkbox}>
                <input
                  type='checkbox'
                  name={key}
                  id={key}
                  key={key + value + 'checkbox'}
                  onChange={(e) => checkboxChangeHandler(e, key)}
                />
                <label
                  style={
                    value.checked
                      ? { backgroundColor: getStyle(key) }
                      : { backgroundColor: 'gray' }
                  }
                  htmlFor={key}
                ></label>
              </div>
              <div className={styles.radio}>
                <input
                  type='radio'
                  id={key + '_small'}
                  value={key}
                  name={key}
                  key={key + value + 'checkbox'}
                  defaultChecked
                  onChange={(e) => {
                    radioChangeHandler(e, key);
                  }}
                  disabled={!toppings[key].checked}
                />
                <label htmlFor={key + '_small'}>small</label>
                <input
                  type='radio'
                  id={key + '_medium'}
                  value={key}
                  name={key}
                  key={key + value + 'radio'}
                  onChange={(e) => {
                    radioChangeHandler(e, key);
                  }}
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
