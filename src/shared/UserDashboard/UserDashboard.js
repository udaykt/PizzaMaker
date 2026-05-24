import React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminPanel from '@/features/admin/AdminPanel/AdminPanel';
import About from '@/pages/About/About';
import Checkout from '@/features/orders/Checkout/Checkout';
import Contact from '@/pages/Contact/Contact';
import Orders from '@/features/orders/Orders/Orders';
import Profile from '@/features/auth/Profile/Profile';
import {
  ABOUT_PATH,
  ADMIN_PATH,
  CHECKOUT_PATH,
  CONTACT_PATH,
  HOME_PATH,
  ORDERS_PATH,
  PROFILE_PATH,
} from '@/utils/routes';
import Dashboard from '@/shared/Dashboard/Dashboard';
import DashboardMenu from '@/shared/DashboardMenu/DashboardMenu';
import styles from './userDashboard.module.css';

const UserDashboard = (props) => {
  const userType = useSelector((state) => state.auth.userType);
  const isAdmin = userType === 'ADMIN';

  return (
    <div className={styles.userDashboard}>
      <DashboardMenu />
      <Dashboard>
        <Switch>
          <Redirect exact from={HOME_PATH} to={HOME_PATH} />
          <Route path={PROFILE_PATH} component={Profile} />
          <Route path={ORDERS_PATH} component={Orders} />
          <Route path={CHECKOUT_PATH} component={Checkout} />
          <Route path={CONTACT_PATH} component={Contact} />
          <Route path={ABOUT_PATH} component={About} />
          <Route
            path={ADMIN_PATH}
            render={() => (isAdmin ? <AdminPanel /> : <Redirect to={ORDERS_PATH} />)}
          />
        </Switch>
      </Dashboard>
    </div>
  );
};

export default withRouter(UserDashboard);
