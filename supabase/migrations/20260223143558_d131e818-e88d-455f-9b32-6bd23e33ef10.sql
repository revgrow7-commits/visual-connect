-- Allow public read access to colaboradores for the gateway-authenticated app
CREATE POLICY "Allow public read colaboradores"
ON public.colaboradores
FOR SELECT
USING (true);