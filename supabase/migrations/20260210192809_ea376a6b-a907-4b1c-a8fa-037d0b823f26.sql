
CREATE TABLE public.cartazes_endomarketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tema text NOT NULL,
  tom text NOT NULL DEFAULT 'motivacional',
  detalhes text,
  spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cartazes_endomarketing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cartazes"
  ON public.cartazes_endomarketing FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cartazes"
  ON public.cartazes_endomarketing FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own cartazes"
  ON public.cartazes_endomarketing FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own cartazes"
  ON public.cartazes_endomarketing FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_cartazes_updated_at
  BEFORE UPDATE ON public.cartazes_endomarketing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
