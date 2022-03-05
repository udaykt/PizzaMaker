import './guest.css';
import Button from '../../components/UI/Buttons/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { headerActions } from '../../store/headerSlice';

const Guest = (props) => {
  const headerState = useSelector((state) => state.header);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
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
        <div className='divGroup'>
          <label htmlFor='firstName'>Name</label>
          <input
            className={'inputField'}
            id='name'
            name='firstName'
            type='text'
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
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
        <Button className={'loginSubmitButton'} type='submit'>
          Continue
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
          <NavLink to={headerState.loginPath} onClick={handleLoginClick}>
            Login Instead?
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Guest;
