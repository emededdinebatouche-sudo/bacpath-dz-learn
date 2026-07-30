-- 1. Restrict SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2. user_roles: only admins may assign/modify/remove roles
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. qa_questions: restrict raw row access, expose masked view
DROP POLICY IF EXISTS "Anyone authenticated can view qa questions" ON public.qa_questions;
CREATE POLICY "Owners and staff can view qa questions"
  ON public.qa_questions FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  );

CREATE OR REPLACE VIEW public.qa_questions_public AS
  SELECT id, subject, question, answer, answered_by_name, user_name,
         created_at, updated_at,
         (user_id = auth.uid()) AS is_mine
  FROM public.qa_questions;
GRANT SELECT ON public.qa_questions_public TO authenticated;

-- 4. live_questions: same treatment
DROP POLICY IF EXISTS "Anyone authenticated can view questions" ON public.live_questions;
CREATE POLICY "Owners and staff can view live questions"
  ON public.live_questions FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  );

CREATE OR REPLACE VIEW public.live_questions_public AS
  SELECT id, session_id, question, answer, answered_by_name, user_name,
         created_at, updated_at,
         (user_id = auth.uid()) AS is_mine
  FROM public.live_questions;
GRANT SELECT ON public.live_questions_public TO authenticated;