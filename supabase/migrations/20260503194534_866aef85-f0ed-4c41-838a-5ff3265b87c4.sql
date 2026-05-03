
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _stream public.stream;
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

  INSERT INTO public.profiles (id, full_name, stream)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _stream
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;
