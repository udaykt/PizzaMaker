import store from '../../store';
import { userActions } from '../../store/userSlice';

export const buildUserDataInStore = (userData) => {
  const { emailId, firstName } = userData || {};
  store.dispatch(userActions.setFirstName(firstName));
  store.dispatch(userActions.setEmailId(emailId));
};
