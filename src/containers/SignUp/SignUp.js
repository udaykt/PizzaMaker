import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useHistory } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import { headerActions } from '../../store/headerSlice';
import { createUser } from '../Firebase/Auth';
import './signUp.css';

const SignUp = (props) => {
  const headerState = useSelector((state) => state.header);
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const dispatch = useDispatch();
  const history = useHistory();

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

  const registerUser = async (e) => {
    e.preventDefault();
    createUser({
      registerFirstName,
      registerEmail,
      registerPassword,
    })
      .then((user) => {
        if (user) {
          if (
            headerState.showSignUpPage &&
            registerEmail &&
            registerFirstName &&
            registerPassword
          ) {
            dispatch(headerActions.toggleSignupPage());
            history.push('/');
          }
        } else {
          console.error('SignUp unsuccessfull ' + e);
        }
      })
      .catch((error) => {
        console.log('Error while Registering user ' + error.message);
      });
  };

  return (
    <div className={headerState.showSignUpPage ? 'signUp' : 'hideSignUp'}>
      <form onSubmit={registerUser}>
        <div>
          <h1>Sign Up</h1>
        </div>
        <div className='formInputTextDiv'>
          <div className='labelInputDiv'>
            <label htmlFor='firstName'>Name</label>
            <div className={'inputField'}>
              <input
                id='name'
                name='firstName'
                type='text'
                value={registerFirstName}
                onChange={(e) => setRegisterFirstName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='labelInputDiv'>
            <label htmlFor='email'> Email</label>
            <div className={'inputField'}>
              <input
                id='email'
                name='email'
                type='email'
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
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
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <Button className={'signUpSubmitButton'} type='submit'>
          Signup
        </Button>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className='formLink'>
            <NavLink
              to={headerState.loginPath}
              style={{ textDecoration: 'none' }}
              onClick={handleLoginClick}
            >
              Login Instead?
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

export default SignUp;
