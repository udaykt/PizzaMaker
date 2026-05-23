import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import Button from '../../components/UI/Buttons/Button';
import { GUEST_PATH, HOME_PATH, LOGIN_PATH } from '../../components/Utils/Constants';
import { uiActions } from '../../store/uiSlice';
import { createUser } from '../Firebase/Auth';
import './signUp.css';

const SignUp = (props) => {
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  const validate = () => {
    const e = {};
    if (!registerFirstName.trim()) e.firstName = 'Name is required';
    if (!registerEmail) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) e.email = 'Enter a valid email';
    if (!registerPassword) e.password = 'Password is required';
    else if (registerPassword.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const registerUser = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await createUser({ registerFirstName, registerEmail, registerPassword });
      if (user) {
        history.push(HOME_PATH);
        dispatch(uiActions.setBackdrop(false));
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => setErrors((p) => ({ ...p, [field]: '' }));

  return (
    <div className='signUp'>
      <form onSubmit={registerUser} noValidate>
        <div><h1>Sign Up</h1></div>
        <div className='formInputTextDiv'>
          <div className='labelInputDiv'>
            <label htmlFor='firstName'>Name</label>
            <div className='inputField'>
              <input
                id='name'
                name='firstName'
                type='text'
                value={registerFirstName}
                onChange={(e) => { setRegisterFirstName(e.target.value); clearError('firstName'); }}
                autoFocus
              />
            </div>
            {errors.firstName && <span className='fieldError'>{errors.firstName}</span>}
          </div>
          <div className='labelInputDiv'>
            <label htmlFor='email'>Email</label>
            <div className='inputField'>
              <input
                id='email'
                name='email'
                type='email'
                value={registerEmail}
                onChange={(e) => { setRegisterEmail(e.target.value); clearError('email'); }}
              />
            </div>
            {errors.email && <span className='fieldError'>{errors.email}</span>}
          </div>
          <div className='labelInputDiv'>
            <label htmlFor='password'>Password</label>
            <div className='inputField'>
              <input
                id='password'
                name='password'
                type='password'
                value={registerPassword}
                onChange={(e) => { setRegisterPassword(e.target.value); clearError('password'); }}
              />
            </div>
            {errors.password && <span className='fieldError'>{errors.password}</span>}
          </div>
        </div>
        <Button className='signUpSubmitButton' type='submit' disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className='formLink'>
            <NavLink to={LOGIN_PATH} style={{ textDecoration: 'none' }}>Login Instead?</NavLink>
          </div>
          /
          <div className='formLink'>
            <NavLink to={GUEST_PATH} style={{ textDecoration: 'none' }}>Continue as Guest?</NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default withRouter(SignUp);
