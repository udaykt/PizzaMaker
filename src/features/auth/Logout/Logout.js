import Button from '@/shared/Button/Button';
import { logoutUser } from '@/api/authApi';

const Logout = (props) => {
  const signout = async () => {
    logoutUser().catch((e) => {
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
