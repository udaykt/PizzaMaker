import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import Backdrop from '../../components/UI/Backdrop/Backdrop';
import OrderButton from '../../components/UI/OrderButton/OrderButton';
import { ProfileMenu } from '../../components/UI/ProfileMenu/ProfileMenu';
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
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (userState) setUserName(userState.firstName);
  }, [userState]);

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
        <Redirect exact from='/' to='/' />
        <Route path='/menu' component={Menu} />
        <Route path='/login' component={LoginPage} />
        <Route path='/signup' component={SignUp} />
        <Route path='/guest' component={Guest} />
      </Switch>
    </div>
  );
};

export default PizzaHub;
