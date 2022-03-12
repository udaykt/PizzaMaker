import './profileButton.css';
import Button from '../Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { headerActions } from '../../../store/headerSlice';
import { NavLink } from 'react-router-dom';

const ProfileButton = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();
  const toggleLoginPageHandler = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    dispatch(headerActions.toggleLoginPage());
  };
  return (
    <NavLink
      to={headerState.loginPath}
      style={{ textDecoration: 'none' }}
      onClick={toggleLoginPageHandler}
    >
      <Button className={'profileButton'}>{props.children}</Button>
    </NavLink>
  );
};

export default ProfileButton;
