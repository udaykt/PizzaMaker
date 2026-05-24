import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import store from './store/index';
import { authActions } from './store/authSlice';
import { buildUserDataInStore } from './utils/userState';

// Rehydrate auth from localStorage before the React tree renders.
// Require both a stored user record AND a token so a stale user entry
// without a valid credential cannot produce a loggedIn=true state.
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');
if (storedUser && storedToken) {
  try {
    const userData = JSON.parse(storedUser);
    buildUserDataInStore(userData);
    store.dispatch(authActions.setLoggedIn(true));
  } catch (_) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

const root = createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Provider store={store}>
      <App />
    </Provider>
  </Router>
);
