import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useHistory } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import { headerActions } from '../../store/headerSlice';
import { loginUser } from '../Firebase/Auth';
import './loginPage.css';

const LoginPage = (props) => {
  const headerState = useSelector((state) => state.header);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const dispatch = useDispatch();
  const history = useHistory();

  const handleSignupClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    dispatch(headerActions.toggleSignupPage());
  };

  const handleGuestClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleGuestPage());
  };

  const handleLoginUser = (e) => {
    e.preventDefault();
    loginUser({ loginEmail, loginPassword })
      .then((user) => {
        if (user) {
          console.log('User :' + user?.email + ' logged in successfully');
          if (headerState.showLoginPage && loginEmail && loginPassword) {
            dispatch(headerActions.toggleLoginPage());
            history.push('/');
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
    <div className={headerState.showLoginPage ? 'loginPage' : 'hideLoginPage'}>
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
            <NavLink
              to={headerState.signupPath}
              style={{ textDecoration: 'none' }}
              onClick={handleSignupClick}
            >
              Create an account?
            </NavLink>
          </div>
          /
          <div className='formLink'>
            <NavLink
              to={headerState.guestPath}
              style={{ textDecoration: 'none' }}
              onClick={handleGuestClick}
            >
              Continue as Guest?
            </NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
