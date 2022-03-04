import Header from '../../containers/Header/Header';
import PizzaHub from '../../containers/PizzaHub/PizzaHub';
import './home.css';
const Home = (props) => {
  return (
    <div className='home'>
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
