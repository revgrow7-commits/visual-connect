-- Allow public read access to banco_horas (import is admin-only via edge function)
CREATE POLICY "Anyone can read banco_horas"
ON public.banco_horas
FOR SELECT
USING (true);
