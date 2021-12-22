import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import './menu.css';
const Menu = (props) => {
  const showMenuPage = useSelector((state) => state.header.showMenuPage);
  return (
    <Fragment>
      <div className={showMenuPage ? 'menu' : 'hideMenu'}>
        <div className='menuLogo'>
          <h1>Menu</h1>
        </div>
        <div className='links'>
          <nav>
            <ul>
              <li>
                <a href='a'>My Account</a>
              </li>
              <li>
                <a href='a'>Checkout</a>
              </li>
              <li>
                <a href='a'>Orders</a>
              </li>
              <li>
                <a href='a'>Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </Fragment>
  );
};

export default Menu;
