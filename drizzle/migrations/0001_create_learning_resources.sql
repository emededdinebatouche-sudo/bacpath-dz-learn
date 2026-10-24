CREATE TABLE public.learning_resources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_by uuid NOT NULL,
 title text NOT NULL,
 subject text NOT NULL DEFAULT '',
 category text NOT NULL DEFAULT 'channel' CHECK (category IN ('channel', 'exercise')),
 url text NOT NULL CHECK (url ~* '^https?://[^[:space:]]+$'),
 description text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_resources TO authenticated;
GRANT ALL ON public.learning_resources TO service_role;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read resources" ON public.learning_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff create resources" ON public.learning_resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));
CREATE POLICY "Staff update resources" ON public.learning_resources FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'teacher') AND auth.uid() = created_by)) WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'teacher') AND auth.uid() = created_by));
CREATE POLICY "Staff delete resources" ON public.learning_resources FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'teacher') AND auth.uid() = created_by));
CREATE TRIGGER learning_resources_updated_at BEFORE UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();