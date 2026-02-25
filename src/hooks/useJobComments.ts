import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface JobComment {
  id: string;
  holdprint_job_id: string;
  autor_nome: string;
  autor_tipo: string;
  mensagem: string;
  mencoes: string[];
  anexos: unknown[];
  editado: boolean;
  editado_em: string | null;
  created_at: string;
}

export function useJobComments(holdprintJobId: string | null) {
  return useQuery({
    queryKey: ["job-comments", holdprintJobId],
    enabled: !!holdprintJobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_comments")
        .select("*")
        .eq("holdprint_job_id", holdprintJobId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobComment[];
    },
  });
}

export function useAddJobComment(holdprintJobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mensagem: string; autor_nome?: string; autor_tipo?: string; mencoes?: string[] }) => {
      const { error } = await supabase.from("job_comments").insert({
        holdprint_job_id: holdprintJobId,
        mensagem: input.mensagem,
        autor_nome: input.autor_nome || "Usuário",
        autor_tipo: input.autor_tipo || "humano",
        mencoes: input.mencoes || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-comments", holdprintJobId] });
    },
  });
}

export function useDeleteJobComment(holdprintJobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("job_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-comments", holdprintJobId] });
    },
  });
}
