const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE = "https://api.holdworks.ai";

const UNITS = [
  { key: "poa", label: "Porto Alegre", envVar: "HOLDPRINT_TOKEN_POA" },
  { key: "sp", label: "São Paulo", envVar: "HOLDPRINT_TOKEN_SP" },
];

interface EndpointConfig {
  path: string;
  pageParam: string;
  limitParam: string;
  dateFilters?: boolean;
  dateStartKey?: string;
  dateEndKey?: string;
}

const ENDPOINTS: Record<string, EndpointConfig> = {
  customers: { path: "/api-key/customers/data", pageParam: "page", limitParam: "limit" },
  budgets: { path: "/api-key/budgets/data", pageParam: "page", limitParam: "pageSize", dateFilters: true, dateStartKey: "startDate", dateEndKey: "endDate" },
  jobs: { path: "/api-key/jobs/data", pageParam: "page", limitParam: "pageSize", dateFilters: true, dateStartKey: "startDate", dateEndKey: "endDate" },
  incomes: { path: "/api-key/incomes/data", pageParam: "page", limitParam: "limit", dateFilters: true, dateStartKey: "start_date", dateEndKey: "end_date" },
  expenses: { path: "/api-key/expenses/data", pageParam: "page", limitParam: "limit", dateFilters: true, dateStartKey: "startDate", dateEndKey: "endDate" },
  suppliers: { path: "/api-key/suppliers/data", pageParam: "page", limitParam: "limit" },
};

async function fetchAllPages(apiKey: string, endpoint: string, config: EndpointConfig, startDate: string, endDate: string): Promise<Record<string, unknown>[]> {
  const allItems: Record<string, unknown>[] = [];
  let page = 1;
  const limit = 100;
  const maxPages = 50;

  while (page <= maxPages) {
    const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
    url.searchParams.set(config.pageParam, String(page));
    url.searchParams.set(config.limitParam, String(limit));
    url.searchParams.set("language", "pt-BR");

    if (config.dateFilters) {
      url.searchParams.set(config.dateStartKey!, startDate);
      url.searchParams.set(config.dateEndKey!, endDate);
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.error(`[holdprint-daily-sync] ${endpoint} p${page}: HTTP ${res.status}`);
        break;
      }
      const json = await res.json();
      const items = Array.isArray(json) ? json : json?.data || json?.items || json?.results || [];
      if (!Array.isArray(items) || items.length === 0) break;
      allItems.push(...items);
      if (items.length < limit) break;
      page++;
    } catch (e) {
      console.error(`[holdprint-daily-sync] ${endpoint} p${page} error:`, (e as Error).message);
      break;
    }
  }
  return allItems;
}

