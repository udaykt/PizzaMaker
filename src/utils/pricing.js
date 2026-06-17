// Single source of truth for live pizza pricing, used by both the running
// total in PizzaHub and the line-item breakdown in Checkout — keeping them
// in one place means they can never silently drift apart from each other.
// (The backend computes its own authoritative price at order time —
// see PricingService.java — this is purely for the pre-order estimate.)

import { TOPPING_QUANTITIES, SAUCE_TYPES } from '@/store/pizzaHubSlice';
import { DELIVERY_METHODS } from '@/store/pizzaSlice';

export const SIZE_TO_ENUM = { small: 'R', medium: 'M', large: 'L' };
export const STANDARD_CHEESE_PRICE = 0.5;
// Specialty cheeses (parmesan-asiago/feta/ricotta/vegan) cost more than
// mozzarella/cheddar — matches Domino's premium add-on pricing.
export const SPECIALTY_CHEESE_PRICE = 1.0;
export const STANDARD_SAUCE_PRICE = 0.5;
export const SPECIALTY_SAUCE_PRICE = 1.25;
// Typical real-world delivery surcharge; carryout has none.
export const DELIVERY_FEE = 2.99;

// Light/Regular/Extra — same tiers and roughly the same relative pricing
// Domino's, Pizza Hut, and Papa John's use (Extra ≈ 2x Regular).
export const TOPPING_PRICE = {
  [TOPPING_QUANTITIES.LIGHT]: 1.0,
  [TOPPING_QUANTITIES.REGULAR]: 1.5,
  [TOPPING_QUANTITIES.EXTRA]: 3.0,
};

const QUANTITY_LABEL = {
  [TOPPING_QUANTITIES.LIGHT]: 'Light',
  [TOPPING_QUANTITIES.REGULAR]: 'Regular',
  [TOPPING_QUANTITIES.EXTRA]: 'Extra',
};

const SAUCE_LABEL = {
  [SAUCE_TYPES.ROBUST_TOMATO]: 'Robust Tomato',
  [SAUCE_TYPES.MARINARA]: 'Marinara',
  [SAUCE_TYPES.GARLIC_PARMESAN]: 'Garlic Parmesan',
  [SAUCE_TYPES.ALFREDO]: 'Alfredo',
  [SAUCE_TYPES.BBQ]: 'BBQ',
};

// Garlic Parmesan/Alfredo/BBQ are priced as specialty sauces; Tomato/Marinara
// are the standard price.
const SPECIALTY_SAUCES = new Set([SAUCE_TYPES.GARLIC_PARMESAN, SAUCE_TYPES.ALFREDO, SAUCE_TYPES.BBQ]);

const CHEESE_LABELS = { mozzarella: 'Mozzarella', cheddar: 'Cheddar', parmesanAsiago: 'Parmesan/Asiago', feta: 'Feta', ricotta: 'Ricotta', veganCheese: 'Vegan Cheese' };
const SPECIALTY_CHEESES = new Set(['parmesanAsiago', 'feta', 'ricotta', 'veganCheese']);

const TOPPING_LABELS = { pepperoni: 'Pepperoni', sausage: 'Sausage', peppers: 'Peppers', olives: 'Olives' };

// Returns { lineItems: [{ key, label, price }], total } for everything
// actually selected — nothing for unchecked items.
export function computePriceBreakdown({ base, toppings, sizePricing, size, deliveryMethod }) {
  const sizeKey = SIZE_TO_ENUM[size] || 'M';
  const sizePrice = sizePricing?.[sizeKey] ?? { R: 8, M: 12, L: 16 }[sizeKey];

  const lineItems = [];
  let total = sizePrice;

  const sauceType = base?.sauce?.sauceType;
  if (sauceType && sauceType !== SAUCE_TYPES.NONE) {
    const price = SPECIALTY_SAUCES.has(sauceType) ? SPECIALTY_SAUCE_PRICE : STANDARD_SAUCE_PRICE;
    lineItems.push({ key: 'sauce', label: SAUCE_LABEL[sauceType] || 'Sauce', price });
    total += price;
  }

  Object.entries(base || {}).forEach(([key, v]) => {
    if (key === 'sauce') return; // handled above — different shape (sauceType, not checked)
    if (v.checked) {
      const price = SPECIALTY_CHEESES.has(key) ? SPECIALTY_CHEESE_PRICE : STANDARD_CHEESE_PRICE;
      lineItems.push({ key, label: CHEESE_LABELS[key] || key, price });
      total += price;
    }
  });

  Object.entries(toppings || {}).forEach(([key, v]) => {
    if (v.checked) {
      const price = TOPPING_PRICE[v.quantity] ?? TOPPING_PRICE[TOPPING_QUANTITIES.REGULAR];
      const qtyLabel = QUANTITY_LABEL[v.quantity] || 'Regular';
      lineItems.push({ key, label: `${TOPPING_LABELS[key] || key} (${qtyLabel})`, price });
      total += price;
    }
  });

  // Opt-in, not opt-out: the delivery fee only applies once the caller
  // explicitly knows the delivery method (Checkout, after the user has
  // picked). The live builder running total never passes this, since that
  // choice hasn't been made yet — it would be misleading to bake the fee in
  // before the user has chosen delivery vs. carryout.
  if (deliveryMethod === DELIVERY_METHODS.DELIVERY) {
    lineItems.push({ key: 'deliveryFee', label: 'Delivery Fee', price: DELIVERY_FEE });
    total += DELIVERY_FEE;
  }

  return { lineItems, total };
}
