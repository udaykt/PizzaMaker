import React from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import PizzaCanvas from '@/features/pizza/PizzaCanvas/PizzaCanvas';
import { applyPizzaConfigToBuilder } from '@/features/pizza/PizzaCanvas/fromOrder';
import { PRESET_PIZZAS } from './presets';
import styles from './presetPizzas.module.css';

// One tap loads a finished pizza straight into the live builder — same
// dispatch path "Order Again" uses — so it's a real starting point, not a
// locked-in choice. Still fully editable after picking one.
const PresetPizzas = () => {
  const dispatch = useDispatch();

  const handlePick = (preset) => {
    applyPizzaConfigToBuilder(preset.config, dispatch);
    toast.success(`${preset.name} loaded — make it yours!`);
  };

  return (
    <div className={styles.presets}>
      <h3 className={styles.heading}>Quick Start</h3>
      <div className={styles.row}>
        {PRESET_PIZZAS.map((preset) => (
          <button
            key={preset.id}
            type='button'
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
