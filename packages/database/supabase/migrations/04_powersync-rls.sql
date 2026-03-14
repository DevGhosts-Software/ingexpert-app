-- Final API cutdown RLS policies for direct frontend/PowerSync mutation paths
-- Scope: users, projects, items, kit_details, movements, movement_details
-- Safe to re-run (uses guarded CREATE POLICY blocks).

BEGIN;

-- ------------------------------------------------------------
-- Base grants
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kit_details TO authenticated;
GRANT SELECT, INSERT ON TABLE public.movements TO authenticated;
GRANT SELECT, INSERT ON TABLE public.movement_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_areas TO authenticated;
REVOKE UPDATE, DELETE ON TABLE public.movements FROM authenticated;
REVOKE UPDATE, DELETE ON TABLE public.movement_details FROM authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_areas ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- users policies
-- - self read/update only
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname = 'users_select_own_or_admin'
  ) THEN
    CREATE POLICY users_select_own_or_admin
      ON public.users
      FOR SELECT
                              TO authenticated
                              USING (id = auth.uid()::text OR public.is_admin());
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname = 'users_update_own_or_admin'
  ) THEN
    CREATE POLICY users_update_own_or_admin
      ON public.users
      FOR UPDATE
                              TO authenticated
                              USING (id = auth.uid()::text OR public.is_admin())
          WITH CHECK (id = auth.uid()::text OR public.is_admin());
END IF;
END $$;

-- ------------------------------------------------------------
-- projects policies
-- - authenticated read
-- - admin-only create/update/delete
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
      AND policyname = 'projects_select_authenticated'
  ) THEN
    CREATE POLICY projects_select_authenticated
      ON public.projects
      FOR SELECT
                              TO authenticated
                              USING (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
      AND policyname = 'projects_insert_admin_only'
  ) THEN
    CREATE POLICY projects_insert_admin_only
      ON public.projects
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
      AND policyname = 'projects_update_admin_only'
  ) THEN
    CREATE POLICY projects_update_admin_only
      ON public.projects
      FOR UPDATE
                              TO authenticated
                              USING (public.is_admin())
          WITH CHECK (public.is_admin());
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
      AND policyname = 'projects_delete_admin_only'
  ) THEN
    CREATE POLICY projects_delete_admin_only
      ON public.projects
      FOR DELETE
TO authenticated
      USING (public.is_admin());
END IF;
END $$;

-- ------------------------------------------------------------
-- items policies
-- - authenticated read
-- - authenticated insert/update (supports local-first item + movement sync paths)
-- - admin-only delete (replaces items.remove API protection)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'items'
      AND policyname = 'items_select_authenticated'
  ) THEN
    CREATE POLICY items_select_authenticated
      ON public.items
      FOR SELECT
                              TO authenticated
                              USING (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'items'
      AND policyname = 'items_insert_authenticated'
  ) THEN
    CREATE POLICY items_insert_authenticated
      ON public.items
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'items'
      AND policyname = 'items_update_authenticated'
  ) THEN
    CREATE POLICY items_update_authenticated
      ON public.items
      FOR UPDATE
                              TO authenticated
                              USING (true)
          WITH CHECK (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'items'
      AND policyname = 'items_delete_admin_only'
  ) THEN
    CREATE POLICY items_delete_admin_only
      ON public.items
      FOR DELETE
TO authenticated
      USING (public.is_admin());
END IF;
END $$;

-- ------------------------------------------------------------
-- kit_details policies
-- - authenticated read/write for set/clear component flows
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kit_details'
      AND policyname = 'kit_details_select_authenticated'
  ) THEN
    CREATE POLICY kit_details_select_authenticated
      ON public.kit_details
      FOR SELECT
                              TO authenticated
                              USING (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kit_details'
      AND policyname = 'kit_details_insert_authenticated'
  ) THEN
    CREATE POLICY kit_details_insert_authenticated
      ON public.kit_details
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kit_details'
      AND policyname = 'kit_details_update_authenticated'
  ) THEN
    CREATE POLICY kit_details_update_authenticated
      ON public.kit_details
      FOR UPDATE
                              TO authenticated
                              USING (true)
          WITH CHECK (true);
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kit_details'
      AND policyname = 'kit_details_delete_authenticated'
  ) THEN
    CREATE POLICY kit_details_delete_authenticated
      ON public.kit_details
      FOR DELETE
TO authenticated
      USING (true);
END IF;
END $$;

-- ------------------------------------------------------------
-- staff policies
-- - authenticated CRUD
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'staff'
      AND policyname = 'staff_select_authenticated'
  ) THEN
    CREATE POLICY staff_select_authenticated
      ON public.staff
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'staff'
      AND policyname = 'staff_insert_authenticated'
  ) THEN
    CREATE POLICY staff_insert_authenticated
      ON public.staff
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'staff'
      AND policyname = 'staff_update_authenticated'
  ) THEN
    CREATE POLICY staff_update_authenticated
      ON public.staff
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'staff'
      AND policyname = 'staff_delete_authenticated'
  ) THEN
    CREATE POLICY staff_delete_authenticated
      ON public.staff
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- work_areas policies
-- - authenticated CRUD
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'work_areas'
      AND policyname = 'work_areas_select_authenticated'
  ) THEN
    CREATE POLICY work_areas_select_authenticated
      ON public.work_areas
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'work_areas'
      AND policyname = 'work_areas_insert_authenticated'
  ) THEN
    CREATE POLICY work_areas_insert_authenticated
      ON public.work_areas
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'work_areas'
      AND policyname = 'work_areas_update_authenticated'
  ) THEN
    CREATE POLICY work_areas_update_authenticated
      ON public.work_areas
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'work_areas'
      AND policyname = 'work_areas_delete_authenticated'
  ) THEN
    CREATE POLICY work_areas_delete_authenticated
      ON public.work_areas
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- movements policies
-- - authenticated read
-- - authenticated insert with ownership constraint
-- - immutable ledger (no update/delete policies)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'movements'
      AND policyname = 'powersync_movements_select_authenticated'
  ) THEN
    CREATE POLICY powersync_movements_select_authenticated
      ON public.movements
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'movements'
      AND policyname = 'powersync_movements_insert_authenticated'
  ) THEN
    CREATE POLICY powersync_movements_insert_authenticated
      ON public.movements
      FOR INSERT
      TO authenticated
      WITH CHECK (created_by_id = (auth.uid())::text);
  END IF;
