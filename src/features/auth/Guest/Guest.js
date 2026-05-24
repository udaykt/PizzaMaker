import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import Button from '@/shared/Button/Button';
import {
  HOME_PATH,
  LOGIN_PATH,
  SIGNUP_PATH,
} from '@/utils/routes';
import { uiActions } from '@/store/uiSlice';
import { createGuest } from '@/api/authApi';
import styles from './guest.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Guest = (props) => {
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const history = useHistory();
  const dispatch = useDispatch();

  const registerGuest = async (e) => {
    e.preventDefault();
    const trimmedName = guestFirstName.trim();
    const trimmedEmail = guestEmail.trim();
    if (!trimmedName) {
      toast.error('Name is required.');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    createGuest({
      guestFirstName: trimmedName,
      guestEmail: trimmedEmail,
    })
      .then((user) => {
        if (user) {
          history.push(HOME_PATH);
          dispatch(uiActions.setBackdrop(false));
        }
      })
      .catch((error) => {
        const msg = error.response?.data?.error || 'Guest sign-in failed. Try again.';
        toast.error(msg);
      });
  };

  return (
    <div className={styles.guestPage}>
      <form onSubmit={registerGuest}>
        <div>
          <h1>Guest</h1>
        </div>
        <div className={styles.formInputTextDiv}>
          <div className={styles.labelInputDiv}>
            <label htmlFor='firstName'>Name</label>
            <div className={styles.inputField}>
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
          <div className={styles.labelInputDiv}>
            <label htmlFor='email'> Email</label>
            <div className={styles.inputField}>
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
        <Button className={styles.guestSubmitButton} type='submit'>
          Continue
        </Button>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className={styles.formLink}>
            <NavLink to={SIGNUP_PATH} style={{ textDecoration: 'none' }}>
              Create an account?
            </NavLink>
          </div>
          /
          <div className={styles.formLink}>
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
