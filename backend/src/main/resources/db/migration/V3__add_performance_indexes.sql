-- orders.user_id: FK column; PostgreSQL does not auto-index foreign keys
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- orders.created_at: used in ORDER BY on every paginated query
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- orders.status: used for filtering and admin status updates
CREATE INDEX idx_orders_status ON orders (status);
