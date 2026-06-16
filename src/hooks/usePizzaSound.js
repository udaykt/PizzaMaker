import { useCallback } from 'react';
import { useSelector } from 'react-redux';

// One shared AudioContext for the whole app — created lazily on first use
// since browsers require it to start from a user gesture anyway.
let sharedCtx = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedCtx) sharedCtx = new AudioCtor();
  return sharedCtx;
};

// Synthesized rather than an audio file — keeps the bundle light and avoids
// shipping/licensing a sound asset for one soft "plop".
export default function usePizzaSound() {
  const enabled = useSelector((s) => s.ui.soundEnabled);

  const playPlop = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }, [enabled]);

  return playPlop;
}
