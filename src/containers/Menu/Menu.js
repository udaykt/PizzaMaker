import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import './menu.css';
const Menu = (props) => {
  const menuItemNames = ['My Account', 'Orders', 'Contact', 'About Me'];

  const showMenuPage = useSelector((state) => state.header.showMenuPage);
  const headerState = useSelector((state) => state.header);

  return (
    <Fragment>
      <div className={showMenuPage ? 'menu' : 'hideMenu'}>
        <div className='menuLogo'>
          <h1>Menu</h1>
        </div>
        <div className='menuLinks'>
          <nav>
            <ul>
              {menuItemNames.map((i) => {
                return (
                  <li>
                    <NavLink
                      to={headerState.profilePath}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button className={'linkButton'}>{i}</Button>
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

export default Menu;
