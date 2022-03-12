import Button from '../../components/UI/Buttons/Button';
import './loginPage.css';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { headerActions } from '../../store/headerSlice';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, fetchLoggedInUser } from '../Firebase/Firebase';
import { userActions } from '../../store/userSlice';

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
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      console.log(user?.uid);
      if (user && user?.uid) {
        fetchLoggedInUser(user);
      }
      if (
        auth.onAuthStateChanged((user) => {
          if (auth.currentUser === user)
            dispatch(userActions.setLoggedIn(true));
          else dispatch(userActions.setLoggedIn(false));
        })
      )
        console.log('User :' + user + ' logged in successfully');
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
        <div className='formInputTextDiv'>
          <div className='labelInputDiv'>
            <label htmlFor='email'>Email</label>
            <div className={'inputField'}>
              <input
                id='email'
                name='email'
                type='email'
                value={loginEmail}
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
        <Button
          className={'loginSubmitButton'}
          type='submit'
          onClick={loginUser}
        >
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
