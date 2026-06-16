import { useSelector } from 'react-redux';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import styles from './pizzaDisplay.module.css';

// A loaded sample pie shown to logged-out visitors so they can see what the
// builder produces before signing in. Slowly rotates like a turntable.
const DEMO_BASE = {
  sauce: { checked: true },
  mozzarella: { checked: true },
  cheese: { checked: true },
};
const DEMO_TOPPINGS = {
  pepperoni: { checked: true, medium: true },
  sausage: { checked: true, medium: false },
  peppers: { checked: true, medium: false },
  olives: { checked: true, medium: true },
};

const PizzaDisplay = () => {
  const loggedIn = useSelector((state) => state.auth.loggedIn);

  return (
    <div className={styles.pizza}>
      {loggedIn ? (
        <PizzaCanvas />
      ) : (
        <PizzaCanvas base={DEMO_BASE} toppings={DEMO_TOPPINGS} size='medium' idle />
      )}
    </div>
  );
};

export default PizzaDisplay;
