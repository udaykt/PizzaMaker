import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';
import store from './store/index';

const root = createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Provider store={store}>
      <App />
    </Provider>
  </Router>
);

reportWebVitals();
