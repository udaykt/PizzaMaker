import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { headerActions } from '@/store/headerSlice';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH } from '@/utils/routes';
import Button from '@/shared/Button/Button';
import './avatar.css';

const Avatar = (props) => {
  const headerState = useSelector((state) => state.header);
  const history = useHistory();
  const dispatch = useDispatch();

  const toggleAvatarButtonHandler = (e) => {
    if (headerState.showProfileMenu) {
      if (window.location.pathname !== HOME_PATH) {
        history.push(HOME_PATH);
        dispatch(uiActions.setBackdrop(false));
      }
      dispatch(headerActions.toggleProfileMenu(false));
    } else dispatch(headerActions.toggleProfileMenu(true));
  };

  return (
    <Button className={'avatarIcon'} onClick={toggleAvatarButtonHandler}>
      {props.children}
    </Button>
  );
};

export default Avatar;
