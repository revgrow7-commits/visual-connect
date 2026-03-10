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

// Time budget: stop fetching after 120s to leave room for DB writes
const MAX_FETCH_MS = 120_000;

function getRecordId(endpoint: string, record: Record<string, unknown>): string {
  return String(record.id || record.code || record._id || "");
}

async function fetchPages(
  apiKey: string,
  endpoint: string,
  config: EndpointConfig,
  startDate: string,
  endDate: string,
  startTime: number,
): Promise<Record<string, unknown>[]> {
  const allItems: Record<string, unknown>[] = [];
  let page = 1;
  const limit = 250; // larger pages = fewer requests
  const maxPages = 30;

  while (page <= maxPages) {
    if (Date.now() - startTime > MAX_FETCH_MS) {
      console.log(`[sync] Time budget exceeded at ${endpoint} p${page}`);
      break;
    }

    const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
    url.searchParams.set(config.pageParam, String(page));
    url.searchParams.set(config.limitParam, String(limit));
    url.searchParams.set("language", "pt-BR");

    if (config.dateFilters) {
      url.searchParams.set(config.dateStartKey!, startDate);
      url.searchParams.set(config.dateEndKey!, endDate);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(url.toString(), {
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const t = await res.text();
        console.warn(`[sync] ${endpoint} p${page}: HTTP ${res.status} ${t.slice(0, 100)}`);
        break;
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("json")) {
        await res.text();
        break;
      }

      const json = await res.json();
      const items = Array.isArray(json) ? json : json?.data || json?.items || json?.results || [];
      if (!Array.isArray(items) || items.length === 0) break;
      allItems.push(...items);
      if (items.length < limit) break;
      page++;
    } catch (e) {
      console.warn(`[sync] ${endpoint} p${page} error:`, (e as Error).message);
      break;
    }
  }
  return allItems;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
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

  // Create sync log
  const logRes = await fetch(`${supabaseUrl}/rest/v1/holdprint_sync_log`, {
    method: "POST",
    headers: { ...restHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ trigger_type: triggerType, endpoints_synced: endpointsToSync, status: "running" }),
  });
  const [logEntry] = await logRes.json();
  const logId = logEntry?.id;

  console.log(`[sync] Started (${triggerType}), log=${logId}`);

  // Return response immediately, continue work in background (fire-and-forget)
  const responsePromise = new Response(
    JSON.stringify({ success: true, message: "Sincronização iniciada em background", logId }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );

  // Use waitUntil pattern - process in background
  const bgWork = (async () => {
    try {
      const now = new Date();
      // Only sync last 6 months for date-filtered endpoints (much faster)
      const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
      const startDate = sixMonthsAgo.toISOString().split("T")[0];
      const endDate = now.toISOString().split("T")[0];

      let totalRecords = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      const errors: string[] = [];
      const details: Record<string, { fetched: number; inserted: number; updated: number }> = {};

      for (const endpoint of endpointsToSync) {
        const config = ENDPOINTS[endpoint];
        if (!config) continue;

        let epFetched = 0;
        let epInserted = 0;
        let epUpdated = 0;

        for (const unit of UNITS) {
          const token = Deno.env.get(unit.envVar);
          if (!token) continue;

          // For customers/suppliers without date filter, use full range
          const effStart = config.dateFilters ? startDate : "2020-01-01";
          const items = await fetchPages(token, endpoint, config, effStart, endDate, startTime);
          epFetched += items.length;
          console.log(`[sync] ${endpoint}/${unit.key}: ${items.length} items`);

          // Batch upsert in chunks of 200
          for (let i = 0; i < items.length; i += 200) {
            const chunk = items.slice(i, i + 200);
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
              errors.push(`${endpoint}/${unit.key} chunk ${i}: ${t.slice(0, 150)}`);
            } else {
              epInserted += chunk.length;
            }
          }

          // Sync jobs to jobs_cache for Kanban (batch approach)
          if (endpoint === "jobs" && items.length > 0) {
            // Fetch all existing cache IDs at once
            const cacheIds = items.map(j => `${unit.key}_${String((j as any).id || "")}`);
            const existingRes = await fetch(
              `${supabaseUrl}/rest/v1/jobs_cache?holdprint_id=in.(${cacheIds.map(id => `"${id}"`).join(",")})&select=holdprint_id,stage,previous_stage`,
              { headers: restHeaders }
            );
            const existingList = await existingRes.json();
            const existingMap = new Map<string, any>();
            if (Array.isArray(existingList)) {
              for (const e of existingList) existingMap.set(e.holdprint_id, e);
            }

            const newRows: any[] = [];
            const movements: any[] = [];

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

              const existing = existingMap.get(cacheId);

              if (!existing) {
                newRows.push({
                  holdprint_id: cacheId,
                  job_number: jobNumber,
                  data: { ...job, _unit_key: unit.key, _unidade: unit.label },
                  stage,
                  last_synced: new Date().toISOString(),
                });
              } else {
                // Update via upsert
                newRows.push({
                  holdprint_id: cacheId,
                  job_number: jobNumber,
                  data: { ...job, _unit_key: unit.key, _unidade: unit.label },
                  stage,
                  previous_stage: existing.stage !== stage ? existing.stage : existing.previous_stage,
                  last_synced: new Date().toISOString(),
                });

                if (existing.stage && existing.stage !== stage) {
                  movements.push({
                    job_id: holdprintId,
                    job_code: (job as any).code || null,
                    job_title: String((job as any).title || "").slice(0, 200),
                    customer_name: String((job as any).customerName || "").slice(0, 200),
                    board_id: "holdprint-sync",
                    board_name: "Holdprint Sync",
                    from_stage_id: existing.stage,
                    from_stage_name: existing.stage,
                    to_stage_id: stage,
                    to_stage_name: stage,
                    moved_by: "Daily Sync",
                    movement_type: "holdprint_sync",
                  });
                }
                epUpdated++;
              }
            }

            // Batch upsert jobs_cache
            for (let i = 0; i < newRows.length; i += 100) {
              const chunk = newRows.slice(i, i + 100);
              const res = await fetch(
                `${supabaseUrl}/rest/v1/jobs_cache?on_conflict=holdprint_id`,
                {
                  method: "POST",
                  headers: { ...restHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
                  body: JSON.stringify(chunk),
                }
              );
              if (!res.ok) {
                const t = await res.text();
                errors.push(`jobs_cache upsert: ${t.slice(0, 150)}`);
              }
            }

            // Insert movements
            if (movements.length > 0) {
              await fetch(`${supabaseUrl}/rest/v1/job_stage_movements`, {
                method: "POST",
                headers: { ...restHeaders, Prefer: "return=minimal" },
                body: JSON.stringify(movements),
              });
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

      console.log(`[sync] Done: ${totalRecords} rec, ${totalInserted} ins, ${totalUpdated} upd, ${errors.length} err in ${Math.round((Date.now() - startTime) / 1000)}s`);
    } catch (e: unknown) {
      const msg = (e as Error).message || "Unknown error";
      console.error("[sync] Fatal:", msg);
      if (logId) {
        await fetch(`${supabaseUrl}/rest/v1/holdprint_sync_log?id=eq.${logId}`, {
          method: "PATCH",
          headers: { ...restHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ finished_at: new Date().toISOString(), status: "error", errors: [msg] }),
        });
      }
    }
  })();

  // Return immediately while background work continues
  return responsePromise;
});
