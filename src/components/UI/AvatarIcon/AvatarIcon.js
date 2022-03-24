import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { headerActions } from '../../../store/headerSlice';
import Button from '../Buttons/Button';
import './avatarIcon.css';

const AvatarIcon = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();

  const toggleAvatarButtonHandler = (e) => {
    console.log(headerState.showProfileMenu);
    dispatch(headerActions.toggleProfileMenu());
  };

  return (
    <Button className={'avatarIcon'} onClick={toggleAvatarButtonHandler}>
      {props.children}
    </Button>
  );
};
export default AvatarIcon;
