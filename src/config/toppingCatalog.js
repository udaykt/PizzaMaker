// Single source of truth for which toppings exist and their mechanical
// properties: how many pieces render at "regular" on a medium pizza
// (baseCount) and the base radius of each piece in SVG units (pieceRadius).
//
// Visual identity (swatch colour, SVG gradient and shape) lives in the art
// registry at features/pizza/PizzaCanvas/toppingArt.js, and pricing is tier
// based (see utils/pricing.js, same Light/Regular/Extra price for every
// topping). So adding a topping is: one row here + one art entry keyed by the
// same id — it then flows through the builder state, menu, canvas, order
// payload and order replay with no further edits.
//
// `id` is the join key — it matches the order-payload field name, the backend
// topping id, and the key in TOPPING_ART.
export const TOPPING_CATALOG = [
  { id: 'pepperoni', label: 'Pepperoni', baseCount: 5, pieceRadius: 10 },
  { id: 'sausage', label: 'Sausage', baseCount: 8, pieceRadius: 6 },
  { id: 'peppers', label: 'Peppers', baseCount: 6, pieceRadius: 8 },
  { id: 'olives', label: 'Olives', baseCount: 7, pieceRadius: 5.5 },
];

export const TOPPING_IDS = TOPPING_CATALOG.map((t) => t.id);
