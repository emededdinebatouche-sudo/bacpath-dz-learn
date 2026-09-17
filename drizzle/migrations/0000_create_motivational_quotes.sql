CREATE TABLE public.motivational_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.motivational_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivational_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivational_quotes TO authenticated;

ALTER TABLE public.motivational_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active motivational quotes"
ON public.motivational_quotes
FOR SELECT
TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert motivational quotes"
ON public.motivational_quotes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update motivational quotes"
ON public.motivational_quotes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete motivational quotes"
ON public.motivational_quotes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_motivational_quotes_updated_at
BEFORE UPDATE ON public.motivational_quotes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();