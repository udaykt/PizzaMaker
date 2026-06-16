import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';

// Smoothly counts between price values instead of snapping, with a quick
// pulse so toggling a topping feels immediately responsive.
const AnimatedPrice = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const [pulsing, setPulsing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = to;
    if (from === to) return;

    const controls = animate(from, to, {
      duration: 0.4,
      ease: 'easeOut',
      onUpdate: setDisplay,
    });
    setPulsing(true);
    const pulseTimer = setTimeout(() => setPulsing(false), 220);

    return () => {
      controls.stop();
      clearTimeout(pulseTimer);
    };
  }, [value]);

  return (
    <motion.span
      animate={{ scale: pulsing ? 1.1 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
    >
      ${display.toFixed(2)}
    </motion.span>
  );
};

export default AnimatedPrice;
