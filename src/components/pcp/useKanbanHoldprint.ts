import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HoldprintJob } from "@/hooks/useCSHoldprintData";
import type { PCPColumn, PCPCard } from "./pcpMockData";
import { initialPcpColumns } from "./pcpMockData";

// Map production step names to kanban column IDs
const STEP_TO_COLUMN: Record<string, string> = {
  "revisão comercial": "aguardando",
  "aguardando aprovação": "aguardando",
  "aprovação": "aguardando",
  "orçamento": "aguardando",
  "aguardando": "aguardando",
  "arte final": "arte-final",
  "fechamento": "arte-final",
  "arte": "arte-final",
  "verificação": "arte-final",
  "revisão de arte": "arte-final",
  "criação": "arte-final",
  "design": "arte-final",
  "materiais": "gerenciamento",
  "compras": "gerenciamento",
  "estoque": "gerenciamento",
  "material": "gerenciamento",
  "gerenciamento de materiais": "gerenciamento",
  "impressão": "impressao",
  "produção": "impressao",
  "nina cut": "impressao",
  "corte": "impressao",
  "acabamento": "impressao",
  "laminação": "impressao",
  "projeto": "projetos",
  "projetos": "projetos",
  "engenharia": "projetos",
  "instalação": "projetos",
};

// Determine sub-section suffix based on job state
function getSubSuffix(job: HoldprintJob): string {
  if (job.isFinalized) return "concluido";
  const status = (job.productionStatus || job.status || "").toLowerCase();
  if (status.includes("progress") || status.includes("fazendo") || status.includes("paused") || status.includes("pausado")) return "fazendo";
  return "afazer";
}

// Map a sub-section suffix to the correct sub-section ID within a column
function resolveSubSectionId(columnId: string, suffix: string, columns: PCPColumn[]): string {
  const col = columns.find(c => c.id === columnId);
  if (!col) return `${columnId}-${suffix}`;

  // Try exact match with common prefixes
  const prefixMap: Record<string, string> = {
    aguardando: "ag",
    ocorrencias: "oc",
    "arte-final": "af",
    gerenciamento: "gm",
    impressao: "im",
    projetos: "pj",
  };
  const prefix = prefixMap[columnId] || columnId;
  const targetId = `${prefix}-${suffix}`;
  const found = col.subSections.find(s => s.id === targetId);
  if (found) return found.id;

  // Fallback: first sub-section
  return col.subSections[0]?.id || targetId;
}

function getColumnId(stepName: string): string {
  const lower = stepName.toLowerCase().trim();
  if (STEP_TO_COLUMN[lower]) return STEP_TO_COLUMN[lower];
  for (const [key, colId] of Object.entries(STEP_TO_COLUMN)) {
    if (lower.includes(key) || key.includes(lower)) return colId;
  }
  return "ocorrencias";
}

function getJobTags(job: HoldprintJob): PCPCard["tags"] {
  const tags: PCPCard["tags"] = [];
  if (job.deliveryNeeded) {
    const daysUntil = Math.ceil((new Date(job.deliveryNeeded).getTime() - Date.now()) / 864e5);
    if (daysUntil < 0) tags.push({ color: "bg-red-500", label: "Atrasado" });
    else if (daysUntil <= 3) tags.push({ color: "bg-orange-400", label: "Urgente" });
    else if (daysUntil <= 7) tags.push({ color: "bg-yellow-400", label: "Em breve" });
  }
  if (job._unit_key === "poa") tags.push({ color: "bg-blue-500", label: "POA" });
  else if (job._unit_key === "sp") tags.push({ color: "bg-green-400", label: "SP" });
  if (job.jobChargeStatus === "Paid" || job.jobChargeStatus === "Billed") {
    tags.push({ color: "bg-emerald-400", label: "Pago" });
  }
  return tags;
}

function fmtDate(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  try {
    const dt = new Date(d);
    const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
    return `${dt.getDate()} de ${months[dt.getMonth()]}`;
  } catch { return undefined; }
}

export function transformJobsToKanban(jobs: HoldprintJob[]): PCPColumn[] {
  // Deep clone initial columns so each call starts fresh
  const columns: PCPColumn[] = JSON.parse(JSON.stringify(initialPcpColumns));

  // Only active (non-finalized) jobs
  const activeJobs = jobs.filter(j => !j.isFinalized);

  for (const job of activeJobs) {
    const stepName = job.currentProductionStepName || "";
    const columnId = getColumnId(stepName);
    const suffix = getSubSuffix(job);
    const subId = resolveSubSectionId(columnId, suffix, columns);

    const deliveryDate = job.deliveryNeeded || job.deliveryExpected;
    const isOverdue = deliveryDate ? new Date(deliveryDate) < new Date() : false;

    const card: PCPCard = {
      id: `hp-${job.id}`,
      title: `${job.code || ""} ${job.title || job.customerName || "Sem título"}`.trim(),
      description: [
        `Cliente: ${job.customerName || "—"}`,
        `Etapa: ${stepName || "—"}`,
        `Responsável: ${job.responsibleName || "—"}`,
        `Valor: R$ ${(job.totalPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ].join("\n"),
      tags: getJobTags(job),
      date: fmtDate(deliveryDate),
      overdue: isOverdue,
      done: false,
      hasWatcher: true,
      hasLock: true,
      responsible: (job.responsibleName as string) || undefined,
    };

    const col = columns.find(c => c.id === columnId);
    if (col) {
      const sub = col.subSections.find(s => s.id === subId) || col.subSections[0];
      sub.cards.push(card);
    }
  }

  return columns;
}

export function useKanbanHoldprintJobs() {
  return useQuery({
    queryKey: ["kanban-holdprint-jobs"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase.functions.invoke("cs-holdprint-data", {
        body: {
          endpoints: ["jobs"],
          startDate: today,
          endDate: today,
          maxPages: 5,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao buscar jobs");

      const jobs = (data.data?.jobs || []) as HoldprintJob[];
      return {
        jobs,
        columns: transformJobsToKanban(jobs),
        fetchedAt: String(data.fetchedAt || ""),
        lastSync: data.lastSync ? String(data.lastSync) : null,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
