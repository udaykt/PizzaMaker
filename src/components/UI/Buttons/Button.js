import styles from './button.module.css';

const Button = (props) => {
  return (
    <button
      className={props.className ? props.className : styles.className}
      type={props.type || 'button'}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export default Button;
