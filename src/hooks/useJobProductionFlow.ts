import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ProductionFlowStep {
  id: string;
  job_id: string;
  name: string;
  duration_minutes: number;
  status: "pending" | "in_progress" | "done" | "skipped";
  sort_order: number;
  responsible_name: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlowTemplate {
  id: string;
  name: string;
  steps: { name: string; duration_minutes: number }[];
  created_by: string | null;
  created_at: string;
}

// ─── Flow Steps per Job ────────────────────────────────
export function useProductionFlow(jobId: string | null) {
  return useQuery({
    queryKey: ["job-production-flow", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_production_flows")
        .select("*")
        .eq("job_id", jobId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as ProductionFlowStep[];
    },
  });
}

export function useAddFlowStep(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (step: { name: string; duration_minutes: number; sort_order: number; responsible_name?: string }) => {
      const { error } = await supabase.from("job_production_flows").insert({
        job_id: jobId,
        name: step.name,
        duration_minutes: step.duration_minutes,
        sort_order: step.sort_order,
        responsible_name: step.responsible_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-production-flow", jobId] });
      toast({ title: "Etapa adicionada ao fluxo" });
    },
  });
}

export function useUpdateFlowStep(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, updates }: { stepId: string; updates: Partial<Pick<ProductionFlowStep, "name" | "duration_minutes" | "status" | "sort_order" | "responsible_name" | "started_at" | "finished_at">> }) => {
      const { error } = await supabase.from("job_production_flows").update(updates).eq("id", stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-production-flow", jobId] });
    },
  });
}

export function useDeleteFlowStep(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase.from("job_production_flows").delete().eq("id", stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-production-flow", jobId] });
      toast({ title: "Etapa removida" });
    },
  });
}

export function useBulkInsertFlow(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (steps: { name: string; duration_minutes: number; sort_order: number }[]) => {
      // Delete existing first
      await supabase.from("job_production_flows").delete().eq("job_id", jobId);
      if (steps.length > 0) {
        const { error } = await supabase.from("job_production_flows").insert(
          steps.map(s => ({ job_id: jobId, ...s }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-production-flow", jobId] });
      toast({ title: "Fluxo de produção atualizado" });
    },
  });
}

// ─── Templates ─────────────────────────────────────────
export function useFlowTemplates() {
  return useQuery({
    queryKey: ["flow-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_flow_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FlowTemplate[];
    },
  });
}

export function useSaveFlowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: { name: string; steps: { name: string; duration_minutes: number }[] }) => {
      const { error } = await supabase.from("production_flow_templates").insert({
        name: template.name,
        steps: template.steps as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-templates"] });
      toast({ title: "Template salvo" });
    },
  });
}

export function useDeleteFlowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("production_flow_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-templates"] });
      toast({ title: "Template removido" });
    },
  });
}
