-- Replace the binary regular/medium flag with the 3-tier Light/Regular/Extra
-- model used by Domino's, Pizza Hut, and Papa John's online ordering.
ALTER TABLE orders ADD COLUMN pepperoni_quantity VARCHAR(10) NOT NULL DEFAULT 'REGULAR';
ALTER TABLE orders ADD COLUMN sausage_quantity   VARCHAR(10) NOT NULL DEFAULT 'REGULAR';
ALTER TABLE orders ADD COLUMN peppers_quantity    VARCHAR(10) NOT NULL DEFAULT 'REGULAR';
ALTER TABLE orders ADD COLUMN olives_quantity     VARCHAR(10) NOT NULL DEFAULT 'REGULAR';

-- Backfill from the old boolean so existing orders keep their original tier.
UPDATE orders SET pepperoni_quantity = 'EXTRA' WHERE pepperoni_medium = TRUE;
UPDATE orders SET sausage_quantity   = 'EXTRA' WHERE sausage_medium   = TRUE;
UPDATE orders SET peppers_quantity   = 'EXTRA' WHERE peppers_medium   = TRUE;
UPDATE orders SET olives_quantity    = 'EXTRA' WHERE olives_medium    = TRUE;

ALTER TABLE orders DROP COLUMN pepperoni_medium;
ALTER TABLE orders DROP COLUMN sausage_medium;
ALTER TABLE orders DROP COLUMN peppers_medium;
ALTER TABLE orders DROP COLUMN olives_medium;
