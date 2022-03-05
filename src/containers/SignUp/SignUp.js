import './signUp.css';
import Button from '../../components/UI/Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { headerActions } from '../../store/headerSlice';
import { NavLink } from 'react-router-dom';
import { auth } from '../Firebase/Firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const SignUp = (props) => {
  const headerState = useSelector((state) => state.header);
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const dispatch = useDispatch();

  const handleLoginClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleLoginPage());
  };

  const handleGuestClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleGuestPage());
  };

  const registerUser = async () => {
    try {
      const user = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );
      console.log(user);
    } catch (error) {
      console.log('Error while Registering user' + error.message);
    }
  };

  const submitHandler = (event) => {
    event.preventDefault();
    const { email, password } = props;
  };

  return (
    <div className={headerState.showSignUpPage ? 'signUp' : 'hideSignUp'}>
      <form onSubmit={submitHandler}>
        <div>
          <h1>Sign Up</h1>
        </div>
        <div className='divGroup'>
          <label htmlFor='firstName'>Name</label>
          <input
            className={'inputField'}
            id='name'
            name='firstName'
            type='text'
            value={registerFirstName}
            onChange={(e) => setRegisterFirstName(e.target.value)}
            required
          />
          <label htmlFor='email'> Email</label>
          <input
            className={'inputField'}
            id='email'
            name='email'
            type='email'
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
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
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            required
          />
        </div>
        <Button
          className={'loginSubmitButton'}
          type='submit'
          onClick={registerUser}
        >
          Signup
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
          <NavLink to={headerState.loginPath} onClick={handleLoginClick}>
            Existing user?
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

export default SignUp;
