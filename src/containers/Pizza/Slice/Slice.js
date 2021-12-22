import styles from './slice.module.css';
import Cheese from '../../../components/Cheese/Cheese';
import Sauce from '../../../components/Sauce/Sauce';
import Peppers from '../../../components/Peppers/Peppers';
import Pepperoni from '../../../components/Pepperoni/Pepperoni';
import Sausage from '../../../components/Sausage/Sausage';
import Olive from '../../../components/Olive/Olive';
import Mozzarella from '../../../components/Mozzarella/Mozzerella';

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
