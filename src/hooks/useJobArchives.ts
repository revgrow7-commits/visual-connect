import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useArchivedJobIds() {
  return useQuery({
    queryKey: ["job-archives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_archives")
        .select("job_id");
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.job_id));
    },
    staleTime: 60_000,
  });
}

export function useArchiveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { job_id: string; job_code?: number; job_title?: string; customer_name?: string }) => {
      const { error } = await supabase
        .from("job_archives")
        .insert({
          job_id: params.job_id,
          job_code: params.job_code ?? null,
          job_title: params.job_title ?? null,
          customer_name: params.customer_name ?? null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-archives"] });
      toast({ title: "Job arquivado", description: "O job foi movido para o arquivo." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível arquivar o job.", variant: "destructive" });
    },
  });
}

export function useUnarchiveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("job_archives")
        .delete()
        .eq("job_id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-archives"] });
      toast({ title: "Job desarquivado", description: "O job voltou ao quadro." });
    },
  });
}

export function useDeleteJobFromCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs_cache")
        .delete()
        .eq("holdprint_id", jobId);
      if (error) throw error;
      // Also clean up related local data
      await supabase.from("job_archives").delete().eq("job_id", jobId);
      await supabase.from("job_extensions").delete().eq("holdprint_job_id", jobId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs-kanban"] });
      qc.invalidateQueries({ queryKey: ["job-archives"] });
      toast({ title: "Job excluído", description: "O job foi removido permanentemente." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir o job.", variant: "destructive" });
    },
  });
}
