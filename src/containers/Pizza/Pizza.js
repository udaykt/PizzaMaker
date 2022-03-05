import { Component } from 'react';
import styles from './pizza.module.css';
import { Fragment } from 'react';
import Slice from './Slice/Slice';
import DummyPizza from '../DummyPizza/DummyPizza';

const SMALL = '6';
const MEDIUM = '12';
const LARGE = '5';

class Pizza extends Component {
  state = {
    quantity: {
      small: { active: false, value: SMALL },
      medium: { active: false, value: MEDIUM },
      large: { active: false, value: LARGE },
    },
    value: 'small',
    sliced: true,
    loggedIn: true,
  };

  quantityHandler = (value) => {
    switch (this.props.quantity) {
      case 'small':
        return this.state.quantity.small.value;
      case 'medium':
        return this.state.quantity.medium.value;
      case 'large':
        return this.state.quantity.large.value;
      default:
        return this.state.quantity.small.value;
    }
  };
  buildStyle() {
    let top = Math.floor(Math.random() * (70 - 5) + 5);
    let left = Math.floor(Math.random() * (70 - 20) + 30);
    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  }

  render() {
    const quantity = 6;
    const arr = [...Array(quantity).keys()];
    //slices is singular
    return (
      <Fragment>
        <div className={styles.pizza}>
          {(this.state.loggedIn &&
            Object.entries(this.props.parts).map(([k, v]) => {
              return (
                <Slice
                  key={k + v}
                  part={v}
                  quantity={this.quantityHandler(this.props.value)}
                  {...this.props}
                  style={this.buildStyle}
                />
              );
            })) ||
            (!this.state.loggedIn && <DummyPizza />)}
        </div>
      </Fragment>
    );
  }
}

export default Pizza;
