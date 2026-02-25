import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logHistory } from "@/hooks/useJobLocalData";

export interface JobTask {
  id: string;
  job_id: string;
  titulo: string;
  descricao: string | null;
  responsavel_id: string | null;
  prioridade: string;
  status: string;
  prazo: string | null;
  parent_task_id: string | null;
  template_origem: string | null;
  created_at: string;
  concluido_em: string | null;
}

export function useJobTasks(jobId: string | null) {
  return useQuery({
    queryKey: ["job-tasks", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_tasks")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as JobTask[];
    },
  });
}

export function useAddJobTask(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      titulo: string;
      descricao?: string;
      responsavel_id?: string;
      prioridade?: string;
      prazo?: string;
      parent_task_id?: string;
      template_origem?: string;
    }) => {
      const { error } = await supabase.from("job_tasks").insert({
        job_id: jobId,
        titulo: task.titulo,
        descricao: task.descricao || null,
        responsavel_id: task.responsavel_id || null,
        prioridade: task.prioridade || "media",
        prazo: task.prazo || null,
        parent_task_id: task.parent_task_id || null,
        template_origem: task.template_origem || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-tasks", jobId] });
      toast({ title: "Tarefa adicionada" });
    },
  });
}

export function useUpdateJobTask(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<JobTask> }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.status === "concluida" && !updates.concluido_em) {
        payload.concluido_em = new Date().toISOString();
      }
      const { error } = await supabase.from("job_tasks").update(payload).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job-tasks", jobId] });
      if (vars.updates.status === "concluida") {
        logHistory(jobId, "task_completed", `Tarefa concluída`);
      }
    },
  });
}

export function useDeleteJobTask(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("job_tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-tasks", jobId] });
      toast({ title: "Tarefa removida" });
    },
  });
}

// Templates
export const TASK_TEMPLATES: Record<string, { titulo: string; prioridade: string }[]> = {
  "Checklist Arte": [
    { titulo: "Receber briefing do cliente", prioridade: "alta" },
    { titulo: "Criar layout inicial", prioridade: "alta" },
    { titulo: "Enviar para aprovação", prioridade: "media" },
    { titulo: "Aplicar correções", prioridade: "media" },
    { titulo: "Finalizar arquivo para produção", prioridade: "alta" },
  ],
  "Checklist Impressão": [
    { titulo: "Conferir arquivo de impressão", prioridade: "alta" },
    { titulo: "Preparar máquina", prioridade: "media" },
    { titulo: "Imprimir prova de cor", prioridade: "alta" },
    { titulo: "Aprovar prova", prioridade: "alta" },
    { titulo: "Executar impressão final", prioridade: "alta" },
    { titulo: "Conferir qualidade", prioridade: "alta" },
  ],
  "Checklist Instalação": [
    { titulo: "Confirmar data com cliente", prioridade: "alta" },
    { titulo: "Preparar materiais de instalação", prioridade: "media" },
    { titulo: "Verificar condições do local", prioridade: "media" },
    { titulo: "Executar instalação", prioridade: "alta" },
    { titulo: "Registrar fotos de antes/depois", prioridade: "media" },
    { titulo: "Colher assinatura de aprovação", prioridade: "alta" },
  ],
};

export function useApplyTemplate(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateName: string) => {
      const tasks = TASK_TEMPLATES[templateName];
      if (!tasks) throw new Error("Template não encontrado");
      for (const task of tasks) {
        const { error } = await supabase.from("job_tasks").insert({
          job_id: jobId,
          titulo: task.titulo,
          prioridade: task.prioridade,
          template_origem: templateName,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, templateName) => {
      qc.invalidateQueries({ queryKey: ["job-tasks", jobId] });
      toast({ title: `Template "${templateName}" aplicado` });
    },
  });
}
