-- Migration: Convert existing stock adjustment movements to new enum types
-- This migration updates existing movements that used the __stock_adjustment__ destination
-- to use proper STOCK_ADJUSTMENT_IN and STOCK_ADJUSTMENT_OUT movement types.

-- Update positive stock adjustments (previously PURCHASE with __stock_adjustment__ destination)
UPDATE movements 
SET type = 'STOCK_ADJUSTMENT_IN', 
    destination = NULL 
WHERE destination = '__stock_adjustment__' 
  AND type = 'PURCHASE';

-- Update negative stock adjustments (previously WRITEOFF with __stock_adjustment__ destination)
UPDATE movements 
SET type = 'STOCK_ADJUSTMENT_OUT', 
    destination = NULL 
WHERE destination = '__stock_adjustment__' 
  AND type = 'WRITEOFF';

-- Note: The MovementType enum values STOCK_ADJUSTMENT_IN and STOCK_ADJUSTMENT_OUT
-- must be added to the database enum before running this migration.
-- This is handled by Prisma db push or a separate enum migration.