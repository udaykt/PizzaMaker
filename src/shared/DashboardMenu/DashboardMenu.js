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
import './dashboardMenu.css';

const DashboardMenu = (props) => {
  const userType = useSelector((state) => state.user.userType);
  const isAdmin = userType === 'ADMIN';

  const menuItems = [
    { name: 'My Profile', path: PROFILE_PATH },
    { name: 'Orders',     path: ORDERS_PATH  },
    { name: 'Checkout',   path: CHECKOUT_PATH },
    { name: 'Contact',    path: CONTACT_PATH  },
    { name: 'About',      path: ABOUT_PATH    },
    ...(isAdmin ? [{ name: 'âš™ Admin', path: ADMIN_PATH }] : []),
  ];

  return (
    <Fragment>
      <div className='dashboardMenu'>
        <div className='dashBoardLogo'>
          <h1>Dashboard</h1>
        </div>
        <div className='menuLinks'>
          <nav>
            <ul>
              {menuItems.map((i) => (
                <li key={i.name}>
                  <NavLink to={i.path} style={{ textDecoration: 'none' }}>
                    <Button className={`linkButton${i.name.includes('Admin') ? ' adminLink' : ''}`}>
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
