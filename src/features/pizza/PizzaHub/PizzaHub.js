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
import PresetPizzas from '@/features/pizza/Presets/PresetPizzas';
import PizzaDisplay from '@/features/pizza/PizzaDisplay/PizzaDisplay';
import ToppingsMenu from '@/features/pizza/ToppingsMenu/ToppingsMenu';
import AnimatedPrice from '@/shared/AnimatedPrice/AnimatedPrice';
import { computePriceBreakdown } from '@/utils/pricing';
import styles from './pizzahub.module.css';

const Menu = lazy(() => import('@/shared/NavOverlay/NavOverlay'));
const NotFound = lazy(() => import('@/pages/NotFound/NotFound'));
const LoginPage = lazy(() => import('@/features/auth/Login/Login'));
const SignUp = lazy(() => import('@/features/auth/SignUp/SignUp'));
const Guest = lazy(() => import('@/features/auth/Guest/Guest'));
const UserDashboard = lazy(() => import('@/shared/UserDashboard/UserDashboard'));
const Modal = lazy(() => import('@/shared/Modal/Modal'));

const PizzaHub = (props) => {
  const userState = useSelector((state) => state.auth);
  const uiState = useSelector((state) => state.ui);
  const pizzahubState = useSelector((state) => state.pizzaHub);
  const sizePricing = useSelector((state) => state.navigation.sizePricing);
  const pizzaSize = useSelector((state) => state.pizza.size);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchMenuPricing();
  }, []);

  useEffect(() => {
    document.body.style.overflow = uiState.backdrop ? 'hidden' : 'auto';
    if (userState) setUserName(userState.firstName);
  }, [userState, uiState]);

  const computePrice = () =>
    computePriceBreakdown({ ...pizzahubState, sizePricing, size: pizzaSize }).total;

  const state = {
    parts: { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' },
  };

  return (
    <div className={styles.pizzahub}>
      <div className={styles.descBase}>
        <div className={styles.description}>
          <strong>
            <h1>Welcome {`${userName ? userName : 'User'}`}!,</h1>
          </strong>
          <p>Make your own pizza. Customize and Order.</p>
          <div className={styles.priceTag}>
            <span className={styles.priceLabel}>Estimated Total</span>
            <span className={styles.priceValue}>
              <AnimatedPrice value={computePrice()} />
            </span>
          </div>
        </div>
        <div className={styles.presetsWrapper}>
          <PresetPizzas />
        </div>
        <div className={styles.baseWrapper}>
          <Base />
        </div>
      </div>
      {/* Pizza + Order button travel together and stay pinned (desktop only
          — see media query) so the live preview never scrolls out of view
          while picking sauce/cheese/toppings further down the side columns. */}
      <div className={styles.previewColumn}>
        <div className={styles.pizzaDiv}>
          <PizzaDisplay {...state} />
        </div>
        <div className={styles.orderButton}>
          <OrderButton />
        </div>
      </div>
      <div className={styles.toppingsMenu}>
        <ToppingsMenu {...state} />
      </div>
      {/* Mobile only (see media query) — keeps the running total visible
          while scrolling through the toppings list further down the page. */}
      <div className={styles.stickyPriceBar}>
        <span className={styles.stickyPriceLabel}>Total</span>
        <span className={styles.stickyPriceValue}>
          <AnimatedPrice value={computePrice()} />
        </span>
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
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
};

export default withRouter(PizzaHub);
