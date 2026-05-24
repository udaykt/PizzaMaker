import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { navigationActions } from '@/store/navigationSlice';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import styles from './avatar.module.css';

const Avatar = (props) => {
  const headerState = useSelector((state) => state.navigation);
  const history = useHistory();
  const dispatch = useDispatch();

  const toggleAvatarButtonHandler = (e) => {
    if (headerState.showProfileMenu) {
      if (window.location.pathname !== HOME_PATH) {
        history.push(HOME_PATH);
        dispatch(uiActions.setBackdrop(false));
      }
      dispatch(navigationActions.toggleProfileMenu(false));
    } else dispatch(navigationActions.toggleProfileMenu(true));
  };

  return (
    <Button className={styles.avatarIcon} onClick={toggleAvatarButtonHandler}>
      {props.children}
    </Button>
  );
};

export default Avatar;
