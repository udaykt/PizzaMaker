import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import Button from '@/shared/Button/Button';
import { GUEST_PATH, HOME_PATH, SIGNUP_PATH } from '@/utils/routes';
import { uiActions } from '@/store/uiSlice';
import { loginUser } from '@/api/authApi';
import { fetchLoggedInUser, fetchUserOrders } from '@/api/appApi';
import styles from './login.module.css';

const Login = (props) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  const validate = () => {
    const e = {};
    if (!loginEmail) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) e.email = 'Enter a valid email';
    if (!loginPassword) e.password = 'Password is required';
    else if (loginPassword.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleLoginUser = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await loginUser({ loginEmail, loginPassword });
      if (user) {
        fetchLoggedInUser();
        fetchUserOrders();
        history.push(HOME_PATH);
        dispatch(uiActions.setBackdrop(false));
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <form onSubmit={handleLoginUser} noValidate>
        <div><h1>Login</h1></div>
        <div className={styles.formInputTextDiv}>
          <div className={styles.labelInputDiv}>
            <label htmlFor='email'>Email</label>
            <div className={styles.inputField}>
              <input
                id='email'
                name='email'
                type='email'
                value={loginEmail}
                autoFocus
                onChange={(e) => { setLoginEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
              />
            </div>
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>
          <div className={styles.labelInputDiv}>
            <label htmlFor='password'>Password</label>
            <div className={styles.inputField}>
              <input
                id='password'
                name='password'
                type='password'
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
              />
            </div>
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>
        </div>
        <Button className={styles.loginSubmitButton} type='submit' disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div className={styles.formLink}>
            <NavLink to={SIGNUP_PATH} style={{ textDecoration: 'none' }}>Create an account?</NavLink>
          </div>
          /
          <div className={styles.formLink}>
            <NavLink to={GUEST_PATH} style={{ textDecoration: 'none' }}>Continue as Guest?</NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default withRouter(Login);
