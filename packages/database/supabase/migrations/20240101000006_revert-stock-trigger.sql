-- Revert inventory ledger trigger and stock column.
-- This migration removes the obsolete trigger function and stock column
-- after the system was refactored to calculate stock on-the-fly from movements.-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_reconcile_item_stock_from_movement_detail ON movement_details;

-- Drop the trigger function
DROP FUNCTION IF EXISTS reconcile_item_stock_from_movement_detail();
DROP FUNCTION IF EXISTS movement_type_stock_sign(text);

-- Drop the stock column from items if it exists
ALTER TABLE items DROP COLUMN IF EXISTS stock;