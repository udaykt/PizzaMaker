import './dummyPizza.css';

const DummyPizza = (props) => {
  const dummyState = {
    base: {
      sauce: {
        title: 'sauce',
        checked: false,
      },
      mozzarella: {
        title: 'mozzarella',
        checked: false,
      },
      cheese: {
        title: 'cheese',
        checked: false,
      },
    },
    toppings: {
      pepperoni: {
        title: 'pepperoni',
        medium: false,
        checked: false,
      },
      sausage: {
        title: 'sausage',
        medium: false,
        checked: false,
      },
      peppers: {
        title: 'peppers',
        medium: false,
        checked: false,
      },
      olives: {
        title: 'olives',
        medium: false,
        checked: false,
      },
    },
  };

  return (
    <div className='dummyPizza'>
      <div className={`sauce`} />
      <div className={`cheese`} />
      <div className={`mozarella`} />
      <div className={`olives`} />
      <div className={`olive2`} />
      <div className={`olive3`} />
      <div className={`olive4`} />
      <div className={`olive5`} />
      <div className={`olive6`} />
      <div className={`olive7`} />
      <div className={`olive1`} />
      <div className={`sausage`} />
      <div className={`sausage1`} />
      <div className={`sausage2`} />
      <div className={`sausage3`} />
      <div className={`sausage4`} />
      <div className={`sausage5`} />
      <div className={`sausage6`} />
      <div className={`peppers`} />
      <div className={`peppers1`} />
      <div className={`peppers2`} />
      <div className={`peppers3`} />
      <div className={`peppers4`} />
      <div className={`peppers5`} />
      <div className={`peppers6`} />
      <div className={`pepperoni`} />
      <div className={`pepperoni1`} />
      <div className={`pepperoni2`} />
      <div className={`pepperoni3`} />
      <div className={`pepperoni4`} />
      <div className={`pepperoni5`} />
      <div className={`pepperoni6`} />
    </div>
  );
};

export default DummyPizza;
