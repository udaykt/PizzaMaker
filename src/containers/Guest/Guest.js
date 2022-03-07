import './guest.css';
import Button from '../../components/UI/Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { headerActions } from '../../store/headerSlice';
import { signInAnonymously } from 'firebase/auth';
import { auth, createGuestUserDocument } from '../Firebase/Firebase';

const Guest = (props) => {
  const headerState = useSelector((state) => state.header);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const dispatch = useDispatch();

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

  const createGuest = async (e) => {
    e.preventDefault();
    try {
      const user = await signInAnonymously(auth);
      const additionalData = {
        guestFirstName,
        guestEmail,
      };
      console.log(additionalData);
      createGuestUserDocument(user, additionalData);
    } catch (error) {
      console.log('Error while Logging in user ' + error.message);
    }
  };

  const submitHandler = (event) => {
    event.preventDefault();
    const { firstName, email } = props;
  };

  return (
    <div className={headerState.showGuestPage ? 'guestPage' : 'hideGuestPage'}>
      <form onSubmit={submitHandler}>
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
        <Button
          className={'loginSubmitButton'}
          type='submit'
          onClick={createGuest}
        >
          Continue
        </Button>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div className='formLink'>
            <NavLink to={headerState.signupPath} onClick={handleSignupClick}>
              Create an account?
            </NavLink>
          </div>
          /
          <div className='formLink'>
            <NavLink to={headerState.loginPath} onClick={handleLoginClick}>
              Login Instead?
            </NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Guest;
