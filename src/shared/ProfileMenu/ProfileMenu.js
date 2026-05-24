import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, withRouter } from 'react-router-dom';
import Logout from '@/features/auth/Logout/Logout';
import { navigationActions } from '@/store/navigationSlice';
import { LOGIN_PATH, PROFILE_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import styles from './profileMenu.module.css';

const ProfileMenu = (props) => {
  const headerState = useSelector((state) => state.navigation);
  const dispatch = useDispatch();

  const collapseMenu = (e) => {
    if (headerState.showProfileMenu)
      dispatch(navigationActions.toggleProfileMenu(false));
  };
  const logoutButtonHandler = (e) => {
    collapseMenu();
  };

  return (
    <div
      className={
        headerState.showProfileMenu ? styles.profileMenuDiv : styles.hideProfileMenuDiv
      }
    >
      <div className={styles.profileMenu}>
        <nav>
          <ul>
            <li>
              <NavLink
                to={PROFILE_PATH}
                style={{ textDecoration: 'none' }}
                onClick={collapseMenu}
              >
                <Button className={styles.profileMenuButton}>My Profile</Button>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={LOGIN_PATH}
                style={{ textDecoration: 'none' }}
                onClick={logoutButtonHandler}
              >
                <Logout className={styles.profileMenuButton} />
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default withRouter(ProfileMenu);
