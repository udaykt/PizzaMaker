// Single source of truth for every topping: its id (join key across frontend
// state, order payload, backend allow-list and art registry), display label,
// veg/non-veg category, and the two canvas properties that drive placement —
// baseCount (pieces at Regular on a Medium) and pieceRadius (SVG units).
//
// Adding a topping = one row here + one entry in toppingArt.js. Everything
// else (builder state, menu grouping, canvas, order payload, backend replay)
// derives from this automatically.
export const TOPPING_CATALOG = [
  // Non-Veg
  { id: 'pepperoni', label: 'Pepperoni', category: 'nonveg', baseCount: 10, pieceRadius: 20  },
  { id: 'sausage',   label: 'Sausage',   category: 'nonveg', baseCount: 12, pieceRadius: 13  },
  { id: 'bacon',     label: 'Bacon',     category: 'nonveg', baseCount: 5,  pieceRadius: 24  },
  { id: 'chicken',   label: 'Chicken',   category: 'nonveg', baseCount: 10, pieceRadius: 15  },
  // Veg
  { id: 'peppers',   label: 'Peppers',   category: 'veg',    baseCount: 8,  pieceRadius: 20  },
  { id: 'olives',    label: 'Olives',    category: 'veg',    baseCount: 12, pieceRadius: 9   },
  { id: 'jalapeno',  label: 'Jalapeño',  category: 'veg',    baseCount: 12, pieceRadius: 9   },
  { id: 'mushroom',  label: 'Mushroom',  category: 'veg',    baseCount: 8,  pieceRadius: 18  },
  { id: 'onion',     label: 'Onion',     category: 'veg',    baseCount: 10, pieceRadius: 16  },
  { id: 'spinach',   label: 'Spinach',   category: 'veg',    baseCount: 15, pieceRadius: 12  },
  { id: 'tomato',    label: 'Tomato',    category: 'veg',    baseCount: 5,  pieceRadius: 16  },
  { id: 'zucchini',  label: 'Zucchini',  category: 'veg',    baseCount: 7,  pieceRadius: 24  },
  { id: 'broccoli',  label: 'Broccoli',  category: 'veg',    baseCount: 8,  pieceRadius: 14  },
  { id: 'corn',      label: 'Corn',      category: 'veg',    baseCount: 12, pieceRadius: 8   },
];

export const TOPPING_IDS = TOPPING_CATALOG.map((t) => t.id);
