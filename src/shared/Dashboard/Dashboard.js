import React from 'react';
import styles from './dashboard.module.css';

const Dashboard = (props) => {
  const emptyDashboardMessage = 'Pick something from the menu to get cooking.';
  return (
    <div className={styles.dashboard}>
      {props.children ? props.children : <p>{emptyDashboardMessage}</p>}
    </div>
  );
};

export default Dashboard;
