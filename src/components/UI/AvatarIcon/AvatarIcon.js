import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import Button from '../Buttons/Button';
import './avatarIcon.css';

const AvatarIcon = (props) => {
  const headerState = useSelector((state) => state.header);

  const toggleAvatarButtonHandler = () => {};
  return (
    <NavLink
      to={headerState.loginPath}
      style={{ textDecoration: 'none' }}
      onClick={toggleAvatarButtonHandler}
    >
      <Button className={'avatarIcon'}>{props.children}</Button>
    </NavLink>
  );
};
export default AvatarIcon;
