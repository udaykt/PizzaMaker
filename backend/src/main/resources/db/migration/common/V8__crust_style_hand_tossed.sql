-- "Classic" wasn't real terminology — every major chain (Domino's, Pizza Hut)
-- calls their standard middle-ground crust "Hand Tossed".
UPDATE orders SET crust_style = 'HAND_TOSSED' WHERE crust_style = 'CLASSIC';
ALTER TABLE orders ALTER COLUMN crust_style SET DEFAULT 'HAND_TOSSED';
