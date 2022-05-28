import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getDatabase } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { USERTYPE } from '../../components/Utils/Utility';
import store from '../../store';
import { orderActions } from '../../store/orderSlice';
import { buildUserDataInStore } from '../User/User';

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
//firestore users collection
const usersCollection = collection(firestore, 'users');

const createUserDocument = async (user, additionalData) => {
  if (!user) return;
  const userRef = firestore.doc(`users/${user.user?.uid}`);
  const snapshot = await userRef.get();
  const userObj = {
    uid: user.user.uid,
    emailId: additionalData.registerEmail,
    firstName: additionalData.registerFirstName,
    password: additionalData.registerPassword,
    userType: USERTYPE.STANDARD,
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
      uid: user.user.uid,
      emailId: additionalData.guestEmail,
      firstName: additionalData.guestFirstName,
      userType: USERTYPE.GUEST,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error while creating guest user' + error);
  }
};

const fetchLoggedInUser = async () => {
  const user = auth.currentUser;
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

const createOrder = async (user, orderState) => {
  if (user && orderState) {
    try {
      const uid = user?.uid;
      const order = {
        uid,
        ingredients: orderState,
        createdAt: new Date(),
      };
      if (uid) {
        const orderDocRef = await firestore
          .collection('users')
          .doc(uid.toString())
          .collection('orders')
          .add(order);
        var orderData = (await orderDocRef.get()).data();
        var finalOrder = { oid: orderDocRef.id, ...orderData };
        store.dispatch(orderActions.setCurrentOrder(finalOrder));
      }
    } catch (e) {
      console.error('Error while creating user order' + e);
    }
  }
  return finalOrder;
};

const fetchUserOrders = async () => {
  const user = auth.currentUser;
  const uid = user?.uid;
  if (user && uid) {
    try {
      const colRef = firestore
        .collection('users')
        .doc(uid.toString())
        .collection('orders');
      const userOrdersSnapshot = await getDocs(colRef);
      if (userOrdersSnapshot) {
        var orders = [];
        userOrdersSnapshot.forEach((i) => {
          orders.push({ oid: i.id, ...i.data() });
        });
        store.dispatch(orderActions.setUserOrders(orders));
      }
    } catch (e) {
      console.error('Error while fetching user orders' + e);
    }
  }
  return orders;
};

export {
  auth,
  firestore,
  usersCollection,
  firebaseDatabase,
  createOrder,
  fetchAllUsers,
  fetchUserOrders,
  fetchLoggedInUser,
  createUserDocument,
  createGuestUserDocument,
};
export default app;
