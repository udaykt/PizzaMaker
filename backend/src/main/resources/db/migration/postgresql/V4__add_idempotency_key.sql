-- Idempotency key for order creation: unique constraint prevents duplicate orders
-- from concurrent requests with the same key, both within a single node and across nodes.
ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(255);
CREATE UNIQUE INDEX idx_orders_idempotency_key ON orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
