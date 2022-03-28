import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LOGIN_PATH } from '../../components/Utils/Constants';
import { auth, fetchLoggedInUser } from '../Firebase/Firebase';
import Logout from '../Logout/Logout';
import './profile.css';

const Profile = (props) => {
  const currUser = auth.currentUser;
  const [userData, setUserData] = useState();

  useEffect(() => {
    fetchLoggedInUser().then((data) => setUserData(data));
  }, [currUser]);

  return (
    <div className='profile'>
      <table>
        <tbody>
          <tr>
            <th scope='row'>First Name :</th>
            <td>{userData?.firstName}</td>
          </tr>
          <tr>
            <th scope='row'>E-Mail Id :</th>
            <td>{userData?.emailId}</td>
          </tr>
          <tr>
            <th scope='row'>User Type :</th>
            <td>{userData?.userType}</td>
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
