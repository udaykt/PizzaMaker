import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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

export const auth = firebase.auth();
export const firestore = firebase.firestore();

export const createUserDocument = async (user, additionalData) => {
  if (!user) return;
  const userRef = firestore.doc(`users/${user.user.uid}`);

  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    try {
      userRef.set({
        emailId: additionalData.registerEmail,
        firstName: additionalData.registerFirstName,
        password: additionalData.registerPassword,
        createdAt: new Date(),
      });
    } catch (error) {
      console.log('Error while creating user' + error);
    }
  }
};

export const createGuestUserDocument = async (user, additionalData) => {
  if (!user) return;
  const userRef = firestore.doc(`guestUsers/${user.user.uid}`);

  const snapshot = await userRef.get();
  console.log(snapshot.exists);
  if (!snapshot.exists) {
    try {
      userRef.set({
        emailId: additionalData.guestEmail,
        firstName: additionalData.guestFirstName,
        createdAt: new Date(),
      });
    } catch (error) {
      console.log('Error while creating guest user' + error);
    }
  }
};

export default app;
