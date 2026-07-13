import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Pencil, Check, X } from 'lucide-react';
import { pizzaActions, MAX_CUSTOM_NAME_LENGTH } from '@/store/pizzaSlice';
import { suggestPizzaName, withPizzaSuffix } from '@/utils/pizzaName';
import styles from './pizzaNameField.module.css';

// Shown once, ever. After that the pencil has to carry its own weight — a hint
// that keeps reappearing is just nagging.
const NUDGE_SEEN_KEY = 'pizzamaker_name_nudge_seen';
const NUDGE_VISIBLE_MS = 7000;

// The checkout title, which doubles as the rename affordance.
//
// Discoverability without a modal: the name sits next to a pencil, and on a
// customer's first ever visit a small coach-mark points at it — "Don't like
// ours? Name it yourself." It auto-dismisses after a few seconds, disappears the
// moment they interact with anything here, and never returns (localStorage).
// That's the pattern most apps have converged on for a secondary,
// nice-to-have action: offer it once, unobtrusively, then get out of the way.
const PizzaNameField = ({ orderState, crustStyle, bakeLevel }) => {
  const dispatch = useDispatch();
  const customName = useSelector((s) => s.pizza.customName);

  const suggestion = suggestPizzaName(orderState, { crustStyle, bakeLevel });
  const displayName = withPizzaSuffix(customName || suggestion);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem(NUDGE_SEEN_KEY)) return undefined;
    setShowNudge(true);
    const timer = setTimeout(() => setShowNudge(false), NUDGE_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismissNudge = () => {
    if (!localStorage.getItem(NUDGE_SEEN_KEY)) {
      localStorage.setItem(NUDGE_SEEN_KEY, '1');
    }
    setShowNudge(false);
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
    dismissNudge();
    // Seed the box with whatever is on screen, minus the " Pizza" suffix we add
    // back on save — otherwise the customer types "X" into "The Inferno Pizza"
    // and ends up with "X Pizza Pizza".
    setDraft(customName || suggestion);
    setIsEditing(true);
  };

  const save = () => {
    const trimmed = draft.trim();
    // Emptying the box is how you get the suggestion back — a rename shouldn't
    // be a one-way door.
    if (trimmed) dispatch(pizzaActions.setCustomName(trimmed));
    else dispatch(pizzaActions.clearCustomName());
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft('');
    setIsEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  if (isEditing) {
    return (
      <div className={styles.editRow}>
        <input
          ref={inputRef}
          className={styles.input}
          value={draft}
          maxLength={MAX_CUSTOM_NAME_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={suggestion}
          aria-label='Name your pizza'
        />
        <button type='button' className={styles.iconBtn} onClick={save} aria-label='Save name'>
          <Check size={16} />
        </button>
        <button type='button' className={styles.iconBtn} onClick={cancel} aria-label='Cancel'>
          <X size={16} />
        </button>
        {/* The suffix is added for them, so say so rather than letting them
            wonder why "Pizza" appeared. */}
        <span className={styles.hint}>
          Enter to save · we'll add "Pizza" for you
        </span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.nameRow}>
        <h2 className={styles.name} title={displayName}>{displayName}</h2>

        <button
          type='button'
          className={`${styles.pencil} ${showNudge ? styles.pencilPulse : ''}`}
          onClick={startEditing}
          aria-label='Rename your pizza'
        >
          <Pencil size={15} />
        </button>
      </div>

      {showNudge && (
        <div className={styles.nudge} role='status'>
          <span>Don't like ours? Name it yourself.</span>
          <button type='button' className={styles.nudgeDismiss} onClick={dismissNudge} aria-label='Dismiss'>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PizzaNameField;
