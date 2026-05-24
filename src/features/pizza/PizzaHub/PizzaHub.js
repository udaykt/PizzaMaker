import { Suspense, lazy, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import Backdrop from '@/shared/Backdrop/Backdrop';
import OrderButton from '@/shared/OrderButton/OrderButton';
import ProfileMenu from '@/shared/ProfileMenu/ProfileMenu';
import {
  CONFIRM_PATH,
  DASHBOARD_PATH,
  GUEST_PATH,
  HOME_PATH,
  LOGIN_PATH,
  MENU_PATH,
  SIGNUP_PATH,
} from '@/utils/routes';
import { fetchMenuPricing } from '@/api/appApi';
import Base from '@/features/pizza/Base/Base';
import PizzaDisplay from '@/features/pizza/PizzaDisplay/PizzaDisplay';
import ToppingsMenu from '@/features/pizza/ToppingsMenu/ToppingsMenu';
import styles from './pizzahub.module.css';

const Menu = lazy(() => import('@/shared/NavOverlay/NavOverlay'));
const LoginPage = lazy(() => import('@/features/auth/Login/Login'));
const SignUp = lazy(() => import('@/features/auth/SignUp/SignUp'));
const Guest = lazy(() => import('@/features/auth/Guest/Guest'));
const UserDashboard = lazy(() => import('@/shared/UserDashboard/UserDashboard'));
const Modal = lazy(() => import('@/shared/Modal/Modal'));

const TOPPING_PRICE_REGULAR = 1.5;
const TOPPING_PRICE_MEDIUM = 2.0;
const BASE_ITEM_PRICE = 0.5;

const PizzaHub = (props) => {
  const userState = useSelector((state) => state.auth);
  const uiState = useSelector((state) => state.ui);
  const pizzahubState = useSelector((state) => state.pizzaHub);
  const sizePricing = useSelector((state) => state.nav.sizePricing);
  const pizzaSize = useSelector((state) => state.pizza.size);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchMenuPricing();
  }, []);

  useEffect(() => {
    document.body.style.overflow = uiState.backdrop ? 'hidden' : 'auto';
    if (userState) setUserName(userState.firstName);
  }, [userState, uiState]);

  const SIZE_TO_ENUM = { regular: 'R', medium: 'M', large: 'L' };

  const computePrice = () => {
    const sizeKey = (pizzaSize && SIZE_TO_ENUM[pizzaSize]) || 'M';
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
      <PizzaDisplay {...state} />
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
      <Suspense fallback={null}>
        <Switch>
          <Redirect exact from={HOME_PATH} to={HOME_PATH} />
          <Route path={MENU_PATH} component={Menu} />
          <Route path={LOGIN_PATH} component={LoginPage} />
          <Route path={SIGNUP_PATH} component={SignUp} />
          <Route path={GUEST_PATH} component={Guest} />
          <Route path={DASHBOARD_PATH} component={UserDashboard} />
          <Route path={CONFIRM_PATH} component={Modal} />
        </Switch>
      </Suspense>
    </div>
  );
};

export default withRouter(PizzaHub);
