import Button from '../../components/UI/Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import './signUp.css';
import { headerActions } from '../../store/headerSlice';
import { NavLink } from 'react-router-dom';

const SignUp = (props) => {
  const headerState = useSelector((state) => state.header);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLoginClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleLoginPage());
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
          <label htmlFor='email'> Email</label>
          <input
            className={'inputField'}
            id='email'
            name='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button className={'loginSubmitButton'} type='submit'>
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
          <a href='/guest'>Continue as Guest?</a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
