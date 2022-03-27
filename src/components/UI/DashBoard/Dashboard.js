import React from 'react';
import './dashboard.css';

const Dashboard = (props) => {
  const emptyDashboardMessage = 'Choose from dashboard menu to see here.';
  return (
    <div className='dashboard'>
      {props.children ? props.children : <p>{emptyDashboardMessage}</p>}
    </div>
  );
};

export default Dashboard;
