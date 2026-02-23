import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────
export interface LocalJobItem {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit: string;
  format: string | null;
  unit_value: number;
  total_value: number;
  checked: boolean;
  observation: string | null;
  flexfields: Record<string, unknown>;
  created_at: string;
}

export interface LocalChecklist {
  id: string;
  job_id: string;
  title: string;
  checked: boolean;
  responsible_name: string | null;
  sort_order: number;
}

export interface LocalTimeEntry {
  id: string;
  job_id: string;
  user_name: string;
  description: string | null;
  minutes: number;
  entry_date: string;
  created_at: string;
}

export interface LocalJobMaterial {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  supplier: string | null;
  observation: string | null;
}

export interface LocalHistoryEvent {
  id: string;
  job_id: string;
  event_type: string;
  user_name: string;
  content: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
}

// ─── Items ──────────────────────────────────────────────
export function useJobItems(jobId: string | null) {
  return useQuery({
    queryKey: ["job-items", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_items")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as LocalJobItem[];
    },
  });
}

export function useAddJobItem(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<LocalJobItem, "id" | "job_id" | "created_at" | "flexfields"> & { flexfields?: Record<string, unknown> }) => {
      const { error } = await supabase.from("job_items").insert([{
        job_id: jobId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        format: item.format,
        unit_value: item.unit_value,
        total_value: item.total_value,
        checked: item.checked,
        observation: item.observation,
        flexfields: (item.flexfields || {}) as any,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-items", jobId] });
      logHistory(jobId, "item_checked", "Novo item adicionado");
      toast({ title: "Item adicionado" });
    },
  });
}

export function useToggleJobItem(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const { error } = await supabase.from("job_items").update({ checked }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-items", jobId] });
    },
  });
}

export function useDeleteJobItem(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("job_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-items", jobId] });
      toast({ title: "Item removido" });
    },
  });
}

// ─── Checklist ──────────────────────────────────────────
export function useJobChecklist(jobId: string | null) {
  return useQuery({
    queryKey: ["job-checklist", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_checklist")
        .select("*")
        .eq("job_id", jobId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as LocalChecklist[];
    },
  });
}

export function useAddChecklistTask(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data: existing } = await supabase
        .from("job_checklist")
        .select("sort_order")
        .eq("job_id", jobId)
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
      const { error } = await supabase.from("job_checklist").insert({ job_id: jobId, title, sort_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-checklist", jobId] }),
  });
}

export function useToggleChecklist(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, checked }: { taskId: string; checked: boolean }) => {
      const { error } = await supabase.from("job_checklist").update({ checked }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-checklist", jobId] }),
  });
}

export function useDeleteChecklist(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("job_checklist").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-checklist", jobId] }),
  });
}

// ─── Time Entries ───────────────────────────────────────
export function useJobTimeEntries(jobId: string | null) {
  return useQuery({
    queryKey: ["job-time-entries", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_time_entries")
        .select("*")
        .eq("job_id", jobId!)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return (data || []) as LocalTimeEntry[];
    },
  });
}

export function useAddTimeEntry(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { user_name: string; description: string; minutes: number; entry_date: string }) => {
      const { error } = await supabase.from("job_time_entries").insert({ job_id: jobId, ...entry });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-time-entries", jobId] });
      logHistory(jobId, "time_logged", "Tempo registrado");
      toast({ title: "Tempo registrado" });
    },
  });
}

export function useDeleteTimeEntry(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from("job_time_entries").delete().eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-time-entries", jobId] });
      toast({ title: "Lançamento removido" });
    },
  });
}

// ─── Materials ──────────────────────────────────────────
export function useJobMaterials(jobId: string | null) {
  return useQuery({
    queryKey: ["job-materials", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_materials")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as LocalJobMaterial[];
    },
  });
}

export function useAddJobMaterial(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mat: Omit<LocalJobMaterial, "id" | "job_id">) => {
      const { error } = await supabase.from("job_materials").insert({ job_id: jobId, ...mat });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-materials", jobId] });
      toast({ title: "Material adicionado" });
    },
  });
}

export function useDeleteJobMaterial(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matId: string) => {
      const { error } = await supabase.from("job_materials").delete().eq("id", matId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-materials", jobId] });
      toast({ title: "Material removido" });
    },
  });
}

// ─── History ────────────────────────────────────────────
export function useJobHistory(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["job-history", jobId],
    enabled: !!jobId && enabled,
    refetchInterval: enabled ? 30_000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_history")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as LocalHistoryEvent[];
    },
  });
}

export function useAddComment(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, userName }: { content: string; userName: string }) => {
      const { error } = await supabase.from("job_history").insert({
        job_id: jobId,
        event_type: "comment",
        user_name: userName,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-history", jobId] });
    },
  });
}

// ─── Helper to log history events ──────────────────────
async function logHistory(
  jobId: string,
  eventType: string,
  content: string,
  metadata?: Record<string, string>
) {
  await supabase.from("job_history").insert({
    job_id: jobId,
    event_type: eventType,
    user_name: "Sistema",
    content,
    metadata: metadata || null,
  });
}

export { logHistory };
