import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Job, JobItem, JobMaterial, JobComment } from "@/components/jobs/types";

export interface ProductionTask {
  name: string;
  duration: number;
  productionStatus: string;
  releasedDate: string | null;
  startedDate: string | null;
  finalizedDate: string | null;
  scheduleStartDate: string | null;
  scheduleEndDate: string | null;
  isPaused: boolean;
  isProductive: boolean;
}

export interface JobDetailData {
  items: JobItem[];
  materials: JobMaterial[];
  productionTasks: ProductionTask[];
  productionProgress: number;
  productionStartDate: string | null;
  productionEndDate: string | null;
  comments: JobComment[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

export function parseJobDetail(raw: Record<string, unknown>): JobDetailData {
  const production = raw.production as Record<string, unknown> | undefined;
  const products = (raw.products || []) as Record<string, unknown>[];
  const prodItems = (production?.items || []) as Record<string, unknown>[];

  const allTasks: ProductionTask[] = [];
  const allFeedstocks: JobMaterial[] = [];

  for (const pItem of prodItems) {
    const tasks = (pItem.tasks || []) as Record<string, unknown>[];
    for (const t of tasks) {
      allTasks.push({
        name: String(t.name || ""),
        duration: Number(t.duration || 0),
        productionStatus: String(t.productionStatus || "Ready"),
        releasedDate: t.releasedDate as string | null,
        startedDate: t.startedDate as string | null,
        finalizedDate: t.finalizedDate as string | null,
        scheduleStartDate: t.scheduleStartDate as string | null,
        scheduleEndDate: t.scheduleEndDate as string | null,
        isPaused: Boolean(t.isPaused),
        isProductive: Boolean(t.isProductive),
      });
    }

    const feedstocks = (pItem.feedstocks || []) as Record<string, unknown>[];
    for (const fs of feedstocks) {
      const options = (fs.options || {}) as Record<string, string>;
      allFeedstocks.push({
        name: String(fs.technicalName || "Material"),
        process: String(pItem.name || ""),
        attributes: Object.keys(options).length > 0 ? options : undefined,
      });
    }
  }

  const items: JobItem[] = products.map((p, idx) => ({
    id: String(idx),
    name: String(p.name || "Item"),
    description: stripHtml(String(p.description || "")),
    quantity: Number(p.quantity || 1),
    unit: "UN",
    unitPrice: Number(p.unitPrice || 0),
    subtotal: Number(p.totalValue || 0),
    materials: allFeedstocks.filter(f => f.process === String(p.name || "")),
  }));

  // Build timeline from tasks sorted chronologically
  const comments: JobComment[] = allTasks
    .filter(t => t.finalizedDate || t.startedDate || t.releasedDate)
    .sort((a, b) => {
      const da = a.finalizedDate || a.startedDate || a.releasedDate || "";
      const db = b.finalizedDate || b.startedDate || b.releasedDate || "";
      return da.localeCompare(db);
    })
    .map((t, i) => {
      const status = t.productionStatus === "Finalized" ? "✅ Finalizado" :
        t.productionStatus === "Started" ? "🔄 Em andamento" : "📋 Liberado";
      return {
        id: String(i),
        content: `${status} — ${t.name}${t.duration ? ` (${t.duration} min)` : ""}`,
        user: "Sistema",
        timestamp: t.finalizedDate || t.startedDate || t.releasedDate || "",
      };
    });

  return {
    items,
    materials: allFeedstocks,
    productionTasks: allTasks,
    productionProgress: Number(production?.progressPercentage || 0),
    productionStartDate: production?.startDate as string | null,
    productionEndDate: production?.endDate as string | null,
    comments,
  };
}

export function useJobDetail(job: Job | null) {
  const jobId = job?.id;
  const jobCode = job?.code;
  const unitKey = job?._unit_key || "poa";

  return useQuery<JobDetailData>({
    queryKey: ["holdprint-job-detail", jobId, unitKey],
    enabled: !!jobId,
    queryFn: async () => {
      // Check if _raw already has production data
      if (job?._raw?.production) {
        return parseJobDetail(job._raw);
      }

      // Fetch full detail for this unit's jobs
      const { data, error } = await supabase.functions.invoke("cs-holdprint-data", {
        body: {
          endpoints: ["jobs"],
          startDate: "2024-01-01",
          unit: unitKey,
          maxPages: 15,
          fullDetail: true,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao buscar detalhe do job");

      const allJobs = (data.data?.jobs || []) as Record<string, unknown>[];
      const found = allJobs.find(j => 
        String(j.id) === String(jobId) || Number(j.code) === jobCode
      );

      if (found) return parseJobDetail(found);

      return {
        items: [], materials: [], productionTasks: [],
        productionProgress: 0, productionStartDate: null,
        productionEndDate: null, comments: [],
      };
    },
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}
