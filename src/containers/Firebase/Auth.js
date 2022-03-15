import store from '../../store';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { userActions } from '../../store/userSlice';
import { auth, fetchLoggedInUser } from './Firebase';

auth.onAuthStateChanged((user) => {
  if (user) {
    store.dispatch(userActions.setLoggedIn(true));
    fetchLoggedInUser(user);
    console.log(user.uid + 'user logged in:Auth.js');
  } else {
    store.dispatch(userActions.setLoggedIn(false));
    console.log(user + 'user logged in:Auth.js');
  }
});

const loginUser = async (loginDetails) => {
  const { loginEmail, loginPassword } = loginDetails;
  await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    .then((user) => {
      console.log('User :' + user?.email + ' logged in successfully');
    })
    .catch((error) => {
      console.error('Error while Logging in user ' + error.message);
    });
};

export { loginUser };
