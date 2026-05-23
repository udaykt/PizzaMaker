import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import Backdrop from '../../components/UI/Backdrop/Backdrop';
import Modal from '../../components/UI/Modal/Modal';
import OrderButton from '../../components/UI/OrderButton/OrderButton';
import ProfileMenu from '../../components/UI/ProfileMenu/ProfileMenu';
import UserDashboard from '../../components/UI/UserDashboard/UserDashboard';
import {
  CONFIRM_PATH,
  DASHBOARD_PATH,
  GUEST_PATH,
  HOME_PATH,
  LOGIN_PATH,
  MENU_PATH,
  SIGNUP_PATH,
} from '../../components/Utils/Constants';
import { fetchMenuPricing } from '../Firebase/Firebase';
import Base from '../Base/Base';
import Guest from '../Guest/Guest';
import LoginPage from '../LoginPage/LoginPage';
import Menu from '../Menu/Menu';
import Pizza from '../Pizza/Pizza';
import SignUp from '../SignUp/SignUp';
import ToppingsMenu from '../ToppingsMenu/ToppingsMenu';
import styles from './pizzahub.module.css';

const TOPPING_PRICE_REGULAR = 1.5;
const TOPPING_PRICE_MEDIUM = 2.0;
const BASE_ITEM_PRICE = 0.5;

const PizzaHub = (props) => {
  const userState = useSelector((state) => state.user);
  const uiState = useSelector((state) => state.ui);
  const pizzahubState = useSelector((state) => state.pizzahub);
  const sizePricing = useSelector((state) => state.menu.sizePricing);
  const pizzaSize = useSelector((state) => state.pizza.size);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchMenuPricing();
  }, []);

  useEffect(() => {
    document.body.style.overflow = uiState.backdrop ? 'hidden' : 'auto';
    if (userState) setUserName(userState.firstName);
  }, [userState, uiState]);

  const computePrice = () => {
    const sizeKey = pizzaSize ? pizzaSize.toUpperCase() : 'M';
    let total = sizePricing[sizeKey] || 12;
    const { base, toppings } = pizzahubState;
    Object.values(base).forEach((b) => { if (b.checked) total += BASE_ITEM_PRICE; });
    Object.values(toppings).forEach((t) => {
      if (t.checked) total += t.medium ? TOPPING_PRICE_MEDIUM : TOPPING_PRICE_REGULAR;
    });
    return total.toFixed(2);
  };

  const state = {
    parts: { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' },
  };

  return (
    <div className={styles.pizzahub}>
      <div className={styles.description}>
        <strong>
          <h1>Welcome {`${userName ? userName : 'User'}`}!,</h1>
        </strong>
        <p>Make your own pizza. Customize and Order.</p>
        <div className={styles.priceTag}>
          <span className={styles.priceLabel}>Estimated Total</span>
          <span className={styles.priceValue}>${computePrice()}</span>
        </div>
      </div>
      <Pizza {...state} />
      <div className={styles.base}>
        <Base />
      </div>
      <div className={styles.toppingsMenu}>
        <ToppingsMenu {...state} />
      </div>
      <div className={styles.orderButton}>
        <OrderButton />
      </div>
      <ProfileMenu />
      <Backdrop />
      <Switch>
        <Redirect exact from={HOME_PATH} to={HOME_PATH} />
        <Route path={MENU_PATH} component={Menu} />
        <Route path={LOGIN_PATH} component={LoginPage} />
        <Route path={SIGNUP_PATH} component={SignUp} />
        <Route path={GUEST_PATH} component={Guest} />
        <Route path={DASHBOARD_PATH} component={UserDashboard} />
        <Route path={CONFIRM_PATH} component={Modal} />
      </Switch>
    </div>
  );
};

export default withRouter(PizzaHub);
