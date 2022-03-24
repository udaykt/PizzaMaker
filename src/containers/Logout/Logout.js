import Button from '../../components/UI/Buttons/Button';
import { logoutUser } from '../Firebase/Auth';
import { buildUserDataInStore } from '../User/User';

const Logout = (props) => {
  const signout = async () => {
    logoutUser()
      .then((user) => {
        buildUserDataInStore({ loggedIn: false, firstName: '', emailId: '' });
      })
      .catch((e) => {
        console.error('Error in signing out user' + e);
      });
  };
  return (
    <Button className={props.className} onClick={signout}>
      Logout
    </Button>
  );
};

export default Logout;
