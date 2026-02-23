
CREATE TABLE public.kanban_boards (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#1DB899',
  active boolean NOT NULL DEFAULT true,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  flexfields jsonb NOT NULL DEFAULT '[]'::jsonb,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read boards" ON public.kanban_boards FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert boards" ON public.kanban_boards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update boards" ON public.kanban_boards FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete boards" ON public.kanban_boards FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON public.kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
