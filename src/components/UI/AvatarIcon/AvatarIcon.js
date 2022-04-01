import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { headerActions } from '../../../store/headerSlice';
import { pizzahubActions } from '../../../store/pizzahubSlice';
import { HOME_PATH } from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './avatarIcon.css';

const AvatarIcon = (props) => {
  const headerState = useSelector((state) => state.header);
  const history = useHistory();
  const dispatch = useDispatch();

  const toggleAvatarButtonHandler = (e) => {
    if (headerState.showProfileMenu) {
      if (window.location.pathname !== HOME_PATH) {
        history.push(HOME_PATH);
        dispatch(pizzahubActions.setBackdrop(false));
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
export default AvatarIcon;
