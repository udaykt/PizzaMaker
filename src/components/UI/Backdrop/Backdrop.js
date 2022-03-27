import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { pizzahubActions } from '../../../store/pizzahubSlice';
import { HOME_PATH } from '../../Utils/Constants';
import './backdrop.css';

const Backdrop = (props) => {
  const pizzaHubSlice = useSelector((state) => state.pizzahub);
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    if (window.location.pathname !== HOME_PATH)
      dispatch(pizzahubActions.setBackdrop(true));
    console.log(window.location.pathname);
  });

  const handleClick = (e) => {
    history.push(HOME_PATH);
    dispatch(pizzahubActions.setBackdrop(false));
  };

  return (
    <Fragment>
      {pizzaHubSlice.backdrop && (
        <div className='backdrop' onClick={handleClick}>
          {props.children}
        </div>
      )}
    </Fragment>
  );
};
export default Backdrop;
