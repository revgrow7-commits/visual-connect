
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage cartazes" ON public.cartazes_endomarketing;
DROP POLICY IF EXISTS "Authenticated users can read cartazes" ON public.cartazes_endomarketing;
DROP POLICY IF EXISTS "Users can delete own cartazes" ON public.cartazes_endomarketing;
DROP POLICY IF EXISTS "Users can insert own cartazes" ON public.cartazes_endomarketing;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can manage cartazes"
ON public.cartazes_endomarketing
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read cartazes"
ON public.cartazes_endomarketing
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can delete own cartazes"
ON public.cartazes_endomarketing
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own cartazes"
ON public.cartazes_endomarketing
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);
