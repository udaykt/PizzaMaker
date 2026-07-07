import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import logoNoBg from '@/assets/images/logo-badge-nobg.png';
import styles from './apiGate.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
// /actuator/health is not in the CORS allowlist — use an API endpoint that is.
// /api/v1/menu/sizes is permitAll + covered by /api/** CORS, so it works cross-origin.
const PING_URL = `${API_BASE}/api/v1/menu/sizes`;
const POLL_MS = 500;
// Never hold the splash longer than this. The pizza builder is fully
// client-side (local topping catalog + pricing fallback), so the UI must
// never be trapped waiting on the API — at worst we reveal and let
// backend-only features (auth, ordering) surface their own errors.
const MAX_WAIT_MS = 2500;

// When the app is served from a real domain but the only API base we have is
// localhost, there is no backend to reach (e.g. a static Pages deploy built
// without VITE_API_URL). A cross-origin fetch to http://localhost from an
// https page is blocked as mixed content and can never succeed, so don't gate
// on it at all — render the builder immediately.
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const noReachableBackend = API_BASE.includes('localhost') && !isLocalHost;

const ApiGate = ({ children }) => {
  const [ready, setReady] = useState(noReachableBackend);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (noReachableBackend) return;

    const startedAt = Date.now();
    const reveal = () => {
      clearInterval(intervalRef.current);
      setReady(true);
    };
    const check = async () => {
      try {
        const res = await fetch(PING_URL, { signal: AbortSignal.timeout(700) });
        if (res.ok) return reveal();
      } catch (_) {}
      if (Date.now() - startedAt >= MAX_WAIT_MS) reveal();
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
            <img src={logoNoBg} alt='Pizza Maker' className={styles.icon} />
            <p className={styles.status}>Kitchen is warming up</p>
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
