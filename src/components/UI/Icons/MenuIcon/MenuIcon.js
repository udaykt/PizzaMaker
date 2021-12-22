import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { headerActions } from '../../../../store/headerSlice';
import './menuIcon.css';

const MenuIcon = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();
  const toggleMenuIconHandler = () => {
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    dispatch(headerActions.toggleMenuPage());
  };
  return (
    <NavLink to={headerState.menuPath} onClick={toggleMenuIconHandler}>
      <div
        title='Menu'
        className={`menuIcon ${headerState.showMenuPage ? 'open' : ''}`}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </NavLink>
  );
};

export default MenuIcon;
