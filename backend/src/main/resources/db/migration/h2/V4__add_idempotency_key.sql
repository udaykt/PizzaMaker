-- H2 (dev/test) does not support partial/filtered indexes (no WHERE clause
-- on CREATE INDEX), unlike PostgreSQL — see postgresql/V4__add_idempotency_key.sql
-- for the real unique constraint used in production. Here we add a plain
-- index for lookup performance only; duplicate-idempotency-key protection in
-- dev/test relies on the in-memory computeIfAbsent check in OrderService.
ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(255);
CREATE INDEX idx_orders_idempotency_key ON orders (idempotency_key);
