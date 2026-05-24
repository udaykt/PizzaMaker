import Cheese from '@/features/pizza/Toppings/Cheese/Cheese';
import Mozzarella from '@/features/pizza/Toppings/Mozzarella/Mozzarella';
import Olive from '@/features/pizza/Toppings/Olive/Olive';
import Pepperoni from '@/features/pizza/Toppings/Pepperoni/Pepperoni';
import Peppers from '@/features/pizza/Toppings/Peppers/Peppers';
import Sauce from '@/features/pizza/Toppings/Sauce/Sauce';
import Sausage from '@/features/pizza/Toppings/Sausage/Sausage';
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
