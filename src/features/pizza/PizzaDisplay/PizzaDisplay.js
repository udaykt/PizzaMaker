import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import styles from './pizzaDisplay.module.css';

// A loaded sample pie shown to logged-out visitors so they can see what the
// builder produces before signing in. Slowly rotates like a turntable.
const DEMO_BASE = {
  sauce: { sauceType: 'robust-tomato' },
  mozzarella: { checked: true },
  provolone: { checked: true },
};
const DEMO_TOPPINGS = {
  pepperoni: { checked: true, quantity: 'extra' },
  sausage: { checked: true, quantity: 'regular' },
  peppers: { checked: true, quantity: 'regular' },
  olives: { checked: true, quantity: 'extra' },
};

const HINT_DISMISSED_KEY = 'pizzamaker_drag_hint_dismissed';

const PizzaDisplay = () => {
  const loggedIn = useSelector((state) => state.auth.loggedIn);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (loggedIn && !localStorage.getItem(HINT_DISMISSED_KEY)) {
      setShowHint(true);
    }
  }, [loggedIn]);

  const dismissHint = () => {
    localStorage.setItem(HINT_DISMISSED_KEY, '1');
    setShowHint(false);
  };

  return (
    <div className={styles.pizza}>
      {loggedIn ? (
        <>
          <PizzaCanvas editable />
          {showHint && (
            <button className={styles.dragHint} onClick={dismissHint}>
              Drag any topping to place it exactly where you want
            </button>
          )}
        </>
      ) : (
        <PizzaCanvas base={DEMO_BASE} toppings={DEMO_TOPPINGS} size='medium' idle />
      )}
    </div>
  );
};

export default PizzaDisplay;
