// Gives a built pizza a real name instead of a comma-separated topping dump.
//
// Three tiers, in order:
//   1. An exact preset match wins outright — "Supreme", "Meat Lover's".
//   2. Otherwise the pizza is *characterised*, not described: we read traits off
//      the composition (how much meat, how much veg, heat, sauce, crust, bake,
//      how heavily it's piled on) and pick a name from the pools those traits
//      unlock — "The Carnivore", "Blazing Kitchen Sink", "Smokehouse Riot".
//   3. One or two toppings need no invention: they already read fine as a list.
//
// The pick is DETERMINISTIC — a hash of the exact composition, not Math.random.
// That matters: the same pizza must have the same name on the builder, on
// checkout, and after a re-render, or the name would flicker on every keystroke.
// But because the hash covers every topping, quantity, cheese, sauce, crust and
// bake level, *any* toggle re-rolls it — so the name keeps pace with the build.

import { PRESET_PIZZAS } from '@/features/pizza/Presets/presets';
import { TOPPING_CATALOG } from '@/config/toppingCatalog';
import { SAUCE_TYPES } from '@/store/pizzaHubSlice';

const CHEESE_KEYS = ['mozzarella', 'cheddar', 'parmesanAsiago', 'feta', 'ricotta', 'veganCheese'];
const DAIRY_CHEESE_KEYS = ['mozzarella', 'cheddar', 'parmesanAsiago', 'feta', 'ricotta'];
const TOPPING_LABEL = Object.fromEntries(TOPPING_CATALOG.map((t) => [t.id, t.label]));

// ---------------------------------------------------------------------------
// Traits — what this pizza actually *is*.

function readProfile(base, toppings, opts = {}) {
  const selected = TOPPING_CATALOG.filter((t) => toppings?.[t.id]?.checked);
  const qtyOf = (id) => toppings?.[id]?.quantity ?? 'regular';

  const meats = selected.filter((t) => t.category === 'nonveg');
  const veg = selected.filter((t) => t.category === 'veg');
  const extras = selected.filter((t) => qtyOf(t.id) === 'extra');
  const lights = selected.filter((t) => qtyOf(t.id) === 'light');

  const cheeses = CHEESE_KEYS.filter((k) => base?.[k]?.checked);
  const dairy = DAIRY_CHEESE_KEYS.filter((k) => base?.[k]?.checked);
  const sauce = base?.sauce?.sauceType ?? SAUCE_TYPES.NONE;

  return {
    selected,
    labels: selected.map((t) => TOPPING_LABEL[t.id]),
    total: selected.length,
    meats: meats.length,
    veg: veg.length,
    extras: extras.length,
    lights: lights.length,
    cheeses: cheeses.length,
    hasDairy: dairy.length > 0,
    hasVeganCheese: cheeses.includes('veganCheese'),
    sauce,
    spicy: !!toppings?.jalapeno?.checked,
    crustStyle: opts.crustStyle ?? 'hand-tossed',
    bakeLevel: opts.bakeLevel ?? 'normal',
  };
}

