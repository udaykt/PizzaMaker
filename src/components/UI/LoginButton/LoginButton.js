import { useDispatch } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { pizzahubActions } from '../../../store/pizzahubSlice';
import { uiActions } from '../../../store/uiSlice';
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './loginButton.css';

const LoginButton = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const toggleLoginPageHandler = (e) => {
    if (window.location.pathname === HOME_PATH || SIGNUP_PATH) {
      history.push(LOGIN_PATH);
      dispatch(uiActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(uiActions.setBackdrop(false));
    }
  };
  const toggleSignupPageHandler = (e) => {
    if (window.location.pathname === HOME_PATH || LOGIN_PATH) {
      history.push(SIGNUP_PATH);
      dispatch(uiActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(uiActions.setBackdrop(false));
    }
  };
  const items = {
    login: {
      buttonStyle: 'loginButton',
      handler: toggleLoginPageHandler,
    },
    signup: {
      buttonStyle: 'signupButton',
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