function getRecordId(endpoint: string, record: Record<string, unknown>): string {
  return String(record.id || record.code || record._id || "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const restHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  let triggerType = "manual";
  let requestedEndpoints: string[] | undefined;
  try {
    const body = await req.json();
    if (body?.trigger_type) triggerType = body.trigger_type;
    if (body?.endpoints) requestedEndpoints = body.endpoints;
  } catch { /* no body */ }

  const endpointsToSync = requestedEndpoints || Object.keys(ENDPOINTS);

  // Create sync log entry
  const logRes = await fetch(`${supabaseUrl}/rest/v1/holdprint_sync_log`, {
    method: "POST",
    headers: { ...restHeaders, Prefer: "return=representation" },
    body: JSON.stringify({
      trigger_type: triggerType,
      endpoints_synced: endpointsToSync,
      status: "running",
    }),
  });
  const [logEntry] = await logRes.json();
  const logId = logEntry?.id;

  console.log(`[holdprint-daily-sync] Started (${triggerType}), log=${logId}, endpoints=${endpointsToSync.join(",")}`);

  try {
    const now = new Date();
    const startDate = "2023-01-01";
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let totalRecords = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    const errors: string[] = [];
    const details: Record<string, { fetched: number; inserted: number; updated: number }> = {};

    for (const endpoint of endpointsToSync) {
      const config = ENDPOINTS[endpoint];
      if (!config) continue;

      let epInserted = 0;
      let epUpdated = 0;
      let epFetched = 0;

      for (const unit of UNITS) {
        const token = Deno.env.get(unit.envVar);
        if (!token) continue;

        const items = await fetchAllPages(token, endpoint, config, startDate, endDate);
        epFetched += items.length;
        console.log(`[holdprint-daily-sync] ${endpoint}/${unit.key}: ${items.length} items`);

        // Batch upsert to holdprint_cache (chunks of 50)
        for (let i = 0; i < items.length; i += 50) {
          const chunk = items.slice(i, i + 50);
          const rows = chunk.map((item) => {
            const recordId = `${unit.key}_${getRecordId(endpoint, item)}`;
            const name = String(
              (item as any).name || (item as any).customerName || (item as any).title || (item as any).code || ""
            );
            return {
              endpoint,
              record_id: recordId,
              raw_data: { ...item, _unit_key: unit.key, _unidade: unit.label },
              content_text: `${endpoint} ${name} ${recordId}`.slice(0, 500),
              last_synced: new Date().toISOString(),
            };
          });

          const upsertRes = await fetch(
            `${supabaseUrl}/rest/v1/holdprint_cache?on_conflict=endpoint,record_id`,
            {
              method: "POST",
              headers: { ...restHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
              body: JSON.stringify(rows),
            }
          );

          if (!upsertRes.ok) {
            const t = await upsertRes.text();
            errors.push(`${endpoint} chunk ${i}: ${t.slice(0, 150)}`);
          } else {
            epInserted += chunk.length; // approximate
          }
        }

        // Also sync jobs to jobs_cache for Kanban
        if (endpoint === "jobs") {
          for (const job of items) {
            const holdprintId = String((job as any).id || "");
            if (!holdprintId) continue;
            const cacheId = `${unit.key}_${holdprintId}`;
            const jobNumber = `J${(job as any).code || holdprintId}`;
            const stage = String(
              (job as any).currentProductionStepName ||
              (job as any).productionStatus ||
              (job as any).status ||
              "Revisão Comercial"
            );

            const getRes = await fetch(
              `${supabaseUrl}/rest/v1/jobs_cache?holdprint_id=eq.${encodeURIComponent(cacheId)}&select=id,stage`,
              { headers: restHeaders }
            );
            const existing = await getRes.json();

            if (!existing || existing.length === 0) {
              await fetch(`${supabaseUrl}/rest/v1/jobs_cache`, {
                method: "POST",
                headers: { ...restHeaders, Prefer: "return=minimal" },
                body: JSON.stringify({
                  holdprint_id: cacheId,
                  job_number: jobNumber,
                  data: { ...job, _unit_key: unit.key, _unidade: unit.label },
                  stage,
                  last_synced: new Date().toISOString(),
                }),
              });
            } else {
              const prev = existing[0].stage;
              await fetch(
                `${supabaseUrl}/rest/v1/jobs_cache?holdprint_id=eq.${encodeURIComponent(cacheId)}`,
                {
                  method: "PATCH",
                  headers: { ...restHeaders, Prefer: "return=minimal" },
                  body: JSON.stringify({
                    data: { ...job, _unit_key: unit.key, _unidade: unit.label },
                    stage,
                    previous_stage: prev !== stage ? prev : existing[0].previous_stage,
                    last_synced: new Date().toISOString(),
                  }),
                }
              );

              if (prev && prev !== stage) {
                await fetch(`${supabaseUrl}/rest/v1/job_stage_movements`, {
                  method: "POST",
                  headers: { ...restHeaders, Prefer: "return=minimal" },
                  body: JSON.stringify({
                    job_id: holdprintId,
                    job_code: (job as any).code || null,
                    job_title: String((job as any).title || "").slice(0, 200),
                    customer_name: String((job as any).customerName || "").slice(0, 200),
                    board_id: "holdprint-sync",
                    board_name: "Holdprint Sync",
                    from_stage_id: prev,
                    from_stage_name: prev,
                    to_stage_id: stage,
                    to_stage_name: stage,
                    moved_by: "Daily Sync",
                    movement_type: "holdprint_sync",
                  }),
                });
              }
              epUpdated++;
            }
          }
        }
      }

      details[endpoint] = { fetched: epFetched, inserted: epInserted, updated: epUpdated };
      totalRecords += epFetched;
      totalInserted += epInserted;
      totalUpdated += epUpdated;
    }

    // Update sync log
    if (logId) {
      await fetch(`${supabaseUrl}/rest/v1/holdprint_sync_log?id=eq.${logId}`, {
        method: "PATCH",
        headers: { ...restHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          finished_at: new Date().toISOString(),
          status: errors.length > 0 ? "partial" : "success",
          total_records: totalRecords,
          inserted: totalInserted,
          updated: totalUpdated,
          errors,
          details,
        }),
      });
    }

    console.log(`[holdprint-daily-sync] Done: ${totalRecords} records, ${totalInserted} ins, ${totalUpdated} upd, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      total_records: totalRecords,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: errors.length,
      details,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = (e as Error).message || "Unknown error";
    console.error("[holdprint-daily-sync] Fatal:", msg);

    if (logId) {
      await fetch(`${supabaseUrl}/rest/v1/holdprint_sync_log?id=eq.${logId}`, {
        method: "PATCH",
        headers: { ...restHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          finished_at: new Date().toISOString(),
          status: "error",
          errors: [msg],
        }),
      });
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
