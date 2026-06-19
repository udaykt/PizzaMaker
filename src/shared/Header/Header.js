import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import avatarIcon from '@/assets/images/avatar.png';
import appLogo from '@/assets/images/logo-banner.png';
import AvatarIcon from '@/shared/Avatar/Avatar';
import MenuIcon from '@/shared/MenuButton/MenuButton';
import LoginButton from '@/shared/LoginButton/LoginButton';
import { HOME_PATH } from '@/utils/routes';
import { avatarName } from '@/utils/helpers';
import { navigationActions } from '@/store/navigationSlice';
import styles from './header.module.css';

const Header = (props) => {
  const headerState = useSelector((state) => state.navigation);
  const userState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const loggedIn = userState.loggedIn;
  let avatarname = avatarName(userState.firstName || '');
  const handleClick = (e) => {
    if (headerState.showMenuPage) dispatch(navigationActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(navigationActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(navigationActions.toggleSignupPage());
  };

  return (
    <div className={styles.header}>
      <div className={styles.hamburgerMenu}>
        <MenuIcon>{props.children}</MenuIcon>
      </div>
      <div className={styles.logo} title='Pizza Maker'>
        <Link to={HOME_PATH} onClick={handleClick}>
          <img src={appLogo} alt='Pizza Maker' />
        </Link>
      </div>
      <div className={styles.avatar}>
        {(!loggedIn && (
          <div className={styles.loginSignupDiv}>
            <LoginButton type='login'>Login</LoginButton>
            <div className={styles.signupButtonDiv}>
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
