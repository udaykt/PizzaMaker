// Gives a built pizza a real name instead of a generic "Your Pizza" label.
// If the selection matches one of the named presets (Supreme, Margherita, …)
// it takes that name; otherwise it's named after its toppings, e.g.
// "Pepperoni & Olives Pizza" or, with none, "Cheese Pizza".

import { PRESET_PIZZAS } from '@/features/pizza/Presets/presets';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';
import { SAUCE_TYPES } from '@/store/pizzaHubSlice';

const CHEESE_KEYS = ['mozzarella', 'provolone', 'feta', 'veganCheese'];
const TOPPING_LABEL = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t.label]));

// The "composition" that identifies a pizza: which toppings, which cheeses and
// the sauce — ignoring size/crust/bake/quantity, which don't change its name.
function signature(base, toppings) {
  const top = TOPPING_CATALOG.filter((t) => toppings?.[t.id]?.checked).map((t) => t.id).sort();
  const cheese = CHEESE_KEYS.filter((k) => base?.[k]?.checked).sort();
  const sauce = base?.sauce?.sauceType ?? SAUCE_TYPES.NONE;
  return { top, cheese, sauce };
}

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameSignature = (a, b) => a.sauce === b.sauce && sameList(a.top, b.top) && sameList(a.cheese, b.cheese);

// "Pepperoni" / "Pepperoni & Olives" / "Pepperoni, Sausage & Peppers"
function joinLabels(labels) {
  if (labels.length === 1) return labels[0];
  return labels.slice(0, -1).join(', ') + ' & ' + labels[labels.length - 1];
}

export function pizzaName(orderState) {
  const sig = signature(orderState?.base, orderState?.toppings);

  const preset = PRESET_PIZZAS.find((p) => sameSignature(signature(p.config.base, p.config.toppings), sig));
  if (preset) return `${preset.name} Pizza`;

  // Display in catalog order (not the sorted signature), so the name reads
  // Pepperoni, Sausage, Peppers, Olives rather than alphabetically.
  if (sig.top.length > 0) {
    const labels = TOPPING_CATALOG.filter((t) => orderState?.toppings?.[t.id]?.checked).map((t) => TOPPING_LABEL[t.id]);
    return `${joinLabels(labels)} Pizza`;
  }
  if (sig.cheese.length > 0) return 'Cheese Pizza';
  return 'Custom Pizza';
}
