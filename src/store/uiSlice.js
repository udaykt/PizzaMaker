import { createSlice } from '@reduxjs/toolkit';

const SOUND_KEY = 'pizzamaker_sound_enabled';

// Off by default — sound is an opt-in flourish, not a default behaviour.
const readStoredSoundPref = () => {
  try {
    return localStorage.getItem(SOUND_KEY) === '1';
  } catch (_) {
    return false;
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
