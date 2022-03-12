import './signUp.css';
import Button from '../../components/UI/Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { headerActions } from '../../store/headerSlice';
import { NavLink } from 'react-router-dom';
import { auth } from '../Firebase/Firebase';
import { createUserDocument } from '../Firebase/Firebase';
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

  const registerUser = async (e) => {
    e.preventDefault();
    try {
      const user = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );
      const additionalData = {
        registerFirstName,
        registerEmail,
        registerPassword,
      };
      console.log(user);
      console.log(additionalData);
      createUserDocument(user, additionalData);
    } catch (error) {
      console.log('Error while Registering user ' + error.message);
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
        <Button
          className={'signUpSubmitButton'}
          type='submit'
          onClick={registerUser}
        >
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