// ---------------------------------------------------------------------------
// Name pools, one per trait.
//
// `names`  — complete names this trait can produce on its own.
// `adj`    — adjectives it lends to a *combined* name.
// `noun`   — nouns it lends to a combined name.
//
// Two matching traits cross-pollinate (adj of one × noun of the other), so a
// spicy meat pizza can come out as "Blazing Carnivore" or "Meat Inferno" —
// names that exist in neither pool alone. That's where the volume comes from:
// ~20 traits with ~10 names each is a couple of hundred base names, and the
// cross product pushes the reachable space into the thousands.
//
// `weight` orders specificity — the most characteristic traits get first say.
const TRAITS = [
  {
    id: 'loaded',
    weight: 100,
    when: (p) => p.total >= 10,
    names: ['The Everything', 'The Kitchen Sink', 'The Overachiever', 'Maximum Effort',
            'The Avalanche', 'Full House', 'The Whole Shebang', 'No Regrets',
            'The Landslide', 'Absolutely Everything', 'The Glutton', 'Peak Pizza'],
    adj: ['Loaded', 'Towering', 'Colossal', 'Unhinged', 'Maxed-Out'],
    noun: ['Kitchen Sink', 'Avalanche', 'Everything', 'Mountain', 'Pile-Up'],
  },
  {
    id: 'works',
    weight: 90,
    when: (p) => p.meats >= 2 && p.veg >= 3,
    names: ['The Works', 'Supreme Being', 'The Full Monty', 'Best of Both Worlds',
            'The Diplomat', 'Middle Ground', 'The Crowd Pleaser', 'Something for Everyone',
            'The Peace Treaty', 'The All-Rounder'],
    adj: ['Loaded', 'Complete', 'Well-Rounded'],
    noun: ['Works', 'Ensemble', 'Medley', 'Union'],
  },
  {
    id: 'carnivore',
    weight: 85,
    when: (p) => p.meats >= 3 && p.veg === 0,
    names: ['The Carnivore', 'Meat Riot', "The Butcher's Block", 'Protein Palace',
            'The Meatstorm', 'Predator', 'The Apex', 'All Killer No Filler',
            'The Meat Cathedral', 'Herbivores Beware', 'The Feedlot', 'Full Carnage'],
    adj: ['Meaty', 'Savage', 'Feral', 'Ravenous', 'Primal'],
    noun: ['Carnivore', 'Riot', 'Butcher', 'Predator', 'Carnage'],
  },
  {
    id: 'meaty',
    weight: 70,
    when: (p) => p.meats >= 2 && p.veg <= 1,
    names: ['Meat Lover', 'The Heavyweight', 'Protein Run', 'The Meat Wagon',
            'The Double Down', 'Serious Business', 'The Bruiser'],
    adj: ['Meaty', 'Hearty', 'Hefty'],
    noun: ['Heavyweight', 'Bruiser', 'Wagon'],
  },
  {
    id: 'vegan',
    weight: 88,
    when: (p) => p.hasVeganCheese && !p.hasDairy && p.meats === 0,
    names: ['The Vegan Vanguard', 'Plant Powered', 'Green Genesis', 'Guilt-Free Zone',
            'The Kind One', 'Zero Casualties', 'The Conscientious Objector', 'Root & Branch'],
    adj: ['Plant-Powered', 'Kind', 'Guilt-Free', 'Cruelty-Free'],
    noun: ['Vanguard', 'Genesis', 'Sanctuary'],
  },
  {
    id: 'garden',
    weight: 80,
    when: (p) => p.veg >= 3 && p.meats === 0,
    names: ['Garden Party', 'The Greenhouse', 'The Veggie Patch', 'Harvest Moon',
            'Green Machine', 'The Allotment', 'Field to Fire', 'The Grocer',
            'Salad Days', 'The Photosynthesis', 'Rabbit Food (Affectionately)', 'The Undergrowth'],
    adj: ['Garden', 'Verdant', 'Leafy', 'Farmhouse', 'Green'],
    noun: ['Garden', 'Greenhouse', 'Harvest', 'Allotment', 'Patch'],
  },
  {
    id: 'spicy',
    weight: 82,
    when: (p) => p.spicy,
    names: ['The Inferno', 'Firestarter', "Dragon's Breath", 'Five Alarm', 'Heatwave',
            'The Reckoning', 'Scorched Earth', 'Mouth on Fire', 'The Volcano',
            'Regret, Later', 'The Burn Notice', 'Hot Take'],
    adj: ['Blazing', 'Fiery', 'Scorching', 'Molten', 'Volcanic', 'Devilish'],
    noun: ['Inferno', 'Firestorm', 'Heatwave', 'Volcano', 'Reckoning'],
  },
  {
    id: 'bbq',
    weight: 78,
    when: (p) => p.sauce === SAUCE_TYPES.BBQ,
    names: ['The Smokehouse', 'BBQ Baron', 'Backyard Special', 'The Pitmaster',
            'Low & Slow', 'Smoke Signals', 'The Grill Sergeant', 'Deep South'],
    adj: ['Smoky', 'Smokehouse', 'Barbecued', 'Backyard'],
    noun: ['Smokehouse', 'Pitmaster', 'Baron', 'Smoke Stack'],
  },
  {
    id: 'white',
    weight: 76,
    when: (p) => p.sauce === SAUCE_TYPES.ALFREDO || p.sauce === SAUCE_TYPES.GARLIC_PARMESAN,
    names: ['The White Pie', 'Bianca', 'Alfredo Dream', 'Snowfall', 'The Pale Rider',
            'Cream of the Crop', 'White Out', 'The Ivory'],
    adj: ['Creamy', 'Silken', 'White', 'Velvet'],
    noun: ['Bianca', 'Snowfall', 'Cream', 'White Out'],
  },
  {
    id: 'cheesy',
    weight: 74,
    when: (p) => p.cheeses >= 4,
    names: ['Quattro Formaggi', 'Cheese Cathedral', 'The Fromage Fiend', 'Cheese Overload',
            'The Dairy Queen', 'Say Cheese', 'The Curd Nerd', 'Lactose Intolerable',
            'Cheese Mountain', 'The Big Cheese'],
    adj: ['Cheesy', 'Molten', 'Gooey', 'Four-Cheese'],
    noun: ['Cheese Cathedral', 'Fromage', 'Big Cheese', 'Cheese Mountain'],
  },
  {
    id: 'stuffed',
    weight: 60,
    when: (p) => p.crustStyle === 'stuffed',
    names: ['The Stuffed Sensation', 'Hidden Depths', 'The Secret Weapon',
            'Crust Crusader', 'The Trojan Crust', 'Inside Job'],
    adj: ['Stuffed', 'Loaded-Crust', 'Secretive'],
    noun: ['Sensation', 'Secret', 'Inside Job'],
  },
  {
    id: 'charred',
    weight: 58,
    when: (p) => p.bakeLevel === 'well-done',
    names: ['The Charred One', 'Burnt Offering', 'Crispy Critter', 'Well Done, You',
            'The Cremation', 'Extra Crispy', 'Fired Up'],
    adj: ['Charred', 'Blistered', 'Crispy', 'Fire-Kissed'],
    noun: ['Char', 'Burnt Offering', 'Ember'],
  },
  {
    id: 'thin',
    weight: 40,
    when: (p) => p.crustStyle === 'thin',
    names: ['The Featherweight', 'Thin & Wired', 'The Minimalist', 'Paper Thin',
            'The Wafer', 'Light Touch'],
    adj: ['Featherweight', 'Wafer-Thin', 'Lean'],
    noun: ['Featherweight', 'Wafer', 'Sliver'],
  },
  {
    id: 'heavy',
    weight: 68,
    when: (p) => p.extras >= 3,
    names: ['The Heavyweight', 'Piled High', 'Double Everything', 'The Bulldozer',
            'Extra, Extra', 'The Gluttonous', 'No Half Measures'],
    adj: ['Piled-High', 'Double-Stacked', 'Heavyweight'],
    noun: ['Heavyweight', 'Bulldozer', 'Stack'],
  },
  {
    id: 'light',
    weight: 38,
    when: (p) => p.total >= 3 && p.lights === p.total,
    names: ['The Whisper', 'Barely There', 'The Understatement', 'Light Work',
            'Subtle Notes', 'The Gentle Touch'],
    adj: ['Subtle', 'Whispered', 'Delicate'],
    noun: ['Whisper', 'Understatement'],
  },
  {
    id: 'balanced',
    // The catch-all: 3+ toppings that fit no stronger character. Never empty-
    // handed, so the generator always has something to say.
    weight: 10,
    when: (p) => p.total >= 3,
    names: ['The House Special', 'Chef\'s Whim', 'The Custom Job', 'One of a Kind',
            'The Original', 'Signature Build', 'The Wildcard', 'Off Menu',
            'The Freestyle', 'Your Move', 'The Improvisation', 'Made to Order'],
    adj: ['Signature', 'Bespoke', 'House', 'Freestyle'],
    noun: ['Special', 'Wildcard', 'Original', 'Freestyle'],
  },
];

