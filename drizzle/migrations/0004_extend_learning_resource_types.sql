ALTER TABLE public.learning_resources ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.learning_resources DROP CONSTRAINT IF EXISTS learning_resources_category_check;
ALTER TABLE public.learning_resources DROP CONSTRAINT IF EXISTS learning_resources_url_check;
ALTER TABLE public.learning_resources ADD CONSTRAINT learning_resources_category_check CHECK (category IN ('channel','exercise','youtube','telegram','drive','file','website'));
ALTER TABLE public.learning_resources ADD CONSTRAINT learning_resources_url_check CHECK (url ~* '^https?://[^[:space:]]+$' OR (url = '' AND file_path IS NOT NULL));
CREATE POLICY "Authenticated read resource files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resource-files');
CREATE POLICY "Staff upload resource files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resource-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));
CREATE POLICY "Staff delete resource files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resource-files' AND (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'teacher') AND owner = auth.uid())));