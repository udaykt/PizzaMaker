import { Volume2, VolumeX } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { uiActions } from '@/store/uiSlice';
import styles from './soundToggle.module.css';

const SoundToggle = () => {
  const enabled = useSelector((state) => state.ui.soundEnabled);
  const dispatch = useDispatch();

  return (
    <button
      type='button'
      className={styles.soundToggle}
      onClick={() => dispatch(uiActions.toggleSound())}
      aria-label={enabled ? 'Mute topping sounds' : 'Enable topping sounds'}
      title={enabled ? 'Sound on' : 'Sound off'}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
};

export default SoundToggle;
