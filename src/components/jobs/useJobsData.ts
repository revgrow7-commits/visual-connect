import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HoldprintJob } from "@/hooks/useCSHoldprintData";
import type { Job, Stage, JobsByStage, JobsFilters, StageConfig } from "./types";
import { DEFAULT_STAGES } from "./types";
import type { Board, BoardStage } from "@/stores/boardsStore";

// Map Holdprint production step names to our stage IDs
const STEP_TO_STAGE: Record<string, Stage> = {
  "revisão comercial": "revisao_comercial",
  "aguardando aprovação": "revisao_comercial",
  "aprovação": "aprovacao_financeira",
  "aprovação financeira": "aprovacao_financeira",
  "orçamento": "revisao_comercial",
  "aguardando": "revisao_comercial",
  "programação": "programacao",
  "planejamento": "programacao",
  "arte final": "arte_final",
  "fechamento": "arte_final",
  "arte": "arte_final",
  "verificação": "arte_final",
  "revisão de arte": "arte_final",
  "criação": "arte_final",
  "design": "arte_final",
  "impressão": "impressao",
  "produção": "impressao",
  "nina cut": "impressao",
  "corte": "impressao",
  "laminação": "impressao",
  "acabamento": "acabamento",
  "montagem": "acabamento",
  "expedição": "expedicao",
  "entrega": "expedicao",
  "finalizado": "expedicao",
};

function mapStage(stepName: string, job: HoldprintJob): Stage {
  const lower = (stepName || "").toLowerCase().trim();
  if (STEP_TO_STAGE[lower]) return STEP_TO_STAGE[lower];
  for (const [key, stageId] of Object.entries(STEP_TO_STAGE)) {
    if (lower.includes(key) || key.includes(lower)) return stageId;
  }
  const status = String(job.productionStatus || job.status || "").toLowerCase();
  if (job.isFinalized || status.includes("final")) return "expedicao";
  if (status.includes("progress")) return "impressao";
  return "revisao_comercial";
}

function transformJob(raw: HoldprintJob): Job {
  const stepName = String(raw.currentProductionStepName || "");
  const stage = mapStage(stepName, raw);
  const status = raw.isFinalized ? "fechado" : "aberto";
  const customerName = raw.customerName || raw.customer?.name || raw.customer?.fantasyName || "Sem cliente";
  const responsible = raw.responsibleName
    ? [{ id: "r1", name: String(raw.responsibleName) }]
    : [];

  return {
    id: String(raw.id),
    code: raw.code,
    client_name: customerName,
    client_id: raw.customer?.id,
    description: raw.title || raw.description || "",
    stage,
    production_type: stepName || "Produção Completa",
    status: status as Job["status"],
    responsible,
    value: raw.totalPrice || 0,
    delivery_date: raw.deliveryNeeded || raw.deliveryExpected || raw.deliveryDate || "",
    created_at: raw.createdAt || raw.creationTime || "",
    urgent: false,
    progress_percent: raw.progressPercentage || 0,
    time_spent_minutes: 0,
    items_count: 0,
    items_done: 0,
    _unit_key: raw._unit_key,
    _raw: raw as Record<string, unknown>,
  };
}

/** Convert BoardStage[] to StageConfig[] for grouping */
function boardStagesToConfigs(stages: BoardStage[]): StageConfig[] {
  return stages.map((s, i) => ({
    id: s.id as Stage,
    name: s.name,
    order: i + 1,
    color: s.color,
  }));
}

