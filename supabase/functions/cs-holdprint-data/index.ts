import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE = "https://api.holdworks.ai";

interface EndpointConfig {
  path: string;
  pageParam: string;
  limitParam: string;
  dateFilters?: boolean;
}

const ENDPOINTS: Record<string, EndpointConfig> = {
  customers: { path: "/api-key/customers/data", pageParam: "page", limitParam: "limit" },
  budgets:   { path: "/api-key/budgets/data",   pageParam: "page", limitParam: "pageSize", dateFilters: true },
  jobs:      { path: "/api-key/jobs/data",       pageParam: "page", limitParam: "pageSize", dateFilters: true },
  incomes:   { path: "/api-key/incomes/data",    pageParam: "page", limitParam: "limit", dateFilters: true },
  expenses:  { path: "/api-key/expenses/data",   pageParam: "page", limitParam: "limit", dateFilters: true },
  suppliers: { path: "/api-key/suppliers/data",   pageParam: "page", limitParam: "limit" },
};

const UNITS = [
  { key: "poa", label: "Porto Alegre", envVar: "HOLDPRINT_TOKEN_POA" },
  { key: "sp",  label: "São Paulo",    envVar: "HOLDPRINT_TOKEN_SP" },
];

async function fetchAllPages(apiKey: string, endpoint: string, startDate?: string, endDate?: string, maxPages = 50): Promise<Record<string, unknown>[]> {
  const config = ENDPOINTS[endpoint];
  if (!config) return [];

  const allItems: Record<string, unknown>[] = [];
  let page = 1;
  const limit = 100;

  while (page <= maxPages) {
    const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
    url.searchParams.set(config.pageParam, String(page));
    url.searchParams.set(config.limitParam, String(limit));
    url.searchParams.set("language", "pt-BR");

    if (config.dateFilters) {
      const now = new Date();
      // Default: fetch from 2023 for good historical coverage
      const start = startDate || "2023-01-01";
      const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const sk = endpoint === "incomes" ? "start_date" : "startDate";
      const ek = endpoint === "incomes" ? "end_date" : "endDate";
      url.searchParams.set(sk, start);
      url.searchParams.set(ek, end);
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.error(`[cs-holdprint-data] ${endpoint} page ${page}: HTTP ${res.status}`);
        break;
      }
      const json = await res.json();
      const items = Array.isArray(json) ? json : json?.data || json?.items || json?.results || [];
      if (!Array.isArray(items) || items.length === 0) break;
      allItems.push(...items);
      if (items.length < limit) break;
      page++;
    } catch (e) {
      console.error(`[cs-holdprint-data] ${endpoint} error:`, e);
      break;
    }
  }
  console.log(`[cs-holdprint-data] ${endpoint}: fetched ${allItems.length} items (${page} pages)`);
  return allItems;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestedEndpoints = ["customers", "jobs", "budgets", "incomes", "expenses", "suppliers"];
    let startDate: string | undefined;
    let endDate: string | undefined;
    let unit: string | undefined;
    let maxPages = 50;

    try {
      const body = await req.json();
      if (body?.endpoints) requestedEndpoints = body.endpoints;
      if (body?.startDate) startDate = body.startDate;
      if (body?.endDate) endDate = body.endDate;
      if (body?.unit) unit = body.unit;
      if (body?.maxPages) maxPages = Math.min(body.maxPages, 100);
    } catch { /* no body */ }

    const results: Record<string, Record<string, unknown>[]> = {};
    const unitsToFetch = unit ? UNITS.filter(u => u.key === unit) : UNITS;

    for (const u of unitsToFetch) {
      const token = Deno.env.get(u.envVar);
      if (!token) {
        console.warn(`[cs-holdprint-data] Token não encontrado para ${u.label}`);
        continue;
      }

      const endpointResults = await Promise.all(
        requestedEndpoints.map(async (ep) => {
          const items = await fetchAllPages(token, ep, startDate, endDate, maxPages);
          // Strip heavy fields to reduce payload size
          const processed = items.map(item => {
            const rec = item as Record<string, unknown>;
            if (ep === "jobs") {
              const { production, products, ...slim } = rec;
              return { ...slim, _unidade: u.label, _unit_key: u.key };
            }
            if (ep === "customers") {
              const { customFields, ...slim } = rec;
              return { ...slim, _unidade: u.label, _unit_key: u.key };
            }
            return { ...rec, _unidade: u.label, _unit_key: u.key };
          });
          return { endpoint: ep, items: processed };
        })
      );

      for (const { endpoint, items } of endpointResults) {
        if (!results[endpoint]) results[endpoint] = [];
        results[endpoint].push(...items);
      }
    }

    // Also try to read from holdprint_cache as fallback/supplement
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get last sync time
    const { data: lastSync } = await sb
      .from("holdprint_cache")
      .select("last_synced")
      .order("last_synced", { ascending: false })
      .limit(1)
      .single();

    return new Response(JSON.stringify({
      success: true,
      data: results,
      lastSync: lastSync?.last_synced || null,
      fetchedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[cs-holdprint-data] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
