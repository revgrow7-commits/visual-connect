import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface JobLink {
  id: string;
  job_id: string;
  url: string;
  display_text: string | null;
  created_at: string;
}

export function useJobLinks(jobId: string | null) {
  return useQuery({
    queryKey: ["job-links", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_links")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobLink[];
    },
  });
}

export function useAddJobLink(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: { url: string; display_text?: string }) => {
      const { error } = await supabase.from("job_links").insert({
        job_id: jobId,
        url: link.url,
        display_text: link.display_text || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-links", jobId] });
      toast({ title: "Link adicionado" });
    },
  });
}

export function useDeleteJobLink(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("job_links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-links", jobId] });
      toast({ title: "Link removido" });
    },
  });
}
