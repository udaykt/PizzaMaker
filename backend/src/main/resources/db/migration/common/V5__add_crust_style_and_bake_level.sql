-- Crust style and bake level are visual/menu customizations on top of pizza
-- size. Nullable with sensible defaults so existing rows stay valid.
ALTER TABLE orders ADD COLUMN crust_style VARCHAR(20) NOT NULL DEFAULT 'classic';
ALTER TABLE orders ADD COLUMN bake_level VARCHAR(20) NOT NULL DEFAULT 'golden';
