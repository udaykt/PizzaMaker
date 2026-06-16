import { describe, it, expect, beforeEach, vi } from 'vitest';
import uiSlice from './uiSlice';

const { reducer, actions } = uiSlice;

// vite.config.js runs tests under environment: 'node' (no DOM/localStorage),
// so stub a minimal in-memory localStorage just for this file.
function createLocalStorageStub() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe('uiSlice', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub());
  });

  it('sound is off by default', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.soundEnabled).toBe(false);
  });

  it('toggleSound flips the flag and persists it', () => {
    let state = reducer(undefined, actions.toggleSound());
    expect(state.soundEnabled).toBe(true);
    expect(localStorage.getItem('pizzamaker_sound_enabled')).toBe('1');

    state = reducer(state, actions.toggleSound());
    expect(state.soundEnabled).toBe(false);
    expect(localStorage.getItem('pizzamaker_sound_enabled')).toBe('0');
  });

  it('setBackdrop sets the flag directly', () => {
    const state = reducer(undefined, actions.setBackdrop(true));
    expect(state.backdrop).toBe(true);
  });
});
