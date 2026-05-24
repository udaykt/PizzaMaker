import { useDispatch } from 'react-redux';
import { useHistory, useLocation, withRouter } from 'react-router-dom';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import styles from './loginButton.module.css';

const LoginButton = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const toggleLoginPageHandler = (e) => {
    const path = location.pathname;
    if (path === HOME_PATH || path === SIGNUP_PATH) {
      history.push(LOGIN_PATH);
      dispatch(uiActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(uiActions.setBackdrop(false));
    }
  };
  const toggleSignupPageHandler = (e) => {
    const path = location.pathname;
    if (path === HOME_PATH || path === LOGIN_PATH) {
      history.push(SIGNUP_PATH);
      dispatch(uiActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(uiActions.setBackdrop(false));
    }
  };
  const items = {
    login: {
      buttonStyle: styles.loginButton,
      handler: toggleLoginPageHandler,
    },
    signup: {
      buttonStyle: styles.signupButton,
      handler: toggleSignupPageHandler,
    },
  };

  return (
    <Button
      className={items[props.type].buttonStyle}
      onClick={items[props.type].handler}
    >
      {props.children}
    </Button>
  );
};

export default withRouter(LoginButton);
