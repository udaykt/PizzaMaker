import store from '../../store';
import { userActions } from '../../store/userSlice';

export const buildUserDataInStore = (userData) => {
  const { emailId, firstName, userType, uid } = userData || {};
  store.dispatch(userActions.setUid(uid));
  store.dispatch(userActions.setFirstName(firstName));
  store.dispatch(userActions.setEmailId(emailId));
  store.dispatch(userActions.setUserType(userType));
};
