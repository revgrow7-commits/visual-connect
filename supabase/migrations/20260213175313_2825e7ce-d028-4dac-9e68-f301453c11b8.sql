
-- Allow public read access to profiles
CREATE POLICY "Anyone can read profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow public read access to user_roles
CREATE POLICY "Anyone can read user_roles"
  ON public.user_roles
  FOR SELECT
  USING (true);
