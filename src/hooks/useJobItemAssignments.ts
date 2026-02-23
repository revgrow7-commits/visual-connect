import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobItemAssignment {
  id: string;
  job_id: string;
  item_id: string | null;
  item_name: string;
  collaborator_name: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

export function useItemAssignments(jobId: string | null) {
  return useQuery({
    queryKey: ["job-item-assignments", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("job_item_assignments")
        .select("*")
        .eq("job_id", jobId)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobItemAssignment[];
    },
    enabled: !!jobId,
  });
}

export function useAssignItemsToCollaborators(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      items: Array<{ item_id?: string; item_name: string }>;
      collaborators: string[];
      assigned_by?: string;
    }) => {
      // Deactivate previous assignments for these items
      const itemNames = payload.items.map(i => i.item_name);
      await supabase
        .from("job_item_assignments")
        .update({ is_active: false } as any)
        .eq("job_id", jobId)
        .in("item_name", itemNames);

      // Insert new assignments (one row per item × collaborator)
      const rows = payload.items.flatMap(item =>
        payload.collaborators.map(collab => ({
          job_id: jobId,
          item_id: item.item_id || null,
          item_name: item.item_name,
          collaborator_name: collab,
          assigned_by: payload.assigned_by || "Sistema",
          is_active: true,
        }))
      );

      const { data, error } = await supabase
        .from("job_item_assignments")
        .insert(rows as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-item-assignments", jobId] });
    },
  });
}
