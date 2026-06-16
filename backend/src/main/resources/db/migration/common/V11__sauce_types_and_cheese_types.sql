-- Sauce becomes a real choice (Robust Tomato/Marinara/Garlic Parmesan/
-- Alfredo/BBQ/None) instead of a flat boolean, matching Domino's sauce menu.
ALTER TABLE orders ADD COLUMN sauce_type VARCHAR(20) NOT NULL DEFAULT 'NONE';
UPDATE orders SET sauce_type = 'ROBUST_TOMATO' WHERE sauce = TRUE;
ALTER TABLE orders DROP COLUMN sauce;

-- Cheese types are independent (mozzarella + feta can coexist), replacing
-- the old ambiguous flat "cheese" boolean. Existing "cheese=true" orders are
-- interpreted as mozzarella, the closest real equivalent.
ALTER TABLE orders ADD COLUMN provolone BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN feta BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN vegan_cheese BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE orders SET mozzarella = TRUE WHERE cheese = TRUE AND mozzarella = FALSE;
ALTER TABLE orders DROP COLUMN cheese;
