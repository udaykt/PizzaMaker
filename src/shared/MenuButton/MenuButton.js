import { useDispatch } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH, MENU_PATH } from '@/utils/routes';
import styles from './menuButton.module.css';

const MenuButton = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const open = window.location.pathname === MENU_PATH;

  const handleClick = () => {
    if (window.location.pathname === HOME_PATH) {
      history.push(MENU_PATH);
      dispatch(uiActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(uiActions.setBackdrop(false));
    }
  };

  return (
    <div
      title='Menu'
      className={`${styles.menuButton} ${open ? styles.open : ''}`}
      onClick={handleClick}
    >
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default withRouter(MenuButton);
