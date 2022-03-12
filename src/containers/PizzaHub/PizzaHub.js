import Pizza from '../Pizza/Pizza';
import styles from './pizzahub.module.css';
import ToppingsMenu from '../ToppingsMenu/ToppingsMenu';
import OrderButton from '../../components/UI/OrderButton/OrderButton';
import Base from '../Base/Base';
import Backdrop from '../../components/UI/Backdrop/Backdrop';
import LoginPage from '../LoginPage/LoginPage';
import Menu from '../Menu/Menu';
import SignUp from '../SignUp/SignUp';
import Guest from '../Guest/Guest';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

const PizzaHub = (props) => {
  const headerState = useSelector((state) => state.header);
  const userState = useSelector((state) => state.user);
  console.log(userState);

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
          <h1>Welcome {userState.firstName}!,</h1>
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
