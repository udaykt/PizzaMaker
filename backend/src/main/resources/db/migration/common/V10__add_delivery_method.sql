-- The universal Delivery vs Carryout split every pizza chain's checkout offers.
ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(10) NOT NULL DEFAULT 'DELIVERY';
