import React, { useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler/build/OutsideClickHandler';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import Logout from '../../../containers/Logout/Logout';
import { headerActions } from '../../../store/headerSlice';
import { LOGIN_PATH, PROFILE_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './profileMenu.css';

const ProfileMenu = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();

  const collapseMenu = (e) => {
    if (headerState.showProfileMenu)
      dispatch(headerActions.toggleProfileMenu(false));
  };
  const logoutButtonHandler = (e) => {
    collapseMenu();
  };

  return (
    <div
      className={
        headerState.showProfileMenu ? 'profileMenuDiv' : 'hideProfileMenuDiv'
      }
    >
      <div className='profileMenu'>
        <nav>
          <ul>
            <li>
              <NavLink
                to={PROFILE_PATH}
                style={{ textDecoration: 'none' }}
                onClick={collapseMenu}
              >
                <Button className={'profileMenuButton'}>My Profile</Button>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={LOGIN_PATH}
                style={{ textDecoration: 'none' }}
                onClick={logoutButtonHandler}
              >
                <Logout className={'profileMenuButton'} />
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default withRouter(ProfileMenu);
