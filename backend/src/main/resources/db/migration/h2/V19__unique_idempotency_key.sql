-- Make idempotency-key deduplication real in dev/test too. The original H2
-- migration (h2/V4) created a plain, non-unique index because H2 lacks the
-- partial-index syntax PostgreSQL uses; deduplication then relied on an
-- in-memory cache in OrderService. That cache has been removed in favour of a
-- database-backed guarantee, so upgrade the index to UNIQUE. H2 (like standard
-- SQL) treats NULLs as distinct in a unique index, so orders placed without an
-- idempotency key are unaffected.
DROP INDEX idx_orders_idempotency_key;
CREATE UNIQUE INDEX idx_orders_idempotency_key ON orders (idempotency_key);
