-- Allow public update on colaboradores (matching existing public read pattern)
CREATE POLICY "Allow public update colaboradores"
ON public.colaboradores
FOR UPDATE
USING (true)
WITH CHECK (true);
