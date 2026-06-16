import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
  ABOUT_PATH,
  ADMIN_PATH,
  CHECKOUT_PATH,
  CONTACT_PATH,
  ORDERS_PATH,
  PROFILE_PATH,
} from '@/utils/routes';
import Button from '@/shared/Button/Button';
import styles from './dashboardMenu.module.css';

const DashboardMenu = (props) => {
  const userType = useSelector((state) => state.auth.userType);
  const isAdmin = userType === 'ADMIN';

  const menuItems = [
    { name: 'My Profile', path: PROFILE_PATH },
    { name: 'Orders',     path: ORDERS_PATH  },
    { name: 'Checkout',   path: CHECKOUT_PATH },
    { name: 'Contact',    path: CONTACT_PATH  },
    { name: 'About',      path: ABOUT_PATH    },
    ...(isAdmin ? [{ name: '⚙ Admin', path: ADMIN_PATH }] : []),
  ];

  return (
    <Fragment>
      <div className={styles.dashboardMenu}>
        <div className={styles.dashboardLogo}>
          <h1>Dashboard</h1>
        </div>
        <div className={styles.menuLinks}>
          <nav>
            <ul>
              {menuItems.map((i) => (
                <li key={i.name}>
                  <NavLink to={i.path} style={{ textDecoration: 'none' }}>
                    <Button className={i.name.includes('Admin') ? `${styles.linkButton} ${styles.adminLink}` : styles.linkButton}>
                      {i.name}
                    </Button>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Fragment>
  );
};

export default DashboardMenu;
