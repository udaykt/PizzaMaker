import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { LOGIN_PATH } from '../../components/Utils/Constants';
import Logout from '../Logout/Logout';
import './profile.css';

const Profile = (props) => {
  const userState = useSelector((state) => state.user);

  return (
    <div className='profile'>
      <table>
        <tbody>
          <tr>
            <th scope='row'>First Name :</th>
            <td>{userState.firstName}</td>
          </tr>
          <tr>
            <th scope='row'>E-Mail Id :</th>
            <td>{userState.emailId}</td>
          </tr>
          <tr>
            <th scope='row'>User Type :</th>
            <td>{userState.userType}</td>
          </tr>
        </tbody>
      </table>
      <NavLink to={LOGIN_PATH} style={{ textDecoration: 'none' }}>
        <Logout className={'profileMenuButton'} />
      </NavLink>
    </div>
  );
};

export default Profile;
