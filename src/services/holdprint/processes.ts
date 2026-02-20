import { holdprintFetch, holdprintList } from "./api";
import type { PaginationParams, PaginatedResult, HoldprintProcess, ProcessFamily } from "./types";

// The api.holdworks.ai API uses "jobs" instead of "processes"
export const processesService = {
  list: async (params: PaginationParams): Promise<PaginatedResult<HoldprintProcess>> => {
    const page = Math.floor((params.skip || 0) / (params.take || 20)) + 1;
    const limit = params.take || 20;
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(limit),
      language: "pt-BR",
      startDate: "2023-01-01",
      endDate: new Date().toISOString().split("T")[0],
    });
    const data = await holdprintFetch<{ data?: HoldprintProcess[] } | HoldprintProcess[]>(
      `/api-key/jobs/data?${qs.toString()}`,
      "GET"
    );
    if (Array.isArray(data)) return { data, total: data.length };
    return { data: data?.data || [], total: data?.data?.length || 0 };
  },

  families: async (): Promise<ProcessFamily[]> => {
    // Extract unique statuses/categories from jobs as "families"
    const result = await processesService.list({ skip: 0, take: 100 });
    const familyMap = new Map<string, ProcessFamily>();
    for (const p of result.data) {
      const status = (p as any).productionStatus || (p as any).status || "Outros";
      if (!familyMap.has(status)) {
        familyMap.set(status, { _id: status, name: status });
      }
    }
    return Array.from(familyMap.values());
  },
};