// ---------------------------------------------------------------------------
// Deterministic selection.

// FNV-1a. Any stable string hash would do — we just need the same composition to
// land on the same name every time, and a one-topping change to land elsewhere.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

// Everything that should influence the name. Toppings carry their quantity
// counts, so nudging pepperoni from Regular to Extra genuinely re-rolls it.
function compositionKey(p) {
  return [
    p.selected.map((t) => t.id).join(','),
    `x${p.extras}`,
    `l${p.lights}`,
    `c${p.cheeses}`,
    p.sauce,
    p.crustStyle,
    p.bakeLevel,
  ].join('|');
}

// Every name the matching traits can produce, base names first and cross-trait
// combos after. Deduped, and stable in order so the hash indexes consistently.
function candidates(p) {
  const matched = TRAITS.filter((t) => t.when(p)).sort((a, b) => b.weight - a.weight);
  if (matched.length === 0) return [];

  // `balanced` is a genuine fallback, not a peer. It matches ANY 3+ topping
  // pizza, so left in the pool alongside a real character it would let a
  // pure-veg pizza come out as "The Original" — a name that says nothing about
  // what's on it. It only gets a say when nothing else does.
  const characterful = matched.filter((t) => t.id !== 'balanced');
  const ranked = characterful.length > 0 ? characterful : matched;

  // Top few traits only. All of them would drown the pizza's actual character
  // in noise from weak, incidental matches (thin crust, say).
  const top = ranked.slice(0, 3);
  const pool = [];

  for (const t of top) pool.push(...t.names);

  // Cross-pollinate: adjective from one trait, noun from another.
  for (const a of top) {
    for (const b of top) {
      if (a.id === b.id) continue;
      for (const adj of a.adj || []) {
        for (const noun of b.noun || []) {
          pool.push(`${adj} ${noun}`);
        }
      }
    }
  }

  return [...new Set(pool)];
}

