CREATE TABLE public.past_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.past_exams(id) ON DELETE CASCADE,
  correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, exam_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.past_exam_attempts TO authenticated;
GRANT ALL ON public.past_exam_attempts TO service_role;
ALTER TABLE public.past_exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attempts" ON public.past_exam_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.past_exam_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON public.past_exam_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own attempts" ON public.past_exam_attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);