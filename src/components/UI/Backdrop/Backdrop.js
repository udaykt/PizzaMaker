import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { pizzahubActions } from '../../../store/pizzahubSlice';
import { uiActions } from '../../../store/uiSlice';
import { HOME_PATH } from '../../Utils/Constants';
import './backdrop.css';

const Backdrop = (props) => {
  const uiState = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    if (window.location.pathname !== HOME_PATH)
      dispatch(uiActions.setBackdrop(true));
    console.log(window.location.pathname);
  });

  const handleClick = (e) => {
    history.push(HOME_PATH);
    dispatch(uiActions.setBackdrop(false));
  };

  return (
    <Fragment>
      {uiState.backdrop && (
        <div className='backdrop' onClick={handleClick}>
          {props.children}
        </div>
      )}
    </Fragment>
  );
};
export default Backdrop;
