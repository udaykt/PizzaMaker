import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import avatarIcon from '../../assets/Logos/avatar-icon.png';
import appLogo from '../../assets/Logos/Logo.png';
import AvatarIcon from '../../components/UI/AvatarIcon/AvatarIcon';
import MenuIcon from '../../components/UI/Icons/MenuIcon/MenuIcon';
import LoginButton from '../../components/UI/LoginButton/LoginButton';
import { HOME_PATH } from '../../components/Utils/Constants';
import { avatarName } from '../../components/Utils/Utility';
import { headerActions } from '../../store/headerSlice';
import './header.css';

const Header = (props) => {
  const headerState = useSelector((state) => state.header);
  const userState = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const loggedIn = userState.loggedIn;
  let avatarname = avatarName(userState.firstName || '');
  const handleClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
  };

  return (
    <div className={'header'}>
      <div className='hamburgerMenu'>
        <MenuIcon>{props.children}</MenuIcon>
      </div>
      <div className='logo' title='Pizza Maker'>
        <Link to={HOME_PATH} onClick={handleClick}>
          <img src={appLogo} alt='' />
          <h1>Pizza Maker</h1>
        </Link>
      </div>
      <div className='avatar'>
        {(!loggedIn && (
          <div className='loginSignupDiv'>
            <LoginButton type='login'>Login</LoginButton>
            <div className='signupButtonDiv'>
              <LoginButton type='signup'>Sign Up</LoginButton>
            </div>
          </div>
        )) ||
          (loggedIn && (
            <AvatarIcon>
              <img
                id='avatar'
                src={avatarIcon}
                title={avatarname}
                alt={avatarname}
              />
            </AvatarIcon>
          ))}
      </div>
    </div>
  );
};

export default Header;
