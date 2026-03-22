-- Fix user role permissions for projects and items RLS policies
-- Scope: Allow user role to INSERT projects and items (UPDATE/DELETE remain admin-only)
-- Safe to re-run (uses guarded CREATE POLICY blocks).

BEGIN;

-- ------------------------------------------------------------
-- projects policies - allow authenticated INSERT (was admin-only)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
      AND policyname = 'projects_insert_authenticated'
  ) THEN
    CREATE POLICY projects_insert_authenticated
      ON public.projects
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Drop the old admin-only policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
      AND policyname = 'projects_insert_admin_only'
  ) THEN
    DROP POLICY projects_insert_admin_only ON public.projects;
  END IF;
END $$;

-- ------------------------------------------------------------
-- items policies - add admin-only UPDATE (INSERT already allows authenticated)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'items'
      AND policyname = 'items_update_admin_only'
  ) THEN
    CREATE POLICY items_update_admin_only
      ON public.items
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- items_delete_admin_only remains as-is (admin-only)
-- items_insert_authenticated remains as-is (already allows authenticated INSERT)

COMMIT;

-- -------------------------------------------------------------------------
-- Verification queries (run after COMMIT in Supabase SQL Editor)
-- -------------------------------------------------------------------------
-- 1) Confirm policy inventory for projects and items:
-- SELECT tablename, policyname, cmd, roles, permissive
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('projects', 'items')
-- ORDER BY tablename, policyname;

-- 2) Test authenticated user INSERT on projects (as non-admin user):
-- INSERT INTO public.projects (id, name, description, created_by_id)
-- VALUES (gen_random_uuid(), 'Test Project', 'Test', auth.uid()::text)
-- RETURNING id;

-- 3) Test admin-only UPDATE on items (as non-admin user - should fail):
-- UPDATE public.items SET name = 'Hacked' WHERE id = 'some-item-id';
-- Expected: permission denied for table "items"

-- 4) Test admin-only DELETE on items (as non-admin user - should fail):
-- DELETE FROM public.items WHERE id = 'some-item-id';
-- Expected: permission denied for table "items"

-- Optional rollback:
-- DROP POLICY IF EXISTS projects_insert_authenticated ON public.projects;
-- DROP POLICY IF EXISTS items_update_admin_only ON public.projects;
-- CREATE POLICY projects_insert_admin_only ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
