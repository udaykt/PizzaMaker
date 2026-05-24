import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { uiActions } from '@/store/uiSlice';
import { HOME_PATH } from '@/utils/routes';
import styles from './backdrop.module.css';

const Backdrop = (props) => {
  const uiState = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== HOME_PATH) {
      dispatch(uiActions.setBackdrop(true));
    }
  }, [location.pathname, dispatch]);

  const handleClick = (e) => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  return (
    <Fragment>
      {uiState.backdrop && (
        <div className={styles.backdrop} onClick={handleClick}>
          {props.children}
        </div>
      )}
    </Fragment>
  );
};
export default Backdrop;
