import { useDispatch, useSelector } from 'react-redux';
import Header from '../../containers/Header/Header';
import PizzaHub from '../../containers/PizzaHub/PizzaHub';
import { headerActions } from '../../store/headerSlice';
import './home.css';

const Home = (props) => {
  const headerState = useSelector((state) => state.header);
  const dispatch = useDispatch();
  const collapse = (e) => {
    if (e.target.id !== 'avatar' && headerState.showProfileMenu) {
      dispatch(headerActions.toggleProfileMenu(false));
    }
  };
  return (
    <div className='home' onClick={collapse}>
      <div className='headerDiv'>
        <Header />
      </div>
      <div className='pizzahubDiv'>
        <PizzaHub />
      </div>
    </div>
  );
};

export default Home;
