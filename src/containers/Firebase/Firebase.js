import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getDatabase } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { buildUserDataInStore } from '../../store/userSlice';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = firebase.initializeApp(firebaseConfig);

//auth setup
const auth = firebase.auth();
//firestore setup
const firestore = firebase.firestore();
//firestore database setup
const firebaseDatabase = getDatabase();
//firestore database collection
const usersCollection = collection(firestore, 'users');

const createUserDocument = async (user, additionalData) => {
  if (!user) return;
  const userRef = firestore.doc(`users/${user.user?.uid}`);

  const snapshot = await userRef.get();
  const userObj = {
    emailId: additionalData.registerEmail,
    firstName: additionalData.registerFirstName,
    password: additionalData.registerPassword,
    createdAt: new Date(),
  };

  if (!snapshot.exists) {
    try {
      userRef.set(userObj);
      buildUserDataInStore(userObj);
    } catch (error) {
      console.error('Error while creating user' + error);
    }
  }
};

const createGuestUserDocument = async (user, additionalData) => {
  if (!user) return;
  const userRef = firestore.doc(`guestUsers/${user.user?.uid}`);

  try {
    userRef.set({
      emailId: additionalData.guestEmail,
      firstName: additionalData.guestFirstName,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error while creating guest user' + error);
  }
};

const fetchLoggedInUser = async (user) => {
  if (!user) return;
  const userDocRef = firestore.doc(`users/${user?.uid}`);
  try {
    var userData = (await userDocRef.get()).data();
    buildUserDataInStore(userData);
  } catch (error) {
    console.error('Error while fetching user data from firestore ' + error);
  }
  return userData;
};

const fetchAllUsers = async () => {
  try {
    var usersSnapshot = await getDocs(usersCollection);
  } catch (error) {
    console.error('Error while fetching all users' + error);
  }
  return usersSnapshot.docs;
};

export {
  auth,
  firestore,
  usersCollection,
  firebaseDatabase,
  fetchAllUsers,
  fetchLoggedInUser,
  createUserDocument,
  createGuestUserDocument,
};
export default app;
