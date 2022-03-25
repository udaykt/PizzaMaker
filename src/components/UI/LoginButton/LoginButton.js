import './loginButton.css';
import Button from '../Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { headerActions } from '../../../store/headerSlice';
import { NavLink } from 'react-router-dom';

const LoginButton = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();

  const toggleLoginPageHandler = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    dispatch(headerActions.toggleLoginPage());
  };
  const toggleSignupPageHandler = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    dispatch(headerActions.toggleSignupPage());
  };
  const items = {
    login: {
      handler: toggleLoginPageHandler,
      routePath: headerState.loginPath,
    },
    signup: {
      handler: toggleSignupPageHandler,
      routePath: headerState.signupPath,
    },
  };

  return (
    <NavLink
      to={items[props.type].routePath}
      style={{ textDecoration: 'none' }}
      onClick={items[props.type].handler}
    >
      <Button className={'loginButton'}>{props.children}</Button>
    </NavLink>
  );
};

export default LoginButton;
