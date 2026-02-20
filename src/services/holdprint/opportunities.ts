import { holdprintFetch, holdprintList } from "./api";
import type {
  HoldprintFunnel,
  HoldprintLead,
  HoldprintBudget,
  BudgetStepOrder,
  PaginationParams,
  PaginatedResult,
} from "./types";

export const opportunitiesService = {
  async funnels(): Promise<HoldprintFunnel[]> {
    const data = await holdprintFetch<HoldprintFunnel[]>("/funnels", "GET");
    return Array.isArray(data) ? data : [];
  },

  leads(params: PaginationParams): Promise<PaginatedResult<HoldprintLead>> {
    return holdprintList<HoldprintLead>("/leads", params);
  },

  async budgetsSearch(params: PaginationParams): Promise<PaginatedResult<HoldprintBudget>> {
    const data = await holdprintFetch<HoldprintBudget[]>("/budgets/graphql-search", "POST", {
      variables: params,
    });
    return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
  },

  async stepOrders(): Promise<BudgetStepOrder[]> {
    const data = await holdprintFetch<BudgetStepOrder[]>("/budget-step-orders", "GET");
    return Array.isArray(data) ? data : [];
  },
};
