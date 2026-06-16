import { Fragment } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import { Info, Mail, Receipt, User } from 'lucide-react';
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
    { name: 'My Profile', path: PROFILE_PATH, icon: User },
    { name: 'Orders',     path: ORDERS_PATH,  icon: Receipt },
    { name: 'Contact',    path: CONTACT_PATH, icon: Mail },
    { name: 'About Me',   path: ABOUT_PATH,   icon: Info },
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
                    <Button className={styles.linkButton}>
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

export default withRouter(NavOverlay);
