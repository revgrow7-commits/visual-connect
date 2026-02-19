import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HoldprintJob } from "@/hooks/useCSHoldprintData";
import type { PCPColumn, PCPCard, PCPSubSection } from "./pcpMockData";

// Map production step names to kanban column IDs
const STEP_TO_COLUMN: Record<string, string> = {
  // Aguardando / Aprovado
  "revisão comercial": "aguardando",
  "aguardando aprovação": "aguardando",
  "aprovação": "aguardando",
  "orçamento": "aguardando",
  "aguardando": "aguardando",

  // Arte Final
  "arte final": "arte-final",
  "fechamento": "arte-final",
  "arte": "arte-final",
  "verificação": "arte-final",
  "revisão de arte": "arte-final",
  "criação": "arte-final",
  "design": "arte-final",

  // Gerenciamento de Materiais
  "materiais": "gerenciamento",
  "compras": "gerenciamento",
  "estoque": "gerenciamento",
  "material": "gerenciamento",
  "gerenciamento de materiais": "gerenciamento",

  // Impressão
  "impressão": "impressao",
  "produção": "impressao",
  "nina cut": "impressao",
  "corte": "impressao",
  "acabamento": "impressao",
  "laminação": "impressao",

  // Projetos
  "projeto": "projetos",
  "projetos": "projetos",
  "engenharia": "projetos",
  "instalação": "projetos",
};

// Sub-section mapping based on job state
function getSubSectionId(columnId: string, job: HoldprintJob): string {
  if (job.isFinalized) return `${columnId}-concluido`;

  const status = (job.productionStatus || job.status || "").toLowerCase();
  if (status.includes("paused") || status.includes("pausado")) return `${columnId}-fazendo`;
  if (status.includes("progress") || status.includes("fazendo")) return `${columnId}-fazendo`;

  return `${columnId}-afazer`;
}

function getColumnId(stepName: string): string {
  const lower = stepName.toLowerCase().trim();

  // Exact match first
  if (STEP_TO_COLUMN[lower]) return STEP_TO_COLUMN[lower];

  // Partial match
  for (const [key, colId] of Object.entries(STEP_TO_COLUMN)) {
    if (lower.includes(key) || key.includes(lower)) return colId;
  }

  // Default: ocorrências (catch-all)
  return "ocorrencias";
}

// Color tags based on job attributes
function getJobTags(job: HoldprintJob): PCPCard["tags"] {
  const tags: PCPCard["tags"] = [];

  // Priority based on delivery
  if (job.deliveryNeeded) {
    const deliveryDate = new Date(job.deliveryNeeded);
    const now = new Date();
    const daysUntil = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) tags.push({ color: "bg-red-500", label: "Atrasado" });
    else if (daysUntil <= 3) tags.push({ color: "bg-orange-400", label: "Urgente" });
    else if (daysUntil <= 7) tags.push({ color: "bg-yellow-400", label: "Em breve" });
  }

  // Unit color
  if (job._unit_key === "poa") tags.push({ color: "bg-blue-500", label: "POA" });
  else if (job._unit_key === "sp") tags.push({ color: "bg-green-400", label: "SP" });

  // Charge status
  if (job.jobChargeStatus === "Paid" || job.jobChargeStatus === "Billed") {
    tags.push({ color: "bg-emerald-400", label: "Pago" });
  }

  return tags;
}

function formatDatePtBr(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
    return `${day} de ${months[d.getMonth()]}`;
  } catch {
    return undefined;
  }
}

export function transformJobsToKanban(jobs: HoldprintJob[]): PCPColumn[] {
  // Base column structure
  const columnsTemplate: PCPColumn[] = [
    {
      id: "aguardando",
      title: "AGUARDANDO/APROVADO",
      subSections: [
        { id: "aguardando-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
        { id: "aguardando-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
        { id: "aguardando-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
      ],
    },
    {
      id: "ocorrencias",
      title: "OCORRÊNCIAS",
      subSections: [
        { id: "ocorrencias-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
        { id: "ocorrencias-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
        { id: "ocorrencias-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
      ],
    },
    {
      id: "arte-final",
      title: "TIME FECHAMENTO - ARTE FINAL",
      subSections: [
        { id: "arte-final-verificacao", label: "VERIFICAÇÃO", color: "bg-red-400", cards: [] },
        { id: "arte-final-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
        { id: "arte-final-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
        { id: "arte-final-aprovacao", label: "AGUARDA APROVAÇÃO DE AMOSTRA", color: "bg-gray-300", textColor: "text-gray-800", cards: [] },
        { id: "arte-final-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
      ],
    },
    {
      id: "gerenciamento",
      title: "TIME GERENCIAMENTO DE MATERIAIS",
      subSections: [
        { id: "gerenciamento-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
        { id: "gerenciamento-estoque", label: "VALIDANDO ESTOQUE", color: "bg-orange-400", textColor: "text-orange-900", cards: [] },
        { id: "gerenciamento-aguardando", label: "AGUARDANDO MATERIAL", color: "bg-cyan-300", textColor: "text-cyan-900", cards: [] },
        { id: "gerenciamento-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
        { id: "gerenciamento-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
      ],
    },
    {
      id: "impressao",
      title: "TIME IMPRESSÃO - NINA CUT",
      subSections: [
        { id: "impressao-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
        { id: "impressao-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
        { id: "impressao-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
      ],
    },
    {
      id: "projetos",
      title: "TIME DE PROJETOS",
      subSections: [
        { id: "projetos-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
        { id: "projetos-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
        { id: "projetos-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
      ],
    },
  ];

  // Filter only active (non-finalized) recent jobs for the kanban
  const activeJobs = jobs.filter(j => !j.isFinalized);

  for (const job of activeJobs) {
    const stepName = job.currentProductionStepName || "";
    const columnId = getColumnId(stepName);
    const subSectionId = getSubSectionId(columnId, job);

    const deliveryDate = job.deliveryNeeded || job.deliveryExpected;
    const isOverdue = deliveryDate ? new Date(deliveryDate) < new Date() : false;

    const card: PCPCard = {
      id: `hp-${job.id}`,
      title: `${job.code || ""} ${job.title || job.customerName || "Sem título"}`.trim(),
      description: `Cliente: ${job.customerName || "—"}\nEtapa: ${stepName || "—"}\nResponsável: ${job.responsibleName || "—"}\nValor: R$ ${(job.totalPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      tags: getJobTags(job),
      date: formatDatePtBr(deliveryDate),
      overdue: isOverdue,
      done: false,
      hasWatcher: true,
      hasLock: true,
      responsible: (job.responsibleName as string) || undefined,
    };

    // Find the right column and sub-section
    const col = columnsTemplate.find(c => c.id === columnId);
    if (col) {
      let sub = col.subSections.find(s => s.id === subSectionId);
      if (!sub) sub = col.subSections[0]; // fallback to first sub-section
      sub.cards.push(card);
    }
  }

  return columnsTemplate;
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
