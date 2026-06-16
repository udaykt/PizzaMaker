import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import styles from './notFound.module.css';

const NotFound = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  const goHome = () => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  return (
    <div className={styles.notFound}>
      <span className={styles.code}>404</span>
      <h1>This slice doesn’t exist.</h1>
      <p>The page you’re after isn’t on the menu.</p>
      <Button className={styles.homeButton} onClick={goHome}>
        Back to Menu
      </Button>
    </div>
  );
};

export default NotFound;
