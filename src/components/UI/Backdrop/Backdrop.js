import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { headerActions } from '../../../store/headerSlice';
import './backdrop.css';
import { Link } from 'react-router-dom';

const Backdrop = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();
  const handleClick = (e) => {
    if (headerState.showMenuPage) dispatch(headerActions.toggleMenuPage());
    if (headerState.showLoginPage) dispatch(headerActions.toggleLoginPage());
    if (headerState.showSignUpPage) dispatch(headerActions.toggleSignupPage());
    if (headerState.showGuestPage) dispatch(headerActions.toggleGuestPage());
  };

  return (
    <Fragment>
      {(headerState.showMenuPage && (
        <Link to={headerState.menuPath}>
          <div className='backdrop' onClick={handleClick}></div>
        </Link>
      )) ||
        (headerState.showLoginPage && (
          <Link to={headerState.loginPath}>
            <div className='backdrop' onClick={handleClick}></div>
          </Link>
        )) ||
        (headerState.showSignUpPage && (
          <Link to={headerState.signupPath}>
            <div className='backdrop' onClick={handleClick}></div>
          </Link>
        )) ||
        (headerState.showGuestPage && (
          <Link to={headerState.guestPath}>
            <div className='backdrop' onClick={handleClick}></div>
          </Link>
        ))}
    </Fragment>
  );
};
export default Backdrop;
