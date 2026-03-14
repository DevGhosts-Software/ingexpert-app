-- Bucket Policies

-- inventory folder
CREATE POLICY "SELECT inventory folder for auth users ijinrq_0" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'inventory'::text));

CREATE POLICY "INSERT inventory folder for admins ijinrq_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'inventory'::text) AND is_admin()) );

CREATE POLICY "UPDATE inventory folder for admins ijinrq_2" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'inventory'::text) AND is_admin()) );

CREATE POLICY "DELETE inventory folder for admins ijinrq_3" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'inventory'::text) AND is_admin()) );


-- uploads folder
CREATE POLICY "SELECT uploads folder for auth users ijinrq_0" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'uploads'::text));

CREATE POLICY "INSERT uploads folder for auth users ijinrq_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'uploads'::text));

CREATE POLICY "UPDATE uploads folder for auth users ijinrq_2" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'uploads'::text));

CREATE POLICY "DELETE uploads folder for auth users ijinrq_3" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'app-data'::text) AND ((storage.foldername(name))[1] = 'uploads'::text));