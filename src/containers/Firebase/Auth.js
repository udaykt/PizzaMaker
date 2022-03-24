import store from '../../store';
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { userActions } from '../../store/userSlice';
import {
  auth,
  createGuestUserDocument,
  createUserDocument,
  fetchLoggedInUser,
} from './Firebase';

auth.onAuthStateChanged((user) => {
  if (user) {
    store.dispatch(userActions.setLoggedIn(true));
    fetchLoggedInUser(user);
    console.log(user.uid + ' user logged in:Auth.js');
  } else {
    store.dispatch(userActions.setLoggedIn(false));
    console.log(user + ' user logged out:Auth.js');
  }
});

const loginUser = async (loginDetails) => {
  const { loginEmail, loginPassword } = loginDetails;
  var user;
  if (loginEmail && loginPassword) {
    user = await signInWithEmailAndPassword(
      auth,
      loginEmail,
      loginPassword
    ).catch((e) => {
      console.error('Error while logging in user: Auth.js ' + e);
    });
  }
  return user;
};

const createGuest = async (guestDetails) => {
  const { guestFirstName, guestEmail } = guestDetails;
  var user;
  if (guestFirstName && guestEmail) {
    user = await signInAnonymously(auth).catch((e) => {
      console.error('Error while creating guest user: Auth.js ' + e);
    });
    const additionalData = {
      guestFirstName,
      guestEmail,
    };
    console.log(additionalData);
    createGuestUserDocument(user, additionalData);
  }
  return user;
};

const createUser = async (userDetails) => {
  const { registerFirstName, registerEmail, registerPassword } = userDetails;
  var user;
  if (registerEmail && registerFirstName && registerPassword) {
    user = await createUserWithEmailAndPassword(
      auth,
      registerEmail,
      registerPassword
    ).catch((e) => {
      console.error('Error while creating user: Auth.js ' + e);
    });
    const additionalData = {
      registerFirstName,
      registerEmail,
      registerPassword,
    };
    console.log(user);
    console.log(additionalData);
    createUserDocument(user, additionalData);
  }
  return user;
};

const logoutUser = async () => {
  await auth.signOut().catch((e) => {
    console.error('Error in signing out user:Auth.js ' + e);
  });
};

export { loginUser, createGuest, createUser, logoutUser };
