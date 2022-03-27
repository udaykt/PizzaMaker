import Cheese from '../../components/Cheese/Cheese';
import Mozzarella from '../../components/Mozzarella/Mozzerella';
import Olive from '../../components/Olive/Olive';
import Pepperoni from '../../components/Pepperoni/Pepperoni';
import Peppers from '../../components/Peppers/Peppers';
import Sauce from '../../components/Sauce/Sauce';
import Sausage from '../../components/Sausage/Sausage';
import styles from './slice.module.css';

const Slice = (props) => {
  return (
    <div className={styles[`slice-${props.part}`]}>
      <Sauce {...props} />
      <Cheese {...props} />
      <Mozzarella {...props} />
      <Peppers {...props} />
      <Pepperoni {...props} />
      <Sausage {...props} />
      <Olive {...props} />
    </div>
  );
};

export default Slice;
