import { Fragment } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import {
  ABOUT_PATH,
  CONTACT_PATH,
  ORDERS_PATH,
  PROFILE_PATH,
} from '../../components/Utils/Constants';
import './menu.css';
const Menu = (props) => {
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
      <div className={true ? 'menu' : 'hideMenu'}>
        <div className='menuLogo'>
          <h1>Menu</h1>
        </div>
        <div className='menuLinks'>
          <nav>
            <ul>
              {menuItems.map((i) => {
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

export default withRouter(Menu);
