import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamPipelineEntry {
  id: string;
  holdprint_job_id: string;
  holdprint_item_id: string;
  etapa: string;
  sub_status: string;
  responsavel_nome: string | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  pendencia_descricao: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useTeamPipeline(holdprintJobId: string | null) {
  return useQuery({
    queryKey: ["team-pipeline", holdprintJobId],
    enabled: !!holdprintJobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_pipeline_status")
        .select("*")
        .eq("holdprint_job_id", holdprintJobId!)
        .order("etapa");
      if (error) throw error;
      return (data || []) as TeamPipelineEntry[];
    },
  });
}

export function useUpsertPipelineStatus(holdprintJobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      holdprint_item_id: string;
      etapa: string;
      sub_status: string;
      responsavel_nome?: string;
      pendencia_descricao?: string;
    }) => {
      const { data: existing } = await supabase
        .from("team_pipeline_status")
        .select("id")
        .eq("holdprint_job_id", holdprintJobId)
        .eq("holdprint_item_id", entry.holdprint_item_id)
        .eq("etapa", entry.etapa)
        .maybeSingle();

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        sub_status: entry.sub_status,
        updated_by: entry.responsavel_nome || "Sistema",
      };

      if (entry.sub_status === "fazendo" && !existing) {
        updates.iniciado_em = now;
      }
      if (entry.sub_status === "concluido") {
        updates.concluido_em = now;
      }
      if (entry.pendencia_descricao) {
        updates.pendencia_descricao = entry.pendencia_descricao;
      }
      if (entry.responsavel_nome) {
        updates.responsavel_nome = entry.responsavel_nome;
      }

      if (existing) {
        const { error } = await supabase
          .from("team_pipeline_status")
          .update(updates as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("team_pipeline_status")
          .insert({
            holdprint_job_id: holdprintJobId,
            holdprint_item_id: entry.holdprint_item_id,
            etapa: entry.etapa,
            ...updates,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-pipeline", holdprintJobId] });
    },
  });
}
