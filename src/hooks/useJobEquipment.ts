import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const EQUIPMENT_OPTIONS = [
  "IMPRESSORA SOLVENTE (CHALLENGER)",
  "IMPRESSORA SOLVENTE (AMPLA TARGA)",
  "IMPRESSORA UV FLATBED",
  "PROJETOS - MARCENARIA",
  "PROJETOS - PINTURA",
  "RECORTE MIMAKI",
  "PROJETOS - SERRALHERIA",
  "SOLDA DE LONA",
  "VEICULO RENAULT MASTER",
] as const;

export type EquipmentName = (typeof EQUIPMENT_OPTIONS)[number];

export interface EquipmentAssignment {
  id: string;
  job_id: string;
  job_code: number | null;
  job_title: string | null;
  customer_name: string | null;
  equipment: string;
  assigned_by: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  is_active: boolean;
  created_at: string;
  board_id: string | null;
  board_name: string | null;
  stage_name: string | null;
}

export function useJobEquipment(jobId: string | null) {
  return useQuery({
    queryKey: ["job-equipment", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_equipment_assignments")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EquipmentAssignment[];
    },
    enabled: !!jobId,
  });
}

export function useAssignEquipment(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      equipment: string;
      job_code?: number;
      job_title?: string;
      customer_name?: string;
    }) => {
      // Deactivate any previous active assignment for this equipment on this job
      await supabase
        .from("job_equipment_assignments")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("job_id", jobId)
        .eq("equipment", params.equipment)
        .eq("is_active", true);

      const { data, error } = await supabase
        .from("job_equipment_assignments")
        .insert({
          job_id: jobId,
          job_code: params.job_code ?? null,
          job_title: params.job_title ?? null,
          customer_name: params.customer_name ?? null,
          equipment: params.equipment,
          started_at: new Date().toISOString(),
          is_active: true,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-equipment", jobId] });
    },
  });
}

export function useStopEquipment(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const now = new Date();
      // Get the assignment to calculate duration
      const { data: assignment } = await supabase
        .from("job_equipment_assignments")
        .select("started_at")
        .eq("id", assignmentId)
        .single();

      const startedAt = assignment?.started_at ? new Date(assignment.started_at) : now;
      const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      const { error } = await supabase
        .from("job_equipment_assignments")
        .update({
          is_active: false,
          ended_at: now.toISOString(),
          duration_seconds: durationSeconds,
        } as any)
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-equipment", jobId] });
    },
  });
}
