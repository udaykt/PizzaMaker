import Button from '../Buttons/Button';
import './profileButton.css';
import { useDispatch, useSelector } from 'react-redux';
import { headerActions } from '../../../store/headerSlice';
import { NavLink } from 'react-router-dom';

const ProfileButton = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();
  const toggleLoginPageHandler = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleLoginPage());
  };
  return (
    <NavLink to={headerState.loginPath} onClick={toggleLoginPageHandler}>
      <div className={'profileButtonDiv'}>
        <Button className={'profileAvatar'}>{props.children}</Button>
      </div>
    </NavLink>
  );
};

export default ProfileButton;
