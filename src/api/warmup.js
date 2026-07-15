// Detects when an API call has been in flight long enough to be worth explaining
// to the user — the signature of a Render free-tier COLD START (the backend
// sleeps after ~15 min idle and takes ~30-60s to wake). When warm, every call
// resolves in well under a second and this never fires.
//
// A request only counts as "slow" once it passes SLOW_AFTER_MS, so ordinary fast
// calls never flash an overlay. WarmupOverlay subscribes to this and shows a
// branded "firing up the oven" state; axiosClient wires begin/end around every
// request.

const SLOW_AFTER_MS = 1800;

const listeners = new Set();
let slowInFlight = 0;
let isSlow = false;

function publish() {
  const next = slowInFlight > 0;
  if (next === isSlow) return;
  isSlow = next;
  listeners.forEach((fn) => fn(isSlow));
}

// Subscribe to slow/idle transitions. Fires immediately with the current state,
// and returns an unsubscribe fn.
export function subscribeWarmup(fn) {
  listeners.add(fn);
  fn(isSlow);
  return () => listeners.delete(fn);
}

// Call when a request starts; call the returned fn when it settles. Only requests
// that outlive SLOW_AFTER_MS ever move the needle, so this is silent on a warm
// backend.
export function beginRequest() {
  let counted = false;
  const timer = setTimeout(() => {
    counted = true;
    slowInFlight += 1;
    publish();
  }, SLOW_AFTER_MS);

  return function endRequest() {
    clearTimeout(timer);
    if (counted) {
      slowInFlight -= 1;
      publish();
    }
  };
}