export function useJobsData(filters?: JobsFilters, activeBoard?: Board | null) {
  return useQuery({
    queryKey: ["holdprint-jobs-kanban", filters, activeBoard?.id],
    queryFn: async () => {
      // 1. Fetch jobs from ERP (GET — readonly)
      const { data, error } = await supabase.functions.invoke("cs-holdprint-data", {
        body: {
          endpoints: ["jobs"],
          startDate: filters?.dateFrom || "2024-01-01",
          endDate: filters?.dateTo || undefined,
          maxPages: 15,
          fullDetail: true,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao buscar jobs");

      const rawJobs = (data.data?.jobs || []) as HoldprintJob[];
      let jobs = rawJobs.map(transformJob);

      // 2. Fetch local extensions, time entries, and item assignments from Supabase
      const jobIds = jobs.map(j => j.id);
      if (jobIds.length > 0) {
        const [extRes, timeRes, assignRes] = await Promise.all([
          supabase.from("job_extensions").select("*").in("holdprint_job_id", jobIds),
          supabase.from("job_time_entries").select("job_id, minutes").in("job_id", jobIds),
          supabase.from("job_item_assignments").select("job_id, collaborator_name").in("job_id", jobIds).eq("is_active", true),
        ]);

        // Extensions map
        const extMap = new Map((extRes.data || []).map((e: any) => [e.holdprint_job_id, e]));

        // Sum time entries per job
        const timeMap = new Map<string, number>();
        for (const t of (timeRes.data || [])) {
          timeMap.set(t.job_id, (timeMap.get(t.job_id) || 0) + (t.minutes || 0));
        }

        // Unique collaborators per job (for responsible override)
        const assignMap = new Map<string, string[]>();
        for (const a of (assignRes.data || [])) {
          if (!assignMap.has(a.job_id)) assignMap.set(a.job_id, []);
          const list = assignMap.get(a.job_id)!;
          if (!list.includes(a.collaborator_name)) list.push(a.collaborator_name);
        }

        jobs = jobs.map(j => {
          const ext = extMap.get(j.id);
          const totalMinutes = timeMap.get(j.id) || 0;
          const assignedCollabs = assignMap.get(j.id);

          return {
            ...j,
            time_spent_minutes: totalMinutes,
            ...(ext ? {
              prioridade: (ext as any).prioridade || "normal",
              tags: (ext as any).tags || [],
              notas_internas: (ext as any).notas_internas || null,
              times_envolvidos: (ext as any).times_envolvidos || [],
            } : {}),
            // Override responsible with assigned collaborators if any
            ...(assignedCollabs && assignedCollabs.length > 0 ? {
              responsible: assignedCollabs.map((name, i) => ({ id: `assign-${i}`, name })),
            } : {}),
          };
        });
      }

      // 3. Fetch saved board assignments to override ERP stages
      if (activeBoard) {
        const { data: assignments } = await supabase
          .from("job_board_assignments")
          .select("job_id, stage_id, assigned_at")
          .eq("board_id", activeBoard.id)
          .eq("is_active", true)
          .order("assigned_at", { ascending: false });

        if (assignments && assignments.length > 0) {
          // Keep only the most recent assignment per job
          const stageMap = new Map<string, string>();
          for (const a of assignments) {
            if (a.stage_id && !stageMap.has(a.job_id)) {
              stageMap.set(a.job_id, a.stage_id);
            }
          }
          jobs = jobs.map(j => {
            const savedStage = stageMap.get(j.id);
            if (savedStage) return { ...j, stage: savedStage as Stage };
            return j;
          });
        }
      }

      // Apply filters
      if (filters) {
        if (filters.status !== "todos") {
          jobs = jobs.filter(j => j.status === filters.status);
        }
        if (filters.search) {
          const s = filters.search.toLowerCase();
          jobs = jobs.filter(j =>
            j.client_name.toLowerCase().includes(s) ||
            j.description.toLowerCase().includes(s) ||
            String(j.code || "").includes(s) ||
            j.id.includes(s)
          );
        }
        if (filters.productionType && filters.productionType !== "todos") {
          jobs = jobs.filter(j => j.production_type.toLowerCase().includes(filters.productionType.toLowerCase()));
        }
      }

      // Use board stages if provided, otherwise use defaults
      const stageConfigs = activeBoard
        ? boardStagesToConfigs(activeBoard.stages)
        : DEFAULT_STAGES;

      // Get valid stage IDs for this board
      const validStageIds = new Set(stageConfigs.map(s => s.id));

      // Group by stage — jobs whose stage doesn't match go into first column
      const byStage: JobsByStage[] = stageConfigs.map(stage => {
        const stageJobs = jobs.filter(j => j.stage === stage.id);
        return {
          stage,
          jobs: stageJobs,
          totalValue: stageJobs.reduce((s, j) => s + j.value, 0),
        };
      });

      // Put unmatched jobs into first column
      const unmatchedJobs = jobs.filter(j => !validStageIds.has(j.stage));
      if (unmatchedJobs.length > 0 && byStage.length > 0) {
        byStage[0].jobs = [...unmatchedJobs, ...byStage[0].jobs];
        byStage[0].totalValue = byStage[0].jobs.reduce((s, j) => s + j.value, 0);
      }

      return {
        jobs,
        byStage,
        total: jobs.length,
        totalValue: jobs.reduce((s, j) => s + j.value, 0),
        fetchedAt: String(data.fetchedAt || new Date().toISOString()),
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
