import { auth } from '../Firebase/Firebase';
import Button from '../../components/UI/Buttons/Button';
import { buildUserDataInStore } from '../../store/userSlice';

const Logout = (props) => {
  const signout = async () => {
    await auth
      .signOut()
      .then(() => {
        buildUserDataInStore({ loggedIn: false, firstName: '', emailId: '' });
      })
      .catch((e) => {
        console.error('error in signing out user');
      });
  };
  return <Button onClick={signout}>Logout</Button>;
};

export default Logout;
