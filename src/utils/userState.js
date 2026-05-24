import store from '@/store';
import { authActions } from '@/store/authSlice';

export const buildUserDataInStore = (userData) => {
  const { emailId, firstName, userType, uid } = userData || {};
  store.dispatch(authActions.setUid(uid));
  store.dispatch(authActions.setFirstName(firstName));
  store.dispatch(authActions.setEmailId(emailId));
  store.dispatch(authActions.setUserType(userType));
};
