import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface JobExtension {
  id: string;
  holdprint_job_id: string;
  prioridade: string;
  tags: string[];
  notas_internas: string | null;
  times_envolvidos: string[];
  arquivado_localmente: boolean;
  arquivado_em: string | null;
  arquivado_por: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobExtension(holdprintJobId: string | null) {
  return useQuery({
    queryKey: ["job-extension", holdprintJobId],
    enabled: !!holdprintJobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_extensions")
        .select("*")
        .eq("holdprint_job_id", holdprintJobId!)
        .maybeSingle();
      if (error) throw error;
      return data as JobExtension | null;
    },
  });
}

export function useJobExtensionsBulk(jobIds: string[]) {
  return useQuery({
    queryKey: ["job-extensions-bulk", jobIds.sort().join(",")],
    enabled: jobIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_extensions")
        .select("*")
        .in("holdprint_job_id", jobIds);
      if (error) throw error;
      const map = new Map<string, JobExtension>();
      for (const ext of (data || []) as JobExtension[]) {
        map.set(ext.holdprint_job_id, ext);
      }
      return map;
    },
  });
}

export function useUpsertJobExtension(holdprintJobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<JobExtension, "prioridade" | "tags" | "notas_internas" | "times_envolvidos" | "arquivado_localmente" | "arquivado_em" | "arquivado_por">>) => {
      const { data: existing } = await supabase
        .from("job_extensions")
        .select("id")
        .eq("holdprint_job_id", holdprintJobId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("job_extensions")
          .update(updates as any)
          .eq("holdprint_job_id", holdprintJobId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_extensions")
          .insert({ holdprint_job_id: holdprintJobId, ...updates } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-extension", holdprintJobId] });
      qc.invalidateQueries({ queryKey: ["job-extensions-bulk"] });
    },
  });
}
