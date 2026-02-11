import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string | null;
  categoria: string;
  unidade: string;
  fixado: boolean;
  status: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  comentarios_count: number;
  image_url: string | null;
}

interface UseComunicadosOptions {
  categoria?: string;
  unidade?: string;
  limit?: number;
}

async function fetchComunicados({ categoria, unidade, limit }: UseComunicadosOptions): Promise<Comunicado[]> {
  let query = supabase
    .from("comunicados")
    .select("*")
    .eq("status", "ativo")
    .order("fixado", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoria && categoria !== "Todas") query = query.eq("categoria", categoria);
  if (unidade && unidade !== "Todas") query = query.or(`unidade.eq.${unidade},unidade.eq.Todas`);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Comunicado[];
}

export function useComunicados(options: UseComunicadosOptions = {}) {
  const { categoria, unidade, limit } = options;

  return useQuery({
    queryKey: ["comunicados", { categoria, unidade, limit }],
    queryFn: () => fetchComunicados({ categoria, unidade, limit }),
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
