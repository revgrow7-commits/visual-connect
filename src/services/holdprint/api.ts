import { supabase } from "@/integrations/supabase/client";
import type { PaginationParams, PaginatedResult } from "./types";

export function getHoldprintSettings() {
  try {
    const raw = localStorage.getItem("holdprint_erp_settings");
    if (!raw) return null;
    return JSON.parse(raw) as { token: string; accountId: string; userId: string };
  } catch {
    return null;
  }
}

export function saveHoldprintSettings(settings: { token: string; accountId: string; userId: string }) {
  localStorage.setItem("holdprint_erp_settings", JSON.stringify(settings));
}

/**
 * Generic proxy call through the holdprint-erp edge function.
 */
export async function holdprintFetch<T>(
  endpoint: string,
  method: string = "POST",
  payload?: unknown
): Promise<T> {
  const settings = getHoldprintSettings();
  const token = settings?.token || "";

  const { data, error } = await supabase.functions.invoke("holdprint-erp", {
    body: { endpoint, method, payload, token },
  });

  if (error) throw new Error(error.message || "Edge function error");
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/**
 * List + count pattern used by most Holdprint endpoints.
 */
export async function holdprintList<T>(
  endpoint: string,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const [items, total] = await Promise.all([
    holdprintFetch<T[]>(`${endpoint}/graphql`, "POST", { variables: params }),
    holdprintFetch<number>(`${endpoint}/graphql-count`, "POST", {
      variables: { filter: params.filter || {} },
    }),
  ]);

  return {
    data: Array.isArray(items) ? items : [],
    total: typeof total === "number" ? total : 0,
  };
}
