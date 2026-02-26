import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MicroBoardAssignment {
  id: string;
  job_id: string;
  job_code: number | null;
  job_title: string | null;
  customer_name: string | null;
  parent_board_id: string;
  parent_stage_id: string | null;
  parent_stage_name: string | null;
  micro_board_id: string;
  micro_stage_id: string | null;
  micro_stage_name: string | null;
  assigned_by: string;
  assigned_at: string;
  completed_at: string | null;
  status: string;
  notified_at: string | null;
  updated_at: string;
}

/** Fetch active micro board assignments for a job */
export function useJobMicroAssignments(jobId: string | null) {
  return useQuery({
    queryKey: ["micro-board-assignments", "job", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_board_assignments")
        .select("*")
        .eq("job_id", jobId!)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MicroBoardAssignment[];
    },
  });
}

/** Fetch all active assignments for a micro board */
export function useMicroBoardCards(microBoardId: string | null) {
  return useQuery({
    queryKey: ["micro-board-assignments", "board", microBoardId],
    enabled: !!microBoardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_board_assignments")
        .select("*")
        .eq("micro_board_id", microBoardId!)
        .eq("status", "active")
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MicroBoardAssignment[];
    },
  });
}

/** Send a job to a micro board */
export function useSendToMicroBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      job_id: string;
      job_code?: number;
      job_title?: string;
      customer_name?: string;
      parent_board_id: string;
      parent_stage_id?: string;
      parent_stage_name?: string;
      micro_board_id: string;
      micro_stage_id?: string;
      micro_stage_name?: string;
      assigned_by?: string;
    }) => {
      const { data, error } = await supabase
        .from("micro_board_assignments")
        .insert({
          job_id: payload.job_id,
          job_code: payload.job_code || null,
          job_title: payload.job_title || null,
          customer_name: payload.customer_name || null,
          parent_board_id: payload.parent_board_id,
          parent_stage_id: payload.parent_stage_id || null,
          parent_stage_name: payload.parent_stage_name || null,
          micro_board_id: payload.micro_board_id,
          micro_stage_id: payload.micro_stage_id || null,
          micro_stage_name: payload.micro_stage_name || null,
          assigned_by: payload.assigned_by || "Sistema",
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["micro-board-assignments", "job", vars.job_id] });
      qc.invalidateQueries({ queryKey: ["micro-board-assignments", "board", vars.micro_board_id] });
    },
  });
}

/** Update micro board assignment stage (drag within micro board) */
export function useUpdateMicroStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignmentId: string; micro_stage_id: string; micro_stage_name: string }) => {
      const { error } = await supabase
        .from("micro_board_assignments")
        .update({ micro_stage_id: payload.micro_stage_id, micro_stage_name: payload.micro_stage_name })
        .eq("id", payload.assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["micro-board-assignments"] });
    },
  });
}

/** Complete a micro board assignment and notify gestor */
export function useCompleteMicroAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignmentId: string; job_id: string; micro_board_id: string }) => {
      const { error } = await supabase
        .from("micro_board_assignments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", payload.assignmentId);
      if (error) throw error;

      // Log in job_history
      await supabase.from("job_history").insert({
        job_id: payload.job_id,
        event_type: "micro_board_completed",
        content: `Sub-processo concluído no micro board`,
        user_name: "Sistema",
        metadata: { micro_board_id: payload.micro_board_id, assignment_id: payload.assignmentId },
      });

      // Fire notification (fire-and-forget)
      supabase.functions.invoke("job-movement-notify", {
        body: {
          action: "micro_board_completed",
          job_id: payload.job_id,
          micro_board_id: payload.micro_board_id,
        },
      }).catch(() => {});
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["micro-board-assignments", "job", vars.job_id] });
      qc.invalidateQueries({ queryKey: ["micro-board-assignments", "board", vars.micro_board_id] });
      toast({ title: "✅ Sub-processo concluído", description: "O gestor foi notificado." });
    },
  });
}
