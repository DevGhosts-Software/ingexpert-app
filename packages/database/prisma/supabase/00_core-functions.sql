BEGIN;

-- Función centralizada para verificar si el usuario actual es ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Eleva privilegios para saltar el RLS interno
SET search_path = public
AS $$
BEGIN
RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = (auth.uid())::text
        AND role = 'ADMIN'::"UserRole"
);
END;
$$;

-- Revocamos el acceso público por seguridad y se lo damos solo a usuarios logueados
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMIT;