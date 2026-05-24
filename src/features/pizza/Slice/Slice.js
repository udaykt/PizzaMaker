import Cheese from '@/features/pizza/toppings/Cheese/Cheese';
import Mozzarella from '@/features/pizza/toppings/Mozzarella/Mozzarella';
import Olive from '@/features/pizza/toppings/Olive/Olive';
import Pepperoni from '@/features/pizza/toppings/Pepperoni/Pepperoni';
import Peppers from '@/features/pizza/toppings/Peppers/Peppers';
import Sauce from '@/features/pizza/toppings/Sauce/Sauce';
import Sausage from '@/features/pizza/toppings/Sausage/Sausage';
import styles from './slice.module.css';

const Slice = (props) => {
  return (
    <div className={styles[`slice`]} style={props.style}>
      <Sauce {...props} />
      <Cheese {...props} />
      <Mozzarella {...props} />
      <Pepperoni {...props} />
      <Peppers {...props} />
      <Sausage {...props} />
      <Olive {...props} />
    </div>
  );
};

export default Slice;
