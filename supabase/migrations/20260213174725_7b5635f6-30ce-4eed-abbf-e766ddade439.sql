-- Allow anyone to read gateway_users (bypassing RLS on base table for SELECT)
CREATE POLICY "Anyone can read gateway_users"
  ON public.gateway_users
  FOR SELECT
  USING (true);