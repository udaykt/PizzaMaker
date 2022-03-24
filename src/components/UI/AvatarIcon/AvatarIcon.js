import React from 'react';
import { useDispatch } from 'react-redux';
import { headerActions } from '../../../store/headerSlice';
import Button from '../Buttons/Button';
import './avatarIcon.css';

const AvatarIcon = (props) => {
  const dispatch = useDispatch();

  const toggleAvatarButtonHandler = (e) => {
    dispatch(headerActions.toggleProfileMenu());
  };

  return (
    <Button className={'avatarIcon'} onClick={toggleAvatarButtonHandler}>
      {props.children}
    </Button>
  );
};
export default AvatarIcon;
