import { holdprintFetch, holdprintList } from "./api";
import type { PaginationParams, PaginatedResult, HoldprintBudget, BudgetStepOrder } from "./types";

export const opportunitiesService = {
  budgetsSearch: async (params: PaginationParams): Promise<PaginatedResult<HoldprintBudget>> => {
    const page = Math.floor((params.skip || 0) / (params.take || 20)) + 1;
    const limit = params.take || 20;
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(limit),
      language: "pt-BR",
      startDate: "2023-01-01",
      endDate: new Date().toISOString().split("T")[0],
    });
    const data = await holdprintFetch<{ data?: HoldprintBudget[] } | HoldprintBudget[]>(
      `/api-key/budgets/data?${qs.toString()}`,
      "GET"
    );
    if (Array.isArray(data)) return { data, total: data.length };
    return { data: data?.data || [], total: data?.data?.length || 0 };
  },

  stepOrders: async (): Promise<BudgetStepOrder[]> => {
    // This endpoint may not exist in api-key API, return empty
    try {
      const data = await holdprintFetch<BudgetStepOrder[]>("/api-key/budget-steps/data?page=1&limit=100&language=pt-BR", "GET");
      return Array.isArray(data) ? data : (data as any)?.data || [];
    } catch {
      return [];
    }
  },
};
