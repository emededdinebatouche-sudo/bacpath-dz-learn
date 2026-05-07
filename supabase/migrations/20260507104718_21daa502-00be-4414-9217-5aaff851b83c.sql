ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_subject text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _stream public.stream;
  _teacher_subject text;
BEGIN
  IF NEW.email = 'batoucheimad0@gmail.com' THEN
    _role := 'admin';
  ELSE
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  END IF;

  BEGIN
    _stream := (NEW.raw_user_meta_data->>'stream')::public.stream;
  EXCEPTION WHEN others THEN
    _stream := NULL;
  END;

  _teacher_subject := NULLIF(NEW.raw_user_meta_data->>'teacher_subject', '');

  INSERT INTO public.profiles (id, full_name, stream, teacher_subject)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _stream,
    _teacher_subject
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

CREATE POLICY "Admins update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));