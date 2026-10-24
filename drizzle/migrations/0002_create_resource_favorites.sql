CREATE TABLE public.resource_favorites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 resource_id uuid NOT NULL REFERENCES public.learning_resources(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (user_id, resource_id)
);
GRANT SELECT, INSERT, DELETE ON public.resource_favorites TO authenticated;
GRANT ALL ON public.resource_favorites TO service_role;
ALTER TABLE public.resource_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites" ON public.resource_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own favorites" ON public.resource_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own favorites" ON public.resource_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);