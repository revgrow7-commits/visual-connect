import { holdprintFetch, holdprintList } from "./api";
import type { PaginationParams, PaginatedResult, HoldprintProcess, ProcessFamily } from "./types";

export const processesService = {
  list(params: PaginationParams): Promise<PaginatedResult<HoldprintProcess>> {
    return holdprintList<HoldprintProcess>("/processes", params);
  },

  async families(): Promise<ProcessFamily[]> {
    const data = await holdprintFetch<ProcessFamily[]>("/processes/family/graphql", "POST", {
      variables: { filter: {}, skip: 0, take: 200 },
    });
    return Array.isArray(data) ? data : [];
  },
};
