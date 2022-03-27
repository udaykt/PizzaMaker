import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ABOUT_PATH,
  CHECKOUT_PATH,
  CONTACT_PATH,
  ORDERS_PATH,
  PROFILE_PATH,
} from '../../Utils/Constants';
import Button from '../Buttons/Button';
import './dashboardMenu.css';

const DashboardMenu = (props) => {
  const menuItems = [
    {
      name: 'My Profile',
      path: PROFILE_PATH,
    },
    {
      name: 'Orders',
      path: ORDERS_PATH,
    },
    {
      name: 'Checkout',
      path: CHECKOUT_PATH,
    },
    {
      name: 'Contact',
      path: CONTACT_PATH,
    },
    {
      name: 'About Me',
      path: ABOUT_PATH,
    },
  ];

  return (
    <Fragment>
      <div className={'dashboardMenu'}>
        <div className='dashBoardLogo'>
          <h1>Dashboard</h1>
        </div>
        <div className='menuLinks'>
          <nav>
            <ul>
              {menuItems.map((i) => {
                console.log(i.path);
                return (
                  <li key={i.name}>
                    <NavLink to={i.path} style={{ textDecoration: 'none' }}>
                      <Button className={'linkButton'}>{i.name}</Button>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </Fragment>
  );
};

export default DashboardMenu;
