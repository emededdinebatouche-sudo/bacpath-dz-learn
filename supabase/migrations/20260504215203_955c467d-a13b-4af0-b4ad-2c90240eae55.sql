CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'متوسط',
  content TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 30,
  duration INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view exercises"
ON public.exercises FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and teachers can insert exercises"
ON public.exercises FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  )
);

CREATE POLICY "Admins can update any exercise; teachers their own"
ON public.exercises FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  (public.has_role(auth.uid(), 'teacher') AND auth.uid() = created_by)
);

CREATE POLICY "Admins can delete any exercise; teachers their own"
ON public.exercises FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  (public.has_role(auth.uid(), 'teacher') AND auth.uid() = created_by)
);

CREATE TRIGGER set_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();