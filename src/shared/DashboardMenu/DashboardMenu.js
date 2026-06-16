import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Info, Mail, Receipt, Settings, ShoppingCart, User } from 'lucide-react';
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
    { name: 'My Profile', path: PROFILE_PATH, icon: User },
    { name: 'Orders', path: ORDERS_PATH, icon: Receipt },
    { name: 'Checkout', path: CHECKOUT_PATH, icon: ShoppingCart },
    { name: 'Contact', path: CONTACT_PATH, icon: Mail },
    { name: 'About', path: ABOUT_PATH, icon: Info },
    ...(isAdmin ? [{ name: 'Admin', path: ADMIN_PATH, icon: Settings, admin: true }] : []),
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
              {menuItems.map((item) => (
                <li key={item.name}>
                  <NavLink to={item.path} style={{ textDecoration: 'none' }}>
                    <Button className={item.admin ? `${styles.linkButton} ${styles.adminLink}` : styles.linkButton}>
                      <item.icon size={16} className={styles.linkIcon} />
                      {item.name}
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
