-- The order total was never persisted — only computed live in the frontend
-- builder and discarded. Store it server-side so receipts, order history,
-- and admin reporting can show what was actually charged.
ALTER TABLE orders ADD COLUMN price NUMERIC(10,2) NOT NULL DEFAULT 0;
