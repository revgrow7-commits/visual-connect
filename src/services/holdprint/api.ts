import { supabase } from "@/integrations/supabase/client";
import type { PaginationParams, PaginatedResult } from "./types";

export type HoldprintUnidade = "poa" | "sp";

let currentUnidade: HoldprintUnidade = "poa";

export function getHoldprintUnidade(): HoldprintUnidade {
  return currentUnidade;
}

export function setHoldprintUnidade(u: HoldprintUnidade) {
  currentUnidade = u;
}

/**
 * Generic proxy call through the holdprint-erp edge function.
 * Uses api.holdworks.ai with x-api-key auth (server-side).
 */
export async function holdprintFetch<T>(
  endpoint: string,
  method: string = "GET",
  payload?: unknown
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("holdprint-erp", {
    body: { endpoint, method, payload, unidade: currentUnidade },
  });

  if (error) throw new Error(error.message || "Edge function error");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/**
 * Paginated list using the api-key endpoints (GET with query params).
 * Endpoints follow pattern: /api-key/{resource}/data?page=X&limit=Y
 */
export async function holdprintList<T>(
  resource: string,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const page = Math.floor((params.skip || 0) / (params.take || 20)) + 1;
  const limit = params.take || 20;
  
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    language: "pt-BR",
  });

  const data = await holdprintFetch<{ data?: T[]; totalCount?: number } | T[]>(
    `/api-key/${resource}/data?${queryParams.toString()}`,
    "GET"
  );

  // API can return { data: [...], totalCount: N } or plain array
  if (Array.isArray(data)) {
    return { data, total: data.length };
  }
  
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    total: data?.totalCount || (data?.data?.length ?? 0),
  };
}
