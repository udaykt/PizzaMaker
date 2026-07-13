-- The customer's own name for their pizza ("Uday's Friday Special"), captured at
-- checkout. Nullable on purpose: the vast majority of orders never set one, and
-- for those the name is generated client-side from the composition — deriving it
-- rather than storing it keeps historical orders correct even if the naming rules
-- change later. This column is only for the names a human deliberately chose,
-- which we could never regenerate.
--
-- 40 chars matches MAX_CUSTOM_NAME_LENGTH on the frontend and @Size on OrderRequest.
ALTER TABLE orders ADD COLUMN pizza_name VARCHAR(40);
