import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import {
  GUEST_PATH,
  HOME_PATH,
  LOGIN_PATH,
} from '../../components/Utils/Constants';
import { pizzahubActions } from '../../store/pizzahubSlice';
import { createUser } from '../Firebase/Auth';
import './signUp.css';

const SignUp = (props) => {
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const history = useHistory();
  const dispatch = useDispatch();

  const registerUser = async (e) => {
    e.preventDefault();
    createUser({
      registerFirstName,
      registerEmail,
      registerPassword,
    })
      .then((user) => {
        if (user) {
          if (registerEmail && registerFirstName && registerPassword) {
            history.push(HOME_PATH);
            dispatch(pizzahubActions.setBackdrop(false));
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
    <div className={true ? 'signUp' : 'hideSignUp'}>
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
                autoFocus
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
            <NavLink to={LOGIN_PATH} style={{ textDecoration: 'none' }}>
              Login Instead?
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

export default withRouter(SignUp);
