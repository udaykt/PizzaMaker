import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeWarmup } from '@/api/warmup';
import styles from './warmupOverlay.module.css';

// The playful, brand-voiced explanation for a cold-start wait. It only appears
// when a request has already been slow for ~2s (see warmup.js), so on a warm
// backend nobody ever sees it. Purpose: turn the ~40s Render wake-up from "is
// this broken?" into "the kitchen's firing up" — a wait that reads as intentional.
//
// Messages rotate so a long wait feels like progress rather than a frozen screen.
const MESSAGES = [
  'Firing up the oven…',
  'Our kitchen was napping — waking it up.',
  'Stretching the dough…',
  'Almost there, thanks for your patience.',
];
const ROTATE_MS = 3200;

const WarmupOverlay = () => {
  const [slow, setSlow] = useState(false);
  const [msg, setMsg] = useState(0);
  const rotateRef = useRef(null);

  useEffect(() => subscribeWarmup(setSlow), []);

  useEffect(() => {
    if (!slow) {
      setMsg(0);
      return undefined;
    }
    rotateRef.current = setInterval(
      () => setMsg((m) => Math.min(m + 1, MESSAGES.length - 1)),
      ROTATE_MS
    );
    return () => clearInterval(rotateRef.current);
  }, [slow]);

  return (
    <AnimatePresence>
      {slow && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <div className={styles.oven}>
            <span className={styles.pizza}>🍕</span>
          </div>
          <h2 className={styles.title}>Firing up the oven</h2>
          <p className={styles.sub}>{MESSAGES[msg]}</p>
          <p className={styles.fineprint}>
            First order in a while? Our free-tier kitchen takes a moment to wake up.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WarmupOverlay;
