-- Allow public (anon) read access to holdprint_cache
-- This is non-sensitive cached data from Holdprint API
CREATE POLICY "Anyone can read holdprint_cache"
ON public.holdprint_cache
FOR SELECT
USING (true);

-- Drop the old restrictive policy that required authentication
DROP POLICY IF EXISTS "Authenticated can read holdprint_cache" ON public.holdprint_cache;
