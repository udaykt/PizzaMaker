-- Optimistic locking: two admins updating the same order's status concurrently
-- would otherwise silently clobber each other (last write wins). The version
-- column lets Hibernate reject a stale update with an OptimisticLockException.
ALTER TABLE orders ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Audit authorship: who placed the order and who last touched it. Populated by
-- Spring Data's @CreatedBy/@LastModifiedBy via AuditorAware (the authenticated
-- principal), nullable because system/seed writes have no principal.
ALTER TABLE orders ADD COLUMN created_by VARCHAR(255);
ALTER TABLE orders ADD COLUMN updated_by VARCHAR(255);

-- A price is computed server-side and must never be negative; enforce it at the
-- database so a bug in pricing can't persist a nonsense total.
ALTER TABLE orders ADD CONSTRAINT chk_orders_price_nonneg CHECK (price >= 0);

-- The "my orders" query filters by user_id and sorts by created_at DESC. A
-- single covering composite index serves both in one scan instead of leaning on
-- the two separate single-column indexes from V3.
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);
