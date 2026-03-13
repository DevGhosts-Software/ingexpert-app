-- PowerSync upload permission remediation (Supabase/PostgreSQL)
-- Goal: resolve runtime errors like:
--   "permission denied for schema public"
--
-- Safe to re-run (idempotent grants + guarded policy creation).

BEGIN;

-- 1) Schema-level access required before table access can work.
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2) Table privileges for tables written by PowerSync connector.
GRANT SELECT, INSERT, UPDATE ON TABLE public.movements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.movement_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.projects TO authenticated;

-- 3) Sequence privileges for generated/identity columns (future-safe).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4) RLS compatibility (only relevant if table RLS is enabled).
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_details ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'movements'
      AND policyname = 'powersync_movements_insert_authenticated'
  ) THEN
    CREATE POLICY powersync_movements_insert_authenticated
      ON public.movements
      FOR INSERT
      TO authenticated
      WITH CHECK (created_by_id = (auth.uid())::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'movement_details'
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

-- ------------------------------------------------------------------
-- Verification queries (run after COMMIT)
-- ------------------------------------------------------------------

-- Verify schema usage grant exists:
-- SELECT n.nspname AS schema_name, r.rolname AS role_name, has_schema_privilege(r.rolname, n.nspname, 'USAGE') AS has_usage
-- FROM pg_namespace n
-- CROSS JOIN pg_roles r
-- WHERE n.nspname = 'public' AND r.rolname = 'authenticated';

-- Verify table privileges:
-- SELECT table_schema, table_name, grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee = 'authenticated'
--   AND table_name IN ('movements', 'movement_details', 'items', 'projects')
-- ORDER BY table_name, privilege_type;

-- Verify policy presence:
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('movements', 'movement_details')
--   AND policyname IN (
--     'powersync_movements_insert_authenticated',
--     'powersync_movement_details_insert_authenticated'
--   );
