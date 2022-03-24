import React from 'react';
import OutsideClickHandler from 'react-outside-click-handler/build/OutsideClickHandler';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import Logout from '../../../containers/Logout/Logout';
import { headerActions } from '../../../store/headerSlice';
import Button from '../Buttons/Button';
import './profileMenu.css';

export const ProfileMenu = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();

  const collapseMenu = (e) => {
    if (headerState.showProfileMenu)
      dispatch(headerActions.toggleProfileMenu());
  };

  const logoutButtonHandler = (e) => {
    collapseMenu();
    if (!headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
  };

  return (
    <div
      className={
        headerState.showProfileMenu ? 'profileMenuDiv' : 'hideProfileMenuDiv'
      }
    >
      <OutsideClickHandler onOutsideClick={collapseMenu}>
        <div className='profileMenu'>
          <nav>
            <ul>
              <li>
                <NavLink
                  to={headerState.profilePath}
                  style={{ textDecoration: 'none' }}
                  onClick={collapseMenu}
                >
                  <Button className={'profileMenuButton'}>My Profile</Button>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={headerState.loginPath}
                  style={{ textDecoration: 'none' }}
                  onClick={logoutButtonHandler}
                >
                  <Logout className={'profileMenuButton'} />
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </OutsideClickHandler>
    </div>
  );
};
