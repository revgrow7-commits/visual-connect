
-- Likes table (prevents double voting)
CREATE TABLE public.comunicado_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comunicado_id, user_id)
);

ALTER TABLE public.comunicado_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all likes" ON public.comunicado_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.comunicado_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own likes" ON public.comunicado_likes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.comunicado_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments table with cascading (parent_id)
CREATE TABLE public.comunicado_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comunicado_comentarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  autor_nome text NOT NULL DEFAULT '',
  conteudo text NOT NULL,
  moderado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicado_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read non-moderated comments" ON public.comunicado_comentarios
  FOR SELECT USING (moderado = false OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own comments" ON public.comunicado_comentarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comunicado_comentarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any comment" ON public.comunicado_comentarios
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own comments" ON public.comunicado_comentarios
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment" ON public.comunicado_comentarios
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on comments
CREATE TRIGGER update_comunicado_comentarios_updated_at
  BEFORE UPDATE ON public.comunicado_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_likes_comunicado ON public.comunicado_likes(comunicado_id);
CREATE INDEX idx_likes_user ON public.comunicado_likes(user_id);
CREATE INDEX idx_comentarios_comunicado ON public.comunicado_comentarios(comunicado_id);
CREATE INDEX idx_comentarios_parent ON public.comunicado_comentarios(parent_id);

-- Add like/dislike/comment counts cache to comunicados for quick reads
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS dislikes_count int NOT NULL DEFAULT 0;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS comentarios_count int NOT NULL DEFAULT 0;
