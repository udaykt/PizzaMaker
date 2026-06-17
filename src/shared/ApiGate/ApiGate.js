import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './apiGate.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
// /actuator/health is not in the CORS allowlist — use an API endpoint that is.
// /api/v1/menu/sizes is permitAll + covered by /api/** CORS, so it works cross-origin.
const PING_URL = `${API_BASE}/api/v1/menu/sizes`;
const POLL_MS = 500;
const SLOW_AFTER = 20; // attempts before "taking longer" message (~10 s)

const ApiGate = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const intervalRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const check = async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current === SLOW_AFTER) setSlow(true);
      try {
        const res = await fetch(PING_URL, { signal: AbortSignal.timeout(700) });
        if (res.ok) {
          clearInterval(intervalRef.current);
          setReady(true);
        }
      } catch (_) {}
    };

    check();
    intervalRef.current = setInterval(check, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!ready && (
          <motion.div
            key='splash'
            className={styles.splash}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          >
            <div className={styles.icon}>🍕</div>
            <h1 className={styles.brand}>Pizza Maker</h1>
            <p className={styles.status}>
              {slow ? 'Taking longer than usual…' : 'Kitchen is warming up'}
            </p>
            <div className={styles.dots}>
              <span /><span /><span />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {ready && children}
    </>
  );
};

export default ApiGate;
