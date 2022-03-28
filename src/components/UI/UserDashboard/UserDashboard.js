import React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import About from '../../../containers/About/About';
import Checkout from '../../../containers/Checkout/Checkout';
import Contact from '../../../containers/Contact/Contact';
import Orders from '../../../containers/Orders/Orders';
import Profile from '../../../containers/Profile/Profile';
import {
  ABOUT_PATH,
  CHECKOUT_PATH,
  CONTACT_PATH,
  HOME_PATH,
  ORDERS_PATH,
  PROFILE_PATH
} from '../../Utils/Constants';
import Dashboard from '../DashBoard/Dashboard';
import DashboardMenu from '../DashboardMenu/DashboardMenu';
import './userDashboard.css';

const UserDashboard = (props) => {
  return (
    <div className='userDashboard'>
      <DashboardMenu />
      <Dashboard>
        <Switch>
          <Redirect exact from={HOME_PATH} to={HOME_PATH} />
          <Route path={PROFILE_PATH} component={Profile} />
          <Route path={ORDERS_PATH} component={Orders} />
          <Route path={CHECKOUT_PATH} component={Checkout} />
          <Route path={CONTACT_PATH} component={Contact} />
          <Route path={ABOUT_PATH} component={About} />
        </Switch>
      </Dashboard>
    </div>
  );
};

export default withRouter(UserDashboard);
