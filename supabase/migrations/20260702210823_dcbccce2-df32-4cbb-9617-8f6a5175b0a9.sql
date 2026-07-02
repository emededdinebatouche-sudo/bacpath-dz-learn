
-- past exams table
CREATE TABLE public.past_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  branch text NOT NULL,
  subject text NOT NULL,
  title text,
  exam_path text NOT NULL,
  solution_path text,
  points int NOT NULL DEFAULT 50,
  duration int NOT NULL DEFAULT 120,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.past_exams TO authenticated;
GRANT ALL ON public.past_exams TO service_role;

ALTER TABLE public.past_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can read past exams"
  ON public.past_exams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manages past exams"
  ON public.past_exams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER past_exams_updated_at
  BEFORE UPDATE ON public.past_exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for past-exams bucket
CREATE POLICY "Authed can read past-exams files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'past-exams');

CREATE POLICY "Admin can upload past-exams files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'past-exams' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update past-exams files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'past-exams' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete past-exams files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'past-exams' AND public.has_role(auth.uid(), 'admin'));
