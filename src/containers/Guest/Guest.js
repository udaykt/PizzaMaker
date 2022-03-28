import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import {
  HOME_PATH,
  LOGIN_PATH,
  SIGNUP_PATH,
} from '../../components/Utils/Constants';
import { pizzahubActions } from '../../store/pizzahubSlice';
import { createGuest } from '../Firebase/Auth';
import './guest.css';

const Guest = (props) => {
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const history = useHistory();
  const dispatch = useDispatch();

  const registerGuest = async (e) => {
    e.preventDefault();
    createGuest({
      guestFirstName,
      guestEmail,
    })
      .then((user) => {
        if (user) {
          if (guestEmail && guestEmail) {
            history.push(HOME_PATH);
            dispatch(pizzahubActions.setBackdrop(false));
          }
        } else {
          console.error('Guest SignUp unsuccessfull ' + e);
        }
      })
      .catch((error) => {
        console.log('Error while Logging in guest user ' + error.message);
      });
  };

  return (
    <div className={true ? 'guestPage' : 'hideGuestPage'}>
      <form onSubmit={registerGuest}>
        <div>
          <h1>Guest</h1>
        </div>
        <div className='formInputTextDiv'>
          <div className='labelInputDiv'>
            <label htmlFor='firstName'>Name</label>
            <div className={'inputField'}>
              <input
                id='name'
                name='firstName'
                type='text'
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
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
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <Button className={'loginSubmitButton'} type='submit'>
          Continue
        </Button>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className='formLink'>
            <NavLink to={SIGNUP_PATH} style={{ textDecoration: 'none' }}>
              Create an account?
            </NavLink>
          </div>
          /
          <div className='formLink'>
            <NavLink to={LOGIN_PATH} style={{ textDecoration: 'none' }}>
              Login Instead?
            </NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default withRouter(Guest);