// "Pepperoni" / "Pepperoni & Olives"
function joinLabels(labels) {
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`;
}

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function presetSignature(base, toppings) {
  return {
    top: TOPPING_CATALOG.filter((t) => toppings?.[t.id]?.checked).map((t) => t.id).sort(),
    cheese: CHEESE_KEYS.filter((k) => base?.[k]?.checked).sort(),
    sauce: base?.sauce?.sauceType ?? SAUCE_TYPES.NONE,
  };
}
const sameSignature = (a, b) => a.sauce === b.sauce && sameList(a.top, b.top) && sameList(a.cheese, b.cheese);

/**
 * The suggested name for a pizza, WITHOUT the "Pizza" suffix.
 *
 * @param orderState  { base, toppings } — the pizzaHub slice
 * @param opts        { crustStyle, bakeLevel } — from the pizza slice; optional,
 *                    but they unlock the stuffed/charred/thin characters.
 */
export function suggestPizzaName(orderState, opts = {}) {
  const base = orderState?.base;
  const toppings = orderState?.toppings;

  // 1. An exact preset match is a real, human-chosen name. It always wins.
  const sig = presetSignature(base, toppings);
  const preset = PRESET_PIZZAS.find((pz) => sameSignature(presetSignature(pz.config.base, pz.config.toppings), sig));
  if (preset) return preset.name;

  const p = readProfile(base, toppings, opts);

  // 2. Nothing on it at all.
  if (p.total === 0) {
    if (p.cheeses >= 4) return 'Quattro Formaggi';
    if (p.cheeses > 0) return 'Cheese';
    return 'Custom';
  }

  // 3. One or two toppings need no invention — they already read as a name.
  //    "Pepperoni & Olives" is better than anything we'd generate for it.
  if (p.total <= 2) return joinLabels(p.labels);

  // 4. Characterise it.
  const pool = candidates(p);
  if (pool.length === 0) return joinLabels(p.labels);
  return pool[hash(compositionKey(p)) % pool.length];
}

/**
 * The display name: the user's own name if they've set one, otherwise the
 * suggestion — always suffixed with "Pizza" (and never twice).
 */
export function pizzaName(orderState, opts = {}) {
  const custom = opts.customName?.trim();
  const name = custom || suggestPizzaName(orderState, opts);
  return withPizzaSuffix(name);
}

// "The Inferno" -> "The Inferno Pizza", but "Uday's Pizza" stays as it is.
export function withPizzaSuffix(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Custom Pizza';
  return /\bpizza$/i.test(trimmed) ? trimmed : `${trimmed} Pizza`;
}

/**
 * The display name for a PLACED order (order history, confirmation receipt).
 *
 * If the customer named it, that name is what we stored and what we show.
 * Otherwise we regenerate from the order's own ingredients — which is why the
 * generated name is never persisted: it's a pure function of the composition,
 * so it always reproduces, and old orders stay consistent with the current rules.
 *
 * @param order   an OrderResponse from the API
 * @param props   optional pizzaPropsFromOrder(order), if the caller already has it
 */
export function orderPizzaName(order, props) {
  if (order?.pizzaName) return withPizzaSuffix(order.pizzaName);
  if (!props) return 'Custom Pizza';
  return pizzaName(
    { base: props.base, toppings: props.toppings },
    { crustStyle: props.crustStyle, bakeLevel: props.bakeLevel }
  );
}
