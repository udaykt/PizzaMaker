import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { pizzaHubActions } from '@/store/pizzaHubSlice';
import { pizzaActions } from '@/store/pizzaSlice';
import styles from './pizzahub.module.css';

const Menu = lazy(() => import('@/shared/NavOverlay/NavOverlay'));
const NotFound = lazy(() => import('@/pages/NotFound/NotFound'));
const LoginPage = lazy(() => import('@/features/auth/Login/Login'));
const SignUp = lazy(() => import('@/features/auth/SignUp/SignUp'));
const Guest = lazy(() => import('@/features/auth/Guest/Guest'));
const UserDashboard = lazy(() => import('@/shared/UserDashboard/UserDashboard'));
const Modal = lazy(() => import('@/shared/Modal/Modal'));

const PizzaHub = () => {
  const userState     = useSelector((state) => state.auth);
  const uiState       = useSelector((state) => state.ui);
  const pizzahubState = useSelector((state) => state.pizzaHub);
  const sizePricing   = useSelector((state) => state.navigation.sizePricing);
  const pizzaSize     = useSelector((state) => state.pizza.size);
  const dispatch      = useDispatch();

  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchMenuPricing();
  }, []);

  useEffect(() => {
    document.body.style.overflow = uiState.backdrop ? 'hidden' : 'auto';
    if (userState) setUserName(userState.firstName);
  }, [userState, uiState]);

  const price = computePriceBreakdown({ ...pizzahubState, sizePricing, size: pizzaSize }).total;

  const handleReset = useCallback(() => {
    dispatch(pizzaHubActions.resetHub());
    dispatch(pizzaActions.resetPizza());
  }, [dispatch]);

  return (
    <div className={styles.pizzahub}>
      {/* Row 1: full-width auto-scrolling preset bar */}
      <motion.div
        className={styles.presetBar}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <PresetPizzas />
      </motion.div>

      {/* Row 2, Col 1: greeting + base options */}
      <motion.div
        className={styles.leftColumn}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut', delay: 0.08 }}
      >
        <div className={styles.greeting}>
          <h1>Hey {userName || 'there'}, let's build a pizza</h1>
          <p>Your pizza, your rules — pick a base, pile on toppings, name it, done.</p>
        </div>
        <Base />
      </motion.div>

      {/* Row 2, Col 2: pizza canvas + action bar (sticky) */}
      <motion.div
        className={styles.centerColumn}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: 'easeOut', delay: 0.12 }}
      >
        <div id='pizza-preview' className={styles.pizzaDiv}>
          <PizzaDisplay />
        </div>
        <div className={styles.actionBar}>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Estimated Total</span>
            <span className={styles.priceValue}>
              <AnimatedPrice value={price} />
            </span>
          </div>
          <div className={styles.actionButtons}>
            <button type='button' title='Reset pizza to defaults' className={styles.resetBtn} onClick={handleReset}>
              Reset
            </button>
            <OrderButton />
          </div>
        </div>
      </motion.div>

      {/* Row 2, Col 3: cheese + toppings */}
      <motion.div
        className={styles.rightColumn}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut', delay: 0.16 }}
      >
        <ToppingsMenu />
      </motion.div>

      {/* Mobile-only sticky total bar */}
      <div className={styles.stickyPriceBar}>
        <span className={styles.stickyPriceLabel}>Total</span>
        <span className={styles.stickyPriceValue}>
          <AnimatedPrice value={price} />
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
