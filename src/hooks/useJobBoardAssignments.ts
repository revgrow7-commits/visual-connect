import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobBoardAssignment {
  id: string;
  job_id: string;
  job_code: number | null;
  job_title: string | null;
  customer_name: string | null;
  item_id: string | null;
  item_name: string | null;
  board_id: string;
  board_name: string;
  stage_id: string | null;
  stage_name: string | null;
  assigned_by: string;
  assigned_at: string;
  updated_at: string;
  is_active: boolean;
}

/** Fetch all active assignments for a specific board */
export function useBoardAssignments(boardId: string | null) {
  return useQuery({
    queryKey: ["board-assignments", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("job_board_assignments")
        .select("*")
        .eq("board_id", boardId)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobBoardAssignment[];
    },
    enabled: !!boardId,
  });
}

/** Fetch all active assignments for a specific job */
export function useJobAssignments(jobId: string | null) {
  return useQuery({
    queryKey: ["job-assignments", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("job_board_assignments")
        .select("*")
        .eq("job_id", jobId)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobBoardAssignment[];
    },
    enabled: !!jobId,
  });
}

/** Create board assignments for items */
export function useAssignToBoard(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      items: Array<{ item_id?: string; item_name: string }>;
      job_code?: number;
      job_title?: string;
      customer_name?: string;
      board_id: string;
      board_name: string;
      stage_id?: string;
      stage_name?: string;
      assigned_by?: string;
    }) => {
      // Deactivate previous assignments for these items on ANY board
      const itemNames = payload.items.map(i => i.item_name);
      await supabase
        .from("job_board_assignments")
        .update({ is_active: false })
        .eq("job_id", jobId)
        .in("item_name", itemNames);

      // Insert new assignments
      const rows = payload.items.map(item => ({
        job_id: jobId,
        job_code: payload.job_code || null,
        job_title: payload.job_title || null,
        customer_name: payload.customer_name || null,
        item_id: item.item_id || null,
        item_name: item.item_name,
        board_id: payload.board_id,
        board_name: payload.board_name,
        stage_id: payload.stage_id || null,
        stage_name: payload.stage_name || null,
        assigned_by: payload.assigned_by || "Sistema",
        is_active: true,
      }));

      const { data, error } = await supabase
        .from("job_board_assignments")
        .insert(rows)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-assignments", jobId] });
      qc.invalidateQueries({ queryKey: ["board-assignments"] });
    },
  });
}

/** Update stage of an assignment (when moving within board) */
export function useUpdateAssignmentStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignmentId: string; stage_id: string; stage_name: string }) => {
      const { error } = await supabase
        .from("job_board_assignments")
        .update({ stage_id: payload.stage_id, stage_name: payload.stage_name })
        .eq("id", payload.assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board-assignments"] });
      qc.invalidateQueries({ queryKey: ["job-assignments"] });
    },
  });
}
