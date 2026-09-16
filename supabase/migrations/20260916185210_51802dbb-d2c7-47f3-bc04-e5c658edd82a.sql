CREATE OR REPLACE FUNCTION public.my_points_standing()
RETURNS TABLE (my_points integer, total_students integer, better_than integer, percentile integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH students AS (
    SELECT p.id, p.points
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'::public.app_role
  ),
  me AS (
    SELECT COALESCE((SELECT points FROM students WHERE id = auth.uid()), 0) AS pts
  )
  SELECT
    (SELECT pts FROM me)::integer,
    (SELECT COUNT(*) FROM students)::integer,
    (SELECT COUNT(*) FROM students WHERE points < (SELECT pts FROM me))::integer,
    CASE WHEN (SELECT COUNT(*) FROM students) = 0 THEN 100
         ELSE (100 - ROUND(100.0 * (SELECT COUNT(*) FROM students WHERE points < (SELECT pts FROM me)) / (SELECT COUNT(*) FROM students)))::integer
    END;
$$;

REVOKE ALL ON FUNCTION public.my_points_standing() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_points_standing() TO authenticated;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;