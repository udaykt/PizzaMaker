import Button from '@/shared/Button/Button';
import { logoutUser } from '@/api/authApi';
import { buildUserDataInStore } from '@/features/auth/User/User';

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
