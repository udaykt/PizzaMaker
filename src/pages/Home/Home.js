import { useDispatch, useSelector } from 'react-redux';
import Header from '@/shared/Header/Header';
import PizzaHub from '@/features/pizza/PizzaHub/PizzaHub';
import { navigationActions } from '@/store/navigationSlice';
import styles from './home.module.css';

const Home = (props) => {
  const headerState = useSelector((state) => state.navigation);
  const dispatch = useDispatch();
  const collapse = (e) => {
    if (e.target.id !== 'avatar' && headerState.showProfileMenu) {
      dispatch(navigationActions.toggleProfileMenu(false));
    }
  };
  return (
    <div className={styles.home} onClick={collapse}>
      <div className={styles.headerDiv}>
        <Header />
      </div>
      <div className={styles.pizzahubDiv}>
        <PizzaHub />
      </div>
    </div>
  );
};

export default Home;
