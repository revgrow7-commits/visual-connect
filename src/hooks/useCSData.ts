import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ===== CS Tickets =====
export function useCSTickets() {
  return useQuery({
    queryKey: ["cs-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_tickets")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCSTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: {
      customer_name: string;
      customer_id?: number;
      job_code?: number;
      job_title?: string;
      category: string;
      priority: string;
      description: string;
      responsible_name?: string;
      unidade?: string;
    }) => {
      // Calculate SLA deadlines based on priority
      const now = new Date();
      const slaHours: Record<string, { response: number; resolution: number }> = {
        critical: { response: 2, resolution: 24 },
        high: { response: 4, resolution: 48 },
        medium: { response: 8, resolution: 120 },
        low: { response: 24, resolution: 240 },
      };
      const sla = slaHours[ticket.priority] || slaHours.medium;
      const responseDeadline = new Date(now.getTime() + sla.response * 3600000);
      const resolutionDeadline = new Date(now.getTime() + sla.resolution * 3600000);

      const { data, error } = await supabase.from("cs_tickets").insert({
        ...ticket,
        sla_response_deadline: responseDeadline.toISOString(),
        sla_resolution_deadline: resolutionDeadline.toISOString(),
        escalation_history: JSON.stringify([{
          level: "N1",
          person: ticket.responsible_name || "Não atribuído",
          date: now.toISOString(),
          reason: "Abertura do ticket",
        }]),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-tickets"] }),
  });
}

// ===== CS Visitas =====
export function useCSVisitas() {
  return useQuery({
    queryKey: ["cs-visitas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_visitas")
        .select("*")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCSVisita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visita: {
      scheduled_date: string;
      customer_name: string;
      customer_id?: number;
      customer_address?: string;
      type: string;
      description: string;
      technician_name?: string;
      job_code?: number;
      complaint_id?: string;
      unidade?: string;
    }) => {
      const { data, error } = await supabase.from("cs_visitas").insert(visita).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-visitas"] }),
  });
}

// ===== CS Oportunidades =====
export function useCSOpportunities() {
  return useQuery({
    queryKey: ["cs-oportunidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_oportunidades")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCSOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opp: {
      type: string;
      customer_name: string;
      customer_id?: number;
      estimated_value?: number;
      description: string;
      context?: string;
      next_step?: string;
      timing?: string;
      responsible_name?: string;
      related_job_code?: number;
      unidade?: string;
    }) => {
      const { data, error } = await supabase.from("cs_oportunidades").insert(opp).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-oportunidades"] }),
  });
}

export function useUpdateCSOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("cs_oportunidades").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-oportunidades"] }),
  });
}

// ===== CS Touchpoints =====
export function useCSTouchpoints() {
  return useQuery({
    queryKey: ["cs-touchpoints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_touchpoints")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCSTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tp: {
      date: string;
      customer_name: string;
      customer_id?: number;
      type: string;
      channel: string;
      trigger_reason?: string;
      responsible_name?: string;
      notes?: string;
      unidade?: string;
    }) => {
      const { data, error } = await supabase.from("cs_touchpoints").insert(tp).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-touchpoints"] }),
  });
}

export function useUpdateCSTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; notes?: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("cs_touchpoints").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-touchpoints"] }),
  });
}
