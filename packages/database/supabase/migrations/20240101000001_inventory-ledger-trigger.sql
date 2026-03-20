-- Movement ledger reconciliation trigger.
-- Applies signed deltas to items.stock for movement_details row changes.

CREATE OR REPLACE FUNCTION movement_type_stock_sign(movement_type text)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE movement_type
    WHEN 'PURCHASE' THEN 1
    WHEN 'RETURN' THEN 1
    WHEN 'EXIT' THEN -1
    WHEN 'WRITEOFF' THEN -1
    ELSE NULL
  END;
END;
$$;

CREATE OR REPLACE FUNCTION reconcile_item_stock_from_movement_detail()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_sign integer;
  new_sign integer;
  old_type text;
  new_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT m.type::text INTO new_type
    FROM movements m
    WHERE m.id = NEW.movement_id;

    new_sign := movement_type_stock_sign(new_type);
    IF new_sign IS NULL THEN
      RAISE EXCEPTION 'Unsupported movement type "%" for movement_id %', new_type, NEW.movement_id;
    END IF;

    UPDATE items
    SET stock = stock + (new_sign * NEW.quantity)
    WHERE id = NEW.item_id;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT m.type::text INTO old_type
    FROM movements m
    WHERE m.id = OLD.movement_id;

    old_sign := movement_type_stock_sign(old_type);
    IF old_sign IS NULL THEN
      RAISE EXCEPTION 'Unsupported movement type "%" for movement_id %', old_type, OLD.movement_id;
    END IF;

    -- Reverse previous applied effect first.
    UPDATE items
    SET stock = stock - (old_sign * OLD.quantity)
    WHERE id = OLD.item_id;

    SELECT m.type::text INTO new_type
    FROM movements m
    WHERE m.id = NEW.movement_id;

    new_sign := movement_type_stock_sign(new_type);
    IF new_sign IS NULL THEN
      RAISE EXCEPTION 'Unsupported movement type "%" for movement_id %', new_type, NEW.movement_id;
    END IF;

    -- Apply the new effect.
    UPDATE items
    SET stock = stock + (new_sign * NEW.quantity)
    WHERE id = NEW.item_id;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT m.type::text INTO old_type
    FROM movements m
    WHERE m.id = OLD.movement_id;

    old_sign := movement_type_stock_sign(old_type);
    IF old_sign IS NULL THEN
      RAISE EXCEPTION 'Unsupported movement type "%" for movement_id %', old_type, OLD.movement_id;
    END IF;

    UPDATE items
    SET stock = stock - (old_sign * OLD.quantity)
    WHERE id = OLD.item_id;

    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'Unsupported trigger operation "%"', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS trg_reconcile_item_stock_from_movement_detail ON movement_details;

CREATE TRIGGER trg_reconcile_item_stock_from_movement_detail
AFTER INSERT OR UPDATE OR DELETE ON movement_details
FOR EACH ROW
EXECUTE FUNCTION reconcile_item_stock_from_movement_detail();
