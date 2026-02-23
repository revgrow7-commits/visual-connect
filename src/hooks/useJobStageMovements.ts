import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StageMovement {
  job_id: string;
  job_code?: number;
  job_title?: string;
  customer_name?: string;
  board_id: string;
  board_name: string;
  from_stage_id?: string;
  from_stage_name?: string;
  to_stage_id: string;
  to_stage_name: string;
  moved_by?: string;
  movement_type?: "drag_drop" | "assignment" | "stage_change";
  metadata?: Record<string, unknown>;
}

export function useRecordMovement() {
  return useMutation({
    mutationFn: async (movement: StageMovement) => {
      const row = {
        job_id: movement.job_id,
        job_code: movement.job_code ?? null,
        job_title: movement.job_title ?? null,
        customer_name: movement.customer_name ?? null,
        board_id: movement.board_id,
        board_name: movement.board_name,
        from_stage_id: movement.from_stage_id ?? null,
        from_stage_name: movement.from_stage_name ?? null,
        to_stage_id: movement.to_stage_id,
        to_stage_name: movement.to_stage_name,
        moved_by: movement.moved_by ?? "Sistema",
        movement_type: movement.movement_type ?? "drag_drop",
        metadata: movement.metadata ?? {},
      } as any;

      const { data, error } = await supabase
        .from("job_stage_movements")
        .insert([row])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useJobMovements(jobId?: string) {
  return useQuery({
    queryKey: ["job-stage-movements", jobId],
    queryFn: async () => {
      let query = supabase
        .from("job_stage_movements")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobId) query = query.eq("job_id", jobId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });
}
