
CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all tasks" ON public.tasks
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
