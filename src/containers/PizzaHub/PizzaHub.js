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
import Base from '../Base/Base';
import Guest from '../Guest/Guest';
import LoginPage from '../LoginPage/LoginPage';
import Menu from '../Menu/Menu';
import Pizza from '../Pizza/Pizza';
import SignUp from '../SignUp/SignUp';
import ToppingsMenu from '../ToppingsMenu/ToppingsMenu';
import styles from './pizzahub.module.css';

const PizzaHub = (props) => {
  const userState = useSelector((state) => state.user);
  const pizzahubState = useSelector((state) => state.pizzahub);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    document.body.style.overflow = pizzahubState.backdrop ? 'hidden' : 'auto';
    if (userState) setUserName(userState.firstName);
  }, [userState, pizzahubState]);

  const state = {
    parts: {
      1: 'one',
      2: 'two',
      3: 'three',
      4: 'four',
      5: 'five',
      6: 'six',
    },
  };
  return (
    <div className={styles.pizzahub}>
      <div className={styles.description}>
        <strong>
          <h1>Welcome {`${userName ? userName : `User`}`}!,</h1>
        </strong>
        <p>Make your own pizza. Customize and Order.</p>
      </div>
      <div className={styles.pizza}>
        <Pizza {...state} />
      </div>
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
