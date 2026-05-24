import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { LOGIN_PATH, ORDERS_PATH } from '@/utils/routes';
import Logout from '@/features/auth/Logout/Logout';
import styles from './profile.module.css';

const ACCOUNT_TYPE_LABELS = {
  STANDARD: { label: 'Standard', color: '#4caf50' },
  GUEST:    { label: 'Guest',    color: '#ff9800' },
  ADMIN:    { label: 'Admin',    color: '#e53935' },
};

const Profile = () => {
  const userState = useSelector((state) => state.auth);
  const accountInfo = ACCOUNT_TYPE_LABELS[userState.userType] || { label: userState.userType, color: '#999' };

  return (
    <div className={styles.profile}>
      <div className={styles.profileAvatar}>
        <span className={styles.profileInitial}>
          {userState.firstName ? userState.firstName[0].toUpperCase() : '?'}
        </span>
        <div className={styles.profileName}>
          <h2>{userState.firstName || 'User'}</h2>
          <span className={styles.profileBadge} style={{ background: accountInfo.color }}>
            {accountInfo.label}
          </span>
        </div>
      </div>

      <div className={styles.profileDetails}>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Email</span>
          <span className={styles.profileValue}>{userState.emailId || '—'}</span>
        </div>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Account</span>
          <span className={styles.profileValue}>{accountInfo.label}</span>
        </div>
      </div>

      <div className={styles.profileActions}>
        <NavLink to={ORDERS_PATH} style={{ textDecoration: 'none', flex: 1 }}>
          <button className={`${styles.profileActionBtn} ${styles.profileOrdersBtn}`}>My Orders</button>
        </NavLink>
        <NavLink to={LOGIN_PATH} style={{ textDecoration: 'none', flex: 1 }}>
          <Logout className={`${styles.profileActionBtn} ${styles.profileLogoutBtn}`} />
        </NavLink>
      </div>
    </div>
  );
};

export default Profile;
