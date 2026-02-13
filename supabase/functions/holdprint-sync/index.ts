import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE = "https://api.holdworks.ai";
const BATCH_SIZE = 50;

const ENDPOINTS: Record<string, { path: string; pageParam: string; limitParam: string; dateFilters?: boolean }> = {
  customers: { path: "/api-key/customers/data", pageParam: "page", limitParam: "limit" },
  suppliers: { path: "/api-key/suppliers/data", pageParam: "page", limitParam: "limit" },
  budgets:   { path: "/api-key/budgets/data",   pageParam: "page", limitParam: "pageSize", dateFilters: true },
  jobs:      { path: "/api-key/jobs/data",       pageParam: "page", limitParam: "pageSize", dateFilters: true },
  expenses:  { path: "/api-key/expenses/data",   pageParam: "page", limitParam: "limit", dateFilters: true },
  incomes:   { path: "/api-key/incomes/data",    pageParam: "page", limitParam: "limit", dateFilters: true },
};

const UNITS: { key: string; label: string; envVar: string }[] = [
  { key: "poa", label: "Porto Alegre", envVar: "HOLDPRINT_TOKEN_POA" },
  { key: "sp",  label: "São Paulo",    envVar: "HOLDPRINT_TOKEN_SP" },
];

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function buildContentText(endpoint: string, item: Record<string, unknown>): string {
  switch (endpoint) {
    case "customers":
      return `Cliente: ${item.name || item.fantasyName || "?"} | CNPJ: ${item.cnpj || "N/A"} | Ativo: ${item.active !== false}`;
    case "suppliers":
      return `Fornecedor: ${item.name || "?"} | Categoria: ${item.category || "N/A"}`;
    case "budgets":
      return `Orçamento #${item.id || "?"} | Cliente: ${(item as any).customer?.name || "?"} | Estado: ${item.budgetState || item.state || "?"}`;
    case "jobs":
      return `Job #${item.id || "?"} | Status: ${item.productionStatus || item.status || "?"} | Progresso: ${item.progressPercentage || 0}%`;
    case "expenses":
      return `Despesa #${item.id || "?"} | Valor: R$${item.amount || item.value || 0} | Status: ${item.status || "?"}`;
    case "incomes":
      return `Receita #${item.id || "?"} | Valor: R$${item.amount || item.value || 0} | Status: ${item.status || "?"}`;
    default:
      return JSON.stringify(item).slice(0, 300);
  }
}

function extractRecordId(item: Record<string, unknown>): string {
  return String(item.id || item.Id || item.ID || item.code || crypto.randomUUID());
}

function getAuthHeaders(apiKey: string, endpoint: string): Record<string, string> {
  // Budgets and Jobs use x-api-key header per Holdprint docs
  if (endpoint === "budgets" || endpoint === "jobs") {
    return { "x-api-key": apiKey, "Content-Type": "application/json" };
  }
  // Customers, Suppliers, Expenses, Incomes — docs say Bearer but API rejects JWT format
  // Try x-api-key as fallback since it works for budgets/jobs
  return { "x-api-key": apiKey, "Content-Type": "application/json" };
}

async function fetchAllPages(apiKey: string, endpoint: string): Promise<Record<string, unknown>[]> {
  const config = ENDPOINTS[endpoint];
  if (!config) return [];

  const allItems: Record<string, unknown>[] = [];
  let page = 1;
  const limit = BATCH_SIZE;

  while (true) {
    const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
    url.searchParams.set(config.pageParam, String(page));
    url.searchParams.set(config.limitParam, String(limit));
    url.searchParams.set("language", "pt-BR");

    if (config.dateFilters) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const sk = endpoint === "expenses" || endpoint === "incomes" ? "start_date" : "startDate";
      const ek = endpoint === "expenses" || endpoint === "incomes" ? "end_date" : "endDate";
      url.searchParams.set(sk, fmt(start));
      url.searchParams.set(ek, fmt(end));
    }

    try {
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(apiKey, endpoint),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[holdprint-sync] ${endpoint} page ${page}: HTTP ${res.status} - ${errBody.slice(0, 500)}`);
        break;
      }
      const json = await res.json();
      const items = Array.isArray(json) ? json : json?.data || json?.items || json?.results || [];
      if (!Array.isArray(items) || items.length === 0) break;

      allItems.push(...items);
      if (items.length < limit) break;
      page++;
    } catch (e) {
      console.error(`[holdprint-sync] ${endpoint} page ${page} error:`, e);
      break;
    }
  }

  return allItems;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = getSupabaseAdmin();
    const stats: Record<string, Record<string, number>> = {};

    for (const unit of UNITS) {
      const token = Deno.env.get(unit.envVar);
      if (!token) {
        console.warn(`[holdprint-sync] Token não encontrado para ${unit.label} (${unit.envVar}), pulando...`);
        continue;
      }

      stats[unit.key] = {};
      console.log(`[holdprint-sync] === Sincronizando ${unit.label} ===`);

      for (const endpoint of Object.keys(ENDPOINTS)) {
        console.log(`[holdprint-sync] [${unit.key}] Fetching ${endpoint}...`);
        const items = await fetchAllPages(token, endpoint);
        stats[unit.key][endpoint] = items.length;

        if (items.length === 0) continue;

        const rows = items.map((item) => ({
          endpoint,
          record_id: `${unit.key}_${extractRecordId(item)}`,
          raw_data: { ...item, _unidade: unit.label, _unit_key: unit.key },
          content_text: `[${unit.label}] ${buildContentText(endpoint, item)}`,
          last_synced: new Date().toISOString(),
        }));

        // Upsert in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error } = await sb
            .from("holdprint_cache")
            .upsert(batch, { onConflict: "endpoint,record_id" });
          if (error) {
            console.error(`[holdprint-sync] [${unit.key}] ${endpoint} upsert error:`, error.message);
          }
        }
      }
    }

    console.log("[holdprint-sync] Done:", stats);
    return new Response(JSON.stringify({ success: true, synced: stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[holdprint-sync] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
