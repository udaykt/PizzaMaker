import React from 'react';
import styles from './dashboard.module.css';

const Dashboard = (props) => {
  const emptyDashboardMessage = 'Choose from dashboard menu to see here.';
  return (
    <div className={styles.dashboard}>
      {props.children ? props.children : <p>{emptyDashboardMessage}</p>}
    </div>
  );
};

export default Dashboard;
