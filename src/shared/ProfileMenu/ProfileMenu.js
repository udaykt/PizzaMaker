import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useHistory, withRouter } from 'react-router-dom';
import { LogOut, Receipt, Settings, ShoppingCart, User } from 'lucide-react';
import { logoutUser } from '@/api/authApi';
import { navigationActions } from '@/store/navigationSlice';
import { ADMIN_PATH, CHECKOUT_PATH, LOGIN_PATH, ORDERS_PATH, PROFILE_PATH } from '@/utils/routes';
import styles from './profileMenu.module.css';

// The account dropdown behind the header avatar. Previously just "My Profile" +
// "Logout"; now a proper account menu — identity header, quick links, admin (only
// for admins), and sign-out — which is the pattern every product app converges on
// for the avatar corner.
const ProfileMenu = () => {
  const { firstName, emailId, userType } = useSelector((state) => state.auth);
  const isOpen = useSelector((state) => state.navigation.showProfileMenu);
  const dispatch = useDispatch();
  const history = useHistory();

  const isAdmin = userType === 'ADMIN';
  const isGuest = userType === 'GUEST';
  const displayName = firstName || (isGuest ? 'Guest' : 'Pizza Lover');
  // Initials for the avatar; fall back to a person glyph when there's no name.
  const initials = firstName ? firstName.trim().charAt(0).toUpperCase() : null;

  const close = () => {
    if (isOpen) dispatch(navigationActions.toggleProfileMenu(false));
  };

  const handleLogout = () => {
    close();
    logoutUser();
    history.push(LOGIN_PATH);
  };

  const links = [
    { label: 'My Profile', to: PROFILE_PATH, icon: User },
    { label: 'My Orders', to: ORDERS_PATH, icon: Receipt },
    { label: 'Checkout', to: CHECKOUT_PATH, icon: ShoppingCart },
    ...(isAdmin ? [{ label: 'Admin', to: ADMIN_PATH, icon: Settings, admin: true }] : []),
  ];

  return (
    <div className={isOpen ? styles.wrap : styles.hidden}>
      <div className={styles.card}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            {initials || <User size={20} />}
          </div>
          <div className={styles.identityText}>
            <span className={styles.name}>{displayName}</span>
            {emailId ? <span className={styles.email}>{emailId}</span>
              : <span className={styles.email}>Ordering as a guest</span>}
          </div>
        </div>

        <div className={styles.divider} />

        <nav className={styles.links}>
          {links.map(({ label, to, icon: Icon, admin }) => (
            <NavLink
              key={label}
              to={to}
              className={admin ? `${styles.link} ${styles.adminLink}` : styles.link}
              activeClassName={styles.linkActive}
              onClick={close}
            >
              <Icon size={16} className={styles.linkIcon} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.divider} />

        <button type='button' className={`${styles.link} ${styles.logout}`} onClick={handleLogout}>
          <LogOut size={16} className={styles.linkIcon} />
          Log out
        </button>
      </div>
    </div>
  );
};

export default withRouter(ProfileMenu);
