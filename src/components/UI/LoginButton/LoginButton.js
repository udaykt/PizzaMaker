import { useDispatch } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { pizzahubActions } from '../../../store/pizzahubSlice';
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './loginButton.css';

const LoginButton = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const toggleLoginPageHandler = (e) => {
    if (window.location.pathname === HOME_PATH || SIGNUP_PATH) {
      history.push(LOGIN_PATH);
      dispatch(pizzahubActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(pizzahubActions.setBackdrop(false));
    }
  };
  const toggleSignupPageHandler = (e) => {
    if (window.location.pathname === HOME_PATH || LOGIN_PATH) {
      history.push(SIGNUP_PATH);
      dispatch(pizzahubActions.setBackdrop(true));
    } else {
      history.push(HOME_PATH);
      dispatch(pizzahubActions.setBackdrop(false));
    }
  };
  const items = {
    login: {
      handler: toggleLoginPageHandler,
    },
    signup: {
      handler: toggleSignupPageHandler,
    },
  };

  return (
    <Button className={'loginButton'} onClick={items[props.type].handler}>
      {props.children}
    </Button>
  );
};

export default withRouter(LoginButton);
