import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StageTrackingRecord {
  id: string;
  job_id: string;
  job_code: number | null;
  job_title: string | null;
  customer_name: string | null;
  board_id: string;
  board_name: string;
  stage_id: string;
  stage_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  collaborator_name: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Fetch all stage tracking records for a job */
export function useJobStageTracking(jobId: string | null) {
  return useQuery({
    queryKey: ["stage-tracking", "job", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_tracking")
        .select("*")
        .eq("job_id", jobId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StageTrackingRecord[];
    },
  });
}

/** Fetch active tracking for a board */
export function useBoardStageTracking(boardId: string | null) {
  return useQuery({
    queryKey: ["stage-tracking", "board", boardId],
    enabled: !!boardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_tracking")
        .select("*")
        .eq("board_id", boardId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StageTrackingRecord[];
    },
  });
}

/**
 * When a card enters a new stage:
 * 1. Close (end) the previous active tracking for that job+board
 * 2. Create a new active tracking record for the new stage
 */
export function useTrackStageTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
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
      collaborator_name?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const now = new Date().toISOString();
      const collaborator = payload.collaborator_name || "Operador";

      // 1. Close active tracking for this job+board (previous stage)
      const { data: activeRecords } = await supabase
        .from("stage_tracking")
        .select("id, started_at")
        .eq("job_id", payload.job_id)
        .eq("board_id", payload.board_id)
        .eq("is_active", true);

      if (activeRecords && activeRecords.length > 0) {
        for (const record of activeRecords) {
          const startedAt = new Date(record.started_at).getTime();
          const endedAt = new Date(now).getTime();
          const durationSeconds = Math.round((endedAt - startedAt) / 1000);

          await supabase
            .from("stage_tracking")
            .update({
              is_active: false,
              ended_at: now,
              duration_seconds: durationSeconds,
              updated_at: now,
            })
            .eq("id", record.id);
        }
      }

      // 2. Create new tracking record for the destination stage
      const { error } = await supabase
        .from("stage_tracking")
        .insert({
          job_id: payload.job_id,
          job_code: payload.job_code ?? null,
          job_title: payload.job_title ?? null,
          customer_name: payload.customer_name ?? null,
          board_id: payload.board_id,
          board_name: payload.board_name,
          stage_id: payload.to_stage_id,
          stage_name: payload.to_stage_name,
          started_at: now,
          collaborator_name: collaborator,
          is_active: true,
          metadata: payload.metadata ?? {},
        } as any);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["stage-tracking", "job", vars.job_id] });
      qc.invalidateQueries({ queryKey: ["stage-tracking", "board", vars.board_id] });
    },
  });
}
