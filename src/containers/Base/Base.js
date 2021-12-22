import { useDispatch, useSelector } from 'react-redux';
import { pizzahubActions } from '../../store/pizzahubSlice';
import styles from './base.module.css';

const Base = (props) => {
  const bases = useSelector((state) => state.pizzahub.base);

  const dispatch = useDispatch();

  const onChangeHandler = (e, key) => {
    let base = bases[key];
    base = { ...base, checked: e.target.checked };
    dispatch(pizzahubActions.toggleBase(base));
  };

  return (
    <div className={styles.baseRoot}>
      <h2>Base</h2>
      <div className={styles.baseDiv}>
        {Object.entries(bases).map(([key, value]) => {
          return (
            <div key={'_' + key} className={styles.base}>
              <label>
                <input
                  type='checkbox'
                  key={key}
                  value='1'
                  onChange={(e) => onChangeHandler(e, key)}
                  hidden
                />
                <span>{value.title}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Base;
