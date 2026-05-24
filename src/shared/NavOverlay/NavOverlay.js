import { Fragment } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import Button from '@/shared/Button/Button';
import {
  ABOUT_PATH,
  CONTACT_PATH,
  ORDERS_PATH,
  PROFILE_PATH,
} from '@/utils/routes';
import styles from './navOverlay.module.css';

const NavOverlay = (props) => {
  const menuItems = [
    { name: 'My Profile', path: PROFILE_PATH },
    { name: 'Orders',     path: ORDERS_PATH  },
    { name: 'Contact',    path: CONTACT_PATH  },
    { name: 'About Me',   path: ABOUT_PATH    },
  ];

  return (
    <Fragment>
      <div className={styles.navOverlay}>
        <div className={styles.navLogo}>
          <h1>Menu</h1>
        </div>
        <div className={styles.navLinks}>
          <nav>
            <ul>
              {menuItems.map((item) => (
                <li key={item.name}>
                  <NavLink to={item.path} style={{ textDecoration: 'none' }}>
                    <Button className={styles.linkButton}>{item.name}</Button>
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

export default withRouter(NavOverlay);