END $$;

-- ------------------------------------------------------------
-- movement_details policies
-- - authenticated read
-- - authenticated insert only if parent movement belongs to caller
-- - immutable ledger (no update/delete policies)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'movement_details'
      AND policyname = 'powersync_movement_details_select_authenticated'
  ) THEN
    CREATE POLICY powersync_movement_details_select_authenticated
      ON public.movement_details
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'movement_details'
      AND policyname = 'powersync_movement_details_insert_authenticated'
  ) THEN
    CREATE POLICY powersync_movement_details_insert_authenticated
      ON public.movement_details
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.movements m
          WHERE m.id = movement_id
            AND m.created_by_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

COMMIT;

-- -------------------------------------------------------------------------
-- Verification and execution notes (run after COMMIT in Supabase SQL Editor)
-- -------------------------------------------------------------------------
-- 1) Confirm function exists and executable by authenticated:
-- SELECT proname, prosecdef
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'is_admin';
--
-- 2) Confirm table grants:
-- SELECT table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee = 'authenticated'
--   AND table_name IN ('users', 'projects', 'items', 'kit_details', 'movements', 'movement_details', 'staff', 'work_areas')
-- ORDER BY table_name, privilege_type;
--
-- 3) Confirm policy inventory:
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('users', 'projects', 'items', 'kit_details', 'movements', 'movement_details', 'staff', 'work_areas')
-- ORDER BY tablename, policyname;
--
-- 4) Behavioral checks (execute via authenticated session/token):
--    - non-admin user can SELECT own user row and UPDATE own profile fields.
--    - non-admin user is denied INSERT/UPDATE/DELETE on projects.
--    - admin user can INSERT/UPDATE/DELETE on projects.
--    - non-admin user is denied DELETE on items.
--    - authenticated user can INSERT/UPDATE/DELETE kit_details rows.
--    - authenticated user can INSERT/UPDATE/DELETE staff rows.
--    - authenticated user can INSERT/UPDATE/DELETE work_areas rows.
--    - authenticated user can INSERT on movements/movement_details for own movement chain.
--    - authenticated user is denied UPDATE/DELETE on movements and movement_details.
--
-- Optional rollback for this change set:
-- DROP POLICY IF EXISTS users_select_own_or_admin ON public.users;
-- DROP POLICY IF EXISTS users_update_own_or_admin ON public.users;
-- DROP POLICY IF EXISTS projects_select_authenticated ON public.projects;
-- DROP POLICY IF EXISTS projects_insert_admin_only ON public.projects;
-- DROP POLICY IF EXISTS projects_update_admin_only ON public.projects;
-- DROP POLICY IF EXISTS projects_delete_admin_only ON public.projects;
-- DROP POLICY IF EXISTS items_select_authenticated ON public.items;
-- DROP POLICY IF EXISTS items_insert_authenticated ON public.items;
-- DROP POLICY IF EXISTS items_update_authenticated ON public.items;
-- DROP POLICY IF EXISTS items_delete_admin_only ON public.items;
-- DROP POLICY IF EXISTS kit_details_select_authenticated ON public.kit_details;
-- DROP POLICY IF EXISTS kit_details_insert_authenticated ON public.kit_details;
-- DROP POLICY IF EXISTS kit_details_update_authenticated ON public.kit_details;
-- DROP POLICY IF EXISTS kit_details_delete_authenticated ON public.kit_details;
-- DROP POLICY IF EXISTS staff_select_authenticated ON public.staff;
-- DROP POLICY IF EXISTS staff_insert_authenticated ON public.staff;
-- DROP POLICY IF EXISTS staff_update_authenticated ON public.staff;
-- DROP POLICY IF EXISTS staff_delete_authenticated ON public.staff;
-- DROP POLICY IF EXISTS work_areas_select_authenticated ON public.work_areas;
-- DROP POLICY IF EXISTS work_areas_insert_authenticated ON public.work_areas;
-- DROP POLICY IF EXISTS work_areas_update_authenticated ON public.work_areas;
-- DROP POLICY IF EXISTS work_areas_delete_authenticated ON public.work_areas;
-- DROP POLICY IF EXISTS powersync_movements_select_authenticated ON public.movements;
-- DROP POLICY IF EXISTS powersync_movements_insert_authenticated ON public.movements;
-- DROP POLICY IF EXISTS powersync_movement_details_select_authenticated ON public.movement_details;
-- DROP POLICY IF EXISTS powersync_movement_details_insert_authenticated ON public.movement_details;
-- DROP FUNCTION IF EXISTS public.is_admin();
