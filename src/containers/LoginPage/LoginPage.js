import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import {
  GUEST_PATH,
  HOME_PATH,
  SIGNUP_PATH,
} from '../../components/Utils/Constants';
import { orderActions } from '../../store/orderSlice';
import { uiActions } from '../../store/uiSlice';
import { loginUser } from '../Firebase/Auth';
import { fetchLoggedInUser, fetchUserOrders } from '../Firebase/Firebase';
import './loginPage.css';

const LoginPage = (props) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const history = useHistory();
  const dispatch = useDispatch();

  const handleLoginUser = (e) => {
    e.preventDefault();
    loginUser({ loginEmail, loginPassword })
      .then((user) => {
        if (user) {
          fetchLoggedInUser();
          fetchUserOrders();
          if (loginEmail && loginPassword) {
            history.push(HOME_PATH);
            dispatch(uiActions.setBackdrop(false));
          }
        } else {
          console.error('Login unsuccessfull ' + e);
        }
      })
      .catch((e) => {
        console.error('Error while logging in user ' + e);
      });
  };

  return (
    <div className={true ? 'loginPage' : 'hideLoginPage'}>
      <form onSubmit={handleLoginUser}>
        <div>
          <h1>Login</h1>
        </div>
        <div className='formInputTextDiv'>
          <div className='labelInputDiv'>
            <label htmlFor='email'>Email</label>
            <div className={'inputField'}>
              <input
                id='email'
                name='email'
                type='email'
                value={loginEmail}
                autoFocus
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='labelInputDiv'>
            <label htmlFor='password'>Password</label>
            <div className={'inputField'}>
              <input
                id='password'
                name='password'
                type='password'
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <Button className={'loginSubmitButton'} type='submit'>
          Login
        </Button>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div className='formLink'>
            <NavLink to={SIGNUP_PATH} style={{ textDecoration: 'none' }}>
              Create an account?
            </NavLink>
          </div>
          /
          <div className='formLink'>
            <NavLink to={GUEST_PATH} style={{ textDecoration: 'none' }}>
              Continue as Guest?
            </NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default withRouter(LoginPage);
