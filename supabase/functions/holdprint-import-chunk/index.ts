import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE = "https://api.holdworks.ai";

const ENDPOINT_CONFIG: Record<string, { path: string; pageParam: string; limitParam: string; dateFilters?: boolean }> = {
  customers: { path: "/api-key/customers/data", pageParam: "page", limitParam: "limit" },
  suppliers: { path: "/api-key/suppliers/data", pageParam: "page", limitParam: "limit" },
  budgets:   { path: "/api-key/budgets/data",   pageParam: "page", limitParam: "pageSize", dateFilters: true },
  jobs:      { path: "/api-key/jobs/data",       pageParam: "page", limitParam: "pageSize", dateFilters: true },
  expenses:  { path: "/api-key/expenses/data",   pageParam: "page", limitParam: "limit", dateFilters: true },
  incomes:   { path: "/api-key/incomes/data",    pageParam: "page", limitParam: "limit", dateFilters: true },
};

const UNITS = [
  { key: "poa", label: "Porto Alegre", envVar: "HOLDPRINT_TOKEN_POA" },
  { key: "sp",  label: "São Paulo",    envVar: "HOLDPRINT_TOKEN_SP" },
];

function buildContentText(endpoint: string, item: Record<string, unknown>, unitLabel: string): string {
  const prefix = `[${unitLabel}]`;
  switch (endpoint) {
    case "customers":
      return `${prefix} Cliente: ${item.name || item.fantasyName || "?"} | CNPJ: ${item.cnpj || "N/A"} | Ativo: ${item.active !== false}`;
    case "budgets":
      return `${prefix} Orçamento #${item.code || item.id || "?"} | Cliente: ${(item as any).customerName || (item as any).customer?.name || "?"} | Estado: ${item.budgetState || item.state || "?"} | Valor: R$${((item as any).proposes?.[0]?.totalPrice || 0).toLocaleString("pt-BR")}`;
    case "jobs":
      return `${prefix} Job #${item.code || item.id || "?"} | Cliente: ${(item as any).customerName || "?"} | Status: ${item.productionStatus || item.status || "?"} | Progresso: ${item.progressPercentage || 0}% | Custo orçado: R$${((item as any).costs?.budgetedTotalPrice || 0).toLocaleString("pt-BR")}`;
    case "incomes":
      return `${prefix} Receita #${item.id || "?"} | Valor: R$${(item.amount || item.value || 0).toLocaleString("pt-BR")} | Status: ${item.status || "?"} | Cliente: ${(item as any).customerName || "?"}`;
    case "expenses":
      return `${prefix} Despesa #${item.id || "?"} | Valor: R$${(item.amount || item.value || 0).toLocaleString("pt-BR")} | Status: ${item.status || "?"}`;
    case "suppliers":
      return `${prefix} Fornecedor: ${item.name || "?"} | Categoria: ${item.category || "N/A"}`;
    default:
      return `${prefix} ${JSON.stringify(item).slice(0, 300)}`;
  }
}

function extractRecordId(item: Record<string, unknown>): string {
  return String(item.id || item.Id || item.ID || item.code || crypto.randomUUID());
}

async function fetchPages(apiKey: string, endpoint: string, startDate: string, endDate: string, maxPages = 100): Promise<Record<string, unknown>[]> {
  const config = ENDPOINT_CONFIG[endpoint];
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
      const sk = endpoint === "expenses" || endpoint === "incomes" ? "start_date" : "startDate";
      const ek = endpoint === "expenses" || endpoint === "incomes" ? "end_date" : "endDate";
      url.searchParams.set(sk, startDate);
      url.searchParams.set(ek, endDate);
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.error(`[import-chunk] ${endpoint} page ${page}: HTTP ${res.status}`);
        break;
      }
      const json = await res.json();
      const items = Array.isArray(json) ? json : json?.data || json?.items || json?.results || [];
      if (!Array.isArray(items) || items.length === 0) break;
      allItems.push(...items);
      if (items.length < limit) break;
      page++;
    } catch (e) {
      console.error(`[import-chunk] ${endpoint} page ${page} error:`, e);
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
    const body = await req.json();
    const { endpoint, startDate, endDate, unit } = body as {
      endpoint: string;
      startDate: string;
      endDate: string;
      unit?: string;
    };

    if (!endpoint || !ENDPOINT_CONFIG[endpoint]) {
      return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const unitsToFetch = unit ? UNITS.filter(u => u.key === unit) : UNITS;
    const stats: Record<string, number> = {};

    for (const u of unitsToFetch) {
      const token = Deno.env.get(u.envVar);
      if (!token) { stats[u.key] = -1; continue; }

      console.log(`[import-chunk] Fetching ${endpoint} for ${u.label} (${startDate} → ${endDate})`);
      const items = await fetchPages(token, endpoint, startDate, endDate);
      stats[u.key] = items.length;

      if (items.length === 0) continue;

      // Strip heavy fields
      const processed = items.map(item => {
        const rec = item as Record<string, unknown>;
        if (endpoint === "jobs") {
          const { production, products, ...slim } = rec;
          return slim;
        }
        if (endpoint === "customers") {
          const { customFields, ...slim } = rec;
          return slim;
        }
        return rec;
      });

      // Upsert to holdprint_cache
      const cacheRows = processed.map(item => ({
        endpoint,
        record_id: `${u.key}_${extractRecordId(item)}`,
        raw_data: { ...item, _unidade: u.label, _unit_key: u.key },
        content_text: buildContentText(endpoint, item, u.label),
        last_synced: new Date().toISOString(),
      }));

      for (let i = 0; i < cacheRows.length; i += 100) {
        const batch = cacheRows.slice(i, i + 100);
        const { error } = await sb.from("holdprint_cache").upsert(batch, { onConflict: "endpoint,record_id" });
        if (error) console.error(`[import-chunk] cache upsert error:`, error.message);
      }

      // Also upsert to rag_documents
      const ragRows = cacheRows.map(r => ({
        content: `${r.content_text}\n\nDados: ${JSON.stringify(r.raw_data).slice(0, 3000)}`,
        sector: endpoint,
        source_type: "holdprint",
        original_filename: `holdprint_${u.key}_${endpoint}_${r.record_id}`,
        metadata: { endpoint, unit: u.key, record_id: r.record_id, synced_at: r.last_synced },
      }));

      for (let i = 0; i < ragRows.length; i += 100) {
        const batch = ragRows.slice(i, i + 100);
        const { error } = await sb.from("rag_documents").upsert(batch, { onConflict: "original_filename" });
        if (error) console.error(`[import-chunk] rag upsert error:`, error.message);
      }
    }

    console.log(`[import-chunk] Done: ${endpoint} ${startDate}-${endDate}:`, stats);
    return new Response(JSON.stringify({ success: true, endpoint, startDate, endDate, imported: stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[import-chunk] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
