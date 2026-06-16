-- Real chains (Domino's) only offer "Normal Bake" vs "Well Done" — a binary
-- choice, not the 3-tier Light/Golden/Well-done scale this app invented.
-- Both LIGHT and GOLDEN collapse into the new NORMAL tier; WELL_DONE is kept.
UPDATE orders SET bake_level = 'NORMAL' WHERE bake_level IN ('LIGHT', 'GOLDEN');
ALTER TABLE orders ALTER COLUMN bake_level SET DEFAULT 'NORMAL';
