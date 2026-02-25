import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  destinatario_id: string;
  remetente_tipo: string;
  mensagem: string;
  prioridade: string;
  job_id: string | null;
  lida: boolean;
  created_at: string;
}

export function useJobNotifications(jobId: string | null) {
  return useQuery({
    queryKey: ["job-notifications", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notification[];
    },
  });
}

export function useUnreadCount(jobId: string | null) {
  const { data } = useJobNotifications(jobId);
  return data?.filter(n => !n.lida).length || 0;
}

export function useMarkAsRead(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-notifications", jobId] });
    },
  });
}
