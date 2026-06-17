-- Toppings move from a column-per-topping model to a single JSON list of
-- {id, quantity}, so adding a topping no longer needs a schema change. Stored
-- as text (VARCHAR) for portability across H2 (dev) and PostgreSQL (prod); the
-- app serialises/deserialises via ToppingSelectionListConverter.
--
-- The old per-topping boolean/quantity columns are intentionally kept (not
-- dropped) so this change stays reversible and existing data is preserved. A
-- later migration can drop them once the JSON column is proven in production.
ALTER TABLE orders ADD COLUMN toppings VARCHAR(2000) NOT NULL DEFAULT '[]';

-- Backfill existing orders from the per-topping columns into the JSON list.
-- Standard string concatenation + TRIM, valid on both H2 and PostgreSQL.
UPDATE orders SET toppings =
    '[' ||
    TRIM(LEADING ',' FROM (
        CASE WHEN pepperoni THEN ',{"id":"pepperoni","quantity":"' || pepperoni_quantity || '"}' ELSE '' END ||
        CASE WHEN sausage   THEN ',{"id":"sausage","quantity":"'   || sausage_quantity   || '"}' ELSE '' END ||
        CASE WHEN peppers   THEN ',{"id":"peppers","quantity":"'   || peppers_quantity   || '"}' ELSE '' END ||
        CASE WHEN olives    THEN ',{"id":"olives","quantity":"'    || olives_quantity    || '"}' ELSE '' END
    )) ||
    ']';
