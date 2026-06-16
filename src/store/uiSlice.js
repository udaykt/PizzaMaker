import { createSlice } from '@reduxjs/toolkit';

const SOUND_KEY = 'pizzamaker_sound_enabled';

// On by default; respects an explicit prior choice (stored '0' or '1') so
// turning it off in Profile settings sticks across visits.
const readStoredSoundPref = () => {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    return stored === null ? true : stored === '1';
  } catch (_) {
    return true;
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: { backdrop: false, soundEnabled: readStoredSoundPref() },
  reducers: {
    setBackdrop(state, action) {
      state.backdrop = action.payload;
    },
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
      try {
        localStorage.setItem(SOUND_KEY, state.soundEnabled ? '1' : '0');
      } catch (_) {
        // localStorage unavailable (e.g. private mode) — preference just won't persist
      }
    },
  },
});

export const uiActions = uiSlice.actions;

export default uiSlice;
