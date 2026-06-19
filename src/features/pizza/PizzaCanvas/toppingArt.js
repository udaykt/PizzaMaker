import pepperoniPng   from '@/assets/images/toppings/pepperoni.png';
import sausagePng     from '@/assets/images/toppings/sausage.png';
import sausageKnobPng from '@/assets/images/toppings/sausage_knob.png';
import peppersPng     from '@/assets/images/toppings/peppers.png';
import peppersKnobPng from '@/assets/images/toppings/peppers_knob.png';
import olivesPng      from '@/assets/images/toppings/olives.png';
import oliveKnobPng   from '@/assets/images/toppings/olive_knob.png';
import jalapenoPng    from '@/assets/images/toppings/jalapeno.png';
import jalapenoKnobPng from '@/assets/images/toppings/jalapeno_knob.png';
import mushroomPng    from '@/assets/images/toppings/mushroom.png';
import baconPng       from '@/assets/images/toppings/bacon.png';
import chickenPng     from '@/assets/images/toppings/chicken.png';
import chickenKnobPng from '@/assets/images/toppings/chicken_knob.png';
import onionPng       from '@/assets/images/toppings/onion.png';
import onionKnobPng   from '@/assets/images/toppings/onion_knob.png';
import spinachPng     from '@/assets/images/toppings/spinach.png';
import spinachKnobPng from '@/assets/images/toppings/spinach_knob.png';
import tomatoPng      from '@/assets/images/toppings/tomato.png';
import zucchiniPng     from '@/assets/images/toppings/zucchini.png';
import zucchiniKnobPng from '@/assets/images/toppings/zucchini_knob.png';
import broccoliPng    from '@/assets/images/toppings/broccoli.png';
import cornPng        from '@/assets/images/toppings/corn.png';
import cornKnobPng    from '@/assets/images/toppings/corn_knob.png';

// Each topping's visual identity. `image` is the real photo rendered on the
// pizza canvas. `knob` is the photo shown on the small menu toggle — same as
// `image` for most toppings, but a separate file where the full piece reads
// better at thumbnail size (sausage link, whole onion cross-section, spinach
// bunch). `knobSize` controls how large the image appears inside the toggle
// circle. `swatch` is the colour dot next to the topping name.
//
// This is the only per-topping code — everything else is data in
// config/toppingCatalog.js. Adding a topping = one row there + one entry here.
export const TOPPING_ART = {
  // Non-Veg
  pepperoni: { swatch: '#a94100', image: pepperoniPng,   knob: pepperoniPng,   knobSize: '16px' },
  sausage:   { swatch: '#b0926d', image: sausagePng,     knob: sausageKnobPng, knobSize: '30px' },
  bacon:     { swatch: '#8b3a1a', image: baconPng,       knob: baconPng,       knobSize: '30px' },
  chicken:   { swatch: '#d4831a', image: chickenPng,     knob: chickenKnobPng, knobSize: '28px' },
  // Veg
  peppers:   { swatch: '#c0392b', image: peppersPng,     knob: peppersKnobPng, knobSize: '26px' },
  olives:    { swatch: '#353535', image: olivesPng,      knob: oliveKnobPng,   knobSize: '22px' },
  jalapeno:  { swatch: '#2d7a2d', image: jalapenoPng,    knob: jalapenoKnobPng, knobSize: '26px' },
  mushroom:  { swatch: '#c4a87a', image: mushroomPng,    knob: mushroomPng,    knobSize: '24px' },
  onion:     { swatch: '#9b2c9b', image: onionPng,       knob: onionKnobPng,   knobSize: '26px' },
  spinach:   { swatch: '#2d6a2d', image: spinachPng,     knob: spinachKnobPng, knobSize: '22px' },
  tomato:    { swatch: '#e74c3c', image: tomatoPng,      knob: tomatoPng,      knobSize: '24px' },
  zucchini:  { swatch: '#4a7c59', image: zucchiniPng,    knob: zucchiniKnobPng, knobSize: '28px' },
  broccoli:  { swatch: '#27612d', image: broccoliPng,    knob: broccoliPng,    knobSize: '24px' },
  corn:      { swatch: '#e8c41a', image: cornPng,        knob: cornKnobPng,    knobSize: '28px' },
};
