-- The per-topping boolean/quantity columns were superseded by the single JSON
-- toppings list in V12 (see ToppingSelectionListConverter). V12 deliberately
-- kept them so the change stayed reversible; now that the JSON column has been
-- the source of truth in production, drop the dead columns so the live schema
-- matches the Order entity and no stale data lingers.
ALTER TABLE orders DROP COLUMN pepperoni;
ALTER TABLE orders DROP COLUMN sausage;
ALTER TABLE orders DROP COLUMN peppers;
ALTER TABLE orders DROP COLUMN olives;
ALTER TABLE orders DROP COLUMN pepperoni_quantity;
ALTER TABLE orders DROP COLUMN sausage_quantity;
ALTER TABLE orders DROP COLUMN peppers_quantity;
ALTER TABLE orders DROP COLUMN olives_quantity;
