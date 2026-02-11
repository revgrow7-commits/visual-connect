
-- Fix comunicados: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Authenticated users can read comunicados" ON public.comunicados;

CREATE POLICY "Admins can manage comunicados"
ON public.comunicados
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read active comunicados"
ON public.comunicados
FOR SELECT
TO authenticated
USING (status = 'ativo');

-- Fix comunicado_comentarios: same issue
DROP POLICY IF EXISTS "Users can read non-moderated comments" ON public.comunicado_comentarios;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comunicado_comentarios;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comunicado_comentarios;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comunicado_comentarios;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comunicado_comentarios;
DROP POLICY IF EXISTS "Admins can update any comment" ON public.comunicado_comentarios;

CREATE POLICY "Users can read non-moderated comments"
ON public.comunicado_comentarios FOR SELECT TO authenticated
USING (moderado = false OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own comments"
ON public.comunicado_comentarios FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.comunicado_comentarios FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comunicado_comentarios FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.comunicado_comentarios FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any comment"
ON public.comunicado_comentarios FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix comunicado_likes
DROP POLICY IF EXISTS "Users can read all likes" ON public.comunicado_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.comunicado_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON public.comunicado_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.comunicado_likes;

CREATE POLICY "Users can read all likes"
ON public.comunicado_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own likes"
ON public.comunicado_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own likes"
ON public.comunicado_likes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON public.comunicado_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
