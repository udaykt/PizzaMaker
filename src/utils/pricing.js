// Single source of truth for live pizza pricing, used by both the running
// total in PizzaHub and the line-item breakdown in Checkout — keeping them
// in one place means they can never silently drift apart from each other.
// (The backend computes its own authoritative price at order time —
// see PricingService.java — this is purely for the pre-order estimate.)

export const SIZE_TO_ENUM = { regular: 'R', medium: 'M', large: 'L' };
export const BASE_ITEM_PRICE = 0.5;
export const TOPPING_PRICE_REGULAR = 1.5;
export const TOPPING_PRICE_MEDIUM = 2.0;

const BASE_LABELS = { sauce: 'Sauce', mozzarella: 'Mozzarella', cheese: 'Cheese' };
const TOPPING_LABELS = { pepperoni: 'Pepperoni', sausage: 'Sausage', peppers: 'Peppers', olives: 'Olives' };

// Returns { lineItems: [{ key, label, price }], total } for everything
// actually selected — nothing for unchecked items.
export function computePriceBreakdown({ base, toppings, sizePricing, size }) {
  const sizeKey = SIZE_TO_ENUM[size] || 'M';
  const sizePrice = sizePricing?.[sizeKey] ?? { R: 8, M: 12, L: 16 }[sizeKey];

  const lineItems = [];
  let total = sizePrice;

  Object.entries(base || {}).forEach(([key, v]) => {
    if (v.checked) {
      lineItems.push({ key, label: BASE_LABELS[key] || key, price: BASE_ITEM_PRICE });
      total += BASE_ITEM_PRICE;
    }
  });

  Object.entries(toppings || {}).forEach(([key, v]) => {
    if (v.checked) {
      const price = v.medium ? TOPPING_PRICE_MEDIUM : TOPPING_PRICE_REGULAR;
      const qty = v.medium ? 'Medium' : 'Regular';
      lineItems.push({ key, label: `${TOPPING_LABELS[key] || key} (${qty})`, price });
      total += price;
    }
  });

  return { lineItems, total };
}
