import api from '../../api/axiosClient';
import store from '../../store';
import { userActions } from '../../store/userSlice';
import { buildUserDataInStore } from '../User/User';

// On page load — restore session from localStorage if token exists
const storedUser = localStorage.getItem('user');
if (storedUser) {
  try {
    const userData = JSON.parse(storedUser);
    buildUserDataInStore(userData);
    store.dispatch(userActions.setLoggedIn(true));
  } catch (_) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

const loginUser = async (loginDetails) => {
  const { loginEmail, loginPassword } = loginDetails;
  const { data } = await api.post('/api/v1/auth/login', {
    emailId: loginEmail,
    password: loginPassword,
  });
  localStorage.setItem('token', data.token);
  const userData = { uid: data.uid, firstName: data.firstName, emailId: loginEmail, userType: data.userType };
  localStorage.setItem('user', JSON.stringify(userData));
  buildUserDataInStore(userData);
  store.dispatch(userActions.setLoggedIn(true));
  return data;
};

const createUser = async (userDetails) => {
  const { registerFirstName, registerEmail, registerPassword } = userDetails;
  const { data } = await api.post('/api/v1/auth/register', {
    firstName: registerFirstName,
    emailId: registerEmail,
    password: registerPassword,
  });
  localStorage.setItem('token', data.token);
  const userData = { uid: data.uid, firstName: data.firstName, emailId: registerEmail, userType: data.userType };
  localStorage.setItem('user', JSON.stringify(userData));
  buildUserDataInStore(userData);
  store.dispatch(userActions.setLoggedIn(true));
  return data;
};

const createGuest = async (guestDetails) => {
  const { guestFirstName, guestEmail } = guestDetails;
  const { data } = await api.post('/api/v1/auth/guest', {
    firstName: guestFirstName,
    emailId: guestEmail,
  });
  localStorage.setItem('token', data.token);
  const userData = { uid: data.uid, firstName: data.firstName, emailId: guestEmail, userType: data.userType };
  localStorage.setItem('user', JSON.stringify(userData));
  buildUserDataInStore(userData);
  store.dispatch(userActions.setLoggedIn(true));
  return data;
};

const logoutUser = async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  store.dispatch(userActions.setLoggedIn(false));
  buildUserDataInStore({ uid: '', firstName: '', emailId: '', userType: '' });
};

export { loginUser, createGuest, createUser, logoutUser };
