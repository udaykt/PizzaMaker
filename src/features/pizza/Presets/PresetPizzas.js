import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import { applyPizzaConfigToBuilder } from '@/features/pizza/PizzaCanvas/fromOrder';
import { PRESET_PIZZAS } from './presets';
import styles from './presetPizzas.module.css';

const PresetPizzas = () => {
  const dispatch = useDispatch();
  const rowRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    let animId;
    let lastTs = 0;
    const SPEED = 28;

    const step = (ts) => {
      const dt = ts - lastTs;
      lastTs = ts;
      if (!pausedRef.current && el && dt < 120) {
        el.scrollLeft += (dt / 1000) * SPEED;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePick = (preset) => {
    applyPizzaConfigToBuilder(preset.config, dispatch);
    toast.success(`${preset.name} loaded — make it yours!`);
  };

  return (
    <div className={styles.presets}>
      <h3 className={styles.heading}>Quick Start</h3>
      <div
        ref={rowRef}
        className={styles.row}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onTouchStart={() => { pausedRef.current = true; }}
        onTouchEnd={() => { pausedRef.current = false; }}
      >
        {PRESET_PIZZAS.map((preset) => (
          <button
            key={preset.id}
            type='button'
            title={preset.name}
            className={styles.card}
            onClick={() => handlePick(preset)}
          >
            <div className={styles.thumb}>
              <PizzaCanvas
                size={preset.config.size}
                crustStyle={preset.config.crustStyle}
                bakeLevel={preset.config.bakeLevel}
                base={preset.config.base}
                toppings={preset.config.toppings}
                textured={false}
              />
            </div>
            <span className={styles.name}>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetPizzas;
