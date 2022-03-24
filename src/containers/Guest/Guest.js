import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useHistory } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import { headerActions } from '../../store/headerSlice';
import { createGuest } from '../Firebase/Auth';
import './guest.css';

const Guest = (props) => {
  const headerState = useSelector((state) => state.header);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const dispatch = useDispatch();
  const history = useHistory();

  const handleSignupClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    dispatch(headerActions.toggleSignupPage());
  };

  const handleLoginClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleLoginPage());
  };

  const registerGuest = async (e) => {
    e.preventDefault();
    createGuest({
      guestFirstName,
      guestEmail,
    })
      .then((user) => {
        if (user) {
          if (headerState.showGuestPage && guestEmail && guestEmail) {
            dispatch(headerActions.toggleGuestPage());
            history.push('/');
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
    <div className={headerState.showGuestPage ? 'guestPage' : 'hideGuestPage'}>
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
              to={headerState.loginPath}
              style={{ textDecoration: 'none' }}
              onClick={handleLoginClick}
            >
              Login Instead?
            </NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Guest;
