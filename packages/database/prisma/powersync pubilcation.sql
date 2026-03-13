-- Enable replication for offline-sync entities consumed by PowerSync.
-- Prisma model mappings:
--   Item           -> items
--   KitDetail      -> kit_details
--   Movement       -> movements
--   MovementDetail -> movement_details
--   Project        -> projects
--   Staff          -> staff
--   User           -> users
--   WorkArea       -> work_areas
DROP PUBLICATION IF EXISTS powersync;

CREATE PUBLICATION powersync FOR TABLE
  "items",
  "kit_details",
  "movements",
  "movement_details",
  "projects",
  "staff",
  "users",
  "work_areas";

ALTER TABLE items REPLICA IDENTITY FULL;
ALTER TABLE movements REPLICA IDENTITY FULL;
ALTER TABLE projects REPLICA IDENTITY FULL;