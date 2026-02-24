import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppLog {
  id: string;
  created_at: string | null;
  customer_id: number | null;
  customer_name: string | null;
  phone: string;
  direction: string;
  message: string;
  origin: string | null;
  origin_id: string | null;
  status: string | null;
  evolution_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  sent_by: string | null;
  unidade: string | null;
}

export function useWhatsAppLogs() {
  return useQuery({
    queryKey: ["whatsapp-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as WhatsAppLog[];
    },
  });
}

export function useSendWhatsAppMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: {
      customer_id?: number;
      customer_name?: string;
      phone: string;
      message: string;
      origin?: string;
      origin_id?: string;
      sent_by?: string;
      unidade?: string;
    }) => {
      // 1. Log the message
      const { data: log, error: logError } = await supabase
        .from("whatsapp_logs")
        .insert({
          ...msg,
          direction: "outbound",
          status: "pending",
        })
        .select()
        .single();
      if (logError) throw logError;

      // 2. Send via Evolution API edge function
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("evolution-api", {
          body: {
            action: "send-text",
            phone: msg.phone,
            message: msg.message,
          },
        });

        if (fnError) throw fnError;

        // Update log with sent status
        await supabase
          .from("whatsapp_logs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            evolution_message_id: result?.messageId || null,
          })
          .eq("id", log.id);
      } catch (err: any) {
        await supabase
          .from("whatsapp_logs")
          .update({
            status: "failed",
            error_message: err?.message || "Erro ao enviar",
          })
          .eq("id", log.id);
        throw err;
      }

      return log;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-logs"] }),
  });
}
