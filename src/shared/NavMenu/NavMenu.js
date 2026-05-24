import { useDispatch } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH, MENU_PATH } from '@/utils/routes';
import './navMenu.css';

const MenuIcon = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();
  var open = window.location.pathname === MENU_PATH;

  const toggleMenuIconHandler = () => {
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
      className={`menuIcon ${open ? 'open' : ''}`}
      onClick={toggleMenuIconHandler}
    >
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default withRouter(MenuIcon);
