import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { LOGIN_PATH, ORDERS_PATH } from '@/utils/routes';
import Logout from '@/features/auth/Logout/Logout';
import './profile.css';

const ACCOUNT_TYPE_LABELS = {
  STANDARD: { label: 'Standard', color: '#4caf50' },
  GUEST:    { label: 'Guest',    color: '#ff9800' },
  ADMIN:    { label: 'Admin',    color: '#e53935' },
};

const Profile = () => {
  const userState = useSelector((state) => state.user);
  const accountInfo = ACCOUNT_TYPE_LABELS[userState.userType] || { label: userState.userType, color: '#999' };

  return (
    <div className='profile'>
      <div className='profileAvatar'>
        <span className='profileInitial'>
          {userState.firstName ? userState.firstName[0].toUpperCase() : '?'}
        </span>
        <div className='profileName'>
          <h2>{userState.firstName || 'User'}</h2>
          <span className='profileBadge' style={{ background: accountInfo.color }}>
            {accountInfo.label}
          </span>
        </div>
      </div>

      <div className='profileDetails'>
        <div className='profileRow'>
          <span className='profileLabel'>Email</span>
          <span className='profileValue'>{userState.emailId || 'â€”'}</span>
        </div>
        <div className='profileRow'>
          <span className='profileLabel'>Account</span>
          <span className='profileValue'>{accountInfo.label}</span>
        </div>
      </div>

      <div className='profileActions'>
        <NavLink to={ORDERS_PATH} style={{ textDecoration: 'none', flex: 1 }}>
          <button className='profileActionBtn profileOrdersBtn'>My Orders</button>
        </NavLink>
        <NavLink to={LOGIN_PATH} style={{ textDecoration: 'none', flex: 1 }}>
          <Logout className='profileActionBtn profileLogoutBtn' />
        </NavLink>
      </div>
    </div>
  );
};

export default Profile;
