-- Enable replication for offline-sync entities consumed by PowerSync.
-- Prisma model mappings:
--   Item           -> items
--   Movement       -> movements
--   MovementDetail -> movement_details
--   Project        -> projects
DROP PUBLICATION IF EXISTS powersync;

CREATE PUBLICATION powersync FOR TABLE
  "items",
  "movements",
  "movement_details",
  "projects";
