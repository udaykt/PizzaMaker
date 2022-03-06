import Button from '../../components/UI/Buttons/Button';
import './loginPage.css';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { headerActions } from '../../store/headerSlice';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/Firebase';

const LoginPage = (props) => {
  const headerState = useSelector((state) => state.header);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const dispatch = useDispatch();

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

  const loginUser = async (e) => {
    e.preventDefault();
    try {
      const user = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
    } catch (error) {
      console.log('Error while Logging in user ' + error.message);
    }
  };

  const submitHandler = (event) => {
    event.preventDefault();
    const { email, password } = props;
  };

  return (
    <div className={headerState.showLoginPage ? 'loginPage' : 'hideLoginPage'}>
      <form onSubmit={submitHandler}>
        <div>
          <h1>Login</h1>
        </div>
        <div className='divGroup'>
          <label htmlFor='email'> Email</label>
          <input
            className={'inputField'}
            id='email'
            name='email'
            type='email'
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
        </div>
        <div className='divGroup'>
          <label htmlFor='password'>Password</label>
          <input
            className={'inputField'}
            id='password'
            name='password'
            type='password'
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
        </div>
        <Button
          className={'loginSubmitButton'}
          type='submit'
          onClick={loginUser}
        >
          Login
        </Button>
      </form>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div
          style={{
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          <NavLink to={headerState.signupPath} onClick={handleSignupClick}>
            Create an account?
          </NavLink>
        </div>
        /
        <div
          style={{
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          <NavLink to={headerState.guestPath} onClick={handleGuestClick}>
            Continue as Guest?
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
