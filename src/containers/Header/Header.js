import './header.css';
import appLogo from '../../assets/Logos/Logo.png';
import ProfileButton from '../../components/UI/ProfileButton/ProfileButton';
import MenuIcon from '../../components/UI/Icons/MenuIcon/MenuIcon';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { headerActions } from '../../store/headerSlice';
import { useState } from 'react';

const Header = (props) => {
  const headerState = useSelector((state) => state.header);
  const [loginPath, setLoginPath] = useState('/login');
  const dispatch = useDispatch();
  const handleClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
  };

  const username = 'UK';
  return (
    <div className={'header'}>
      <div className='hamburgerMenu'>
        <MenuIcon>{props.children}</MenuIcon>
      </div>
      <div className='logo' title='Pizza Maker'>
        <Link to='/home' onClick={handleClick}>
          <img src={appLogo} alt='' />
          <h1>Pizza Maker</h1>
        </Link>
      </div>
      <div className='avatar'>
        <ProfileButton>{username}</ProfileButton>
      </div>
    </div>
  );
};

export default Header;
