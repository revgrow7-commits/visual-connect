const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE = "https://api.holdworks.ai";

const UNITS = [
  { key: "poa", envVar: "HOLDPRINT_TOKEN_POA" },
  { key: "sp", envVar: "HOLDPRINT_TOKEN_SP" },
];

interface SyncResult {
  inserted: number;
  updated: number;
  stage_changes: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Parse optional body params
    let dateFrom: string | undefined;
    let dateTo: string | undefined;
    try {
      const body = await req.json();
      dateFrom = body.date_from;
      dateTo = body.date_to;
    } catch { /* no body is fine */ }

    const now = new Date();
    if (!dateFrom) {
      const d = new Date(now.getTime() - 7 * 86400000);
      dateFrom = d.toISOString().split("T")[0];
    }
    if (!dateTo) {
      dateTo = now.toISOString().split("T")[0];
    }

    console.log(`[sync-holdprint-jobs] Syncing from ${dateFrom} to ${dateTo}`);

    const allJobs: any[] = [];

    // Fetch from both units (same pattern as cs-holdprint-data)
    for (const unit of UNITS) {
      const apiKey = Deno.env.get(unit.envVar) || "";
      if (!apiKey) {
        console.log(`[sync-holdprint-jobs] No token for ${unit.key}, skipping`);
        continue;
      }

      let page = 1;
      const maxPages = 10;
      while (page <= maxPages) {
        const url = new URL(`${HOLDPRINT_BASE}/api-key/jobs/data`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", "100");
        url.searchParams.set("startDate", dateFrom!);
        url.searchParams.set("endDate", dateTo!);
        url.searchParams.set("language", "pt-BR");

        try {
          const res = await fetch(url.toString(), {
            headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
          });

          if (!res.ok) {
            const text = await res.text();
            console.warn(`[sync-holdprint-jobs] ${unit.key} p${page} → ${res.status}: ${text.slice(0, 200)}`);
            break;
          }

          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("json")) {
            await res.text();
            console.warn(`[sync-holdprint-jobs] ${unit.key} p${page} non-JSON response`);
            break;
          }

          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.data || data.items || []);
          if (items.length === 0) break;

          // Tag with unit key
          for (const item of items) {
            item._unit_key = unit.key;
          }
          allJobs.push(...items);
          page++;
        } catch (e: unknown) {
          console.warn(`[sync-holdprint-jobs] ${unit.key} p${page} fetch error:`, (e as any).message);
          break;
        }
      }
    }

    console.log(`[sync-holdprint-jobs] Fetched ${allJobs.length} jobs total`);

    if (allJobs.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No jobs fetched", inserted: 0, updated: 0, stage_changes: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await syncJobsToCache(allJobs, supabaseUrl, supabaseKey);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[sync-holdprint-jobs] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function syncJobsToCache(
  jobs: any[],
  supabaseUrl: string,
  supabaseKey: string,
): Promise<SyncResult> {
  const result: SyncResult = { inserted: 0, updated: 0, stage_changes: 0, errors: [] };
  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  for (const job of jobs) {
    try {
      const holdprintId = String(job.id || job.jobId || "");
      if (!holdprintId) continue;

      const unitKey = job._unit_key || "poa";
      const cacheId = `${unitKey}_${holdprintId}`;
      const jobNumber = String(job.code ? `J${job.code}` : job.jobNumber || holdprintId);
      const stage = String(
        job.currentProductionStepName ||
        job.productionStatus ||
        job.status ||
        "Revisão Comercial"
      );

      // Check if exists in cache
      const getRes = await fetch(
        `${supabaseUrl}/rest/v1/jobs_cache?holdprint_id=eq.${encodeURIComponent(cacheId)}&select=id,stage,job_number`,
        { headers }
      );
      const existing = await getRes.json();

      if (!existing || existing.length === 0) {
        const insertRes = await fetch(`${supabaseUrl}/rest/v1/jobs_cache`, {
          method: "POST",
          headers: { ...headers, "Prefer": "return=minimal" },
          body: JSON.stringify({
            holdprint_id: cacheId,
            job_number: jobNumber,
            data: job,
            stage,
            last_synced: new Date().toISOString(),
          }),
        });
        if (insertRes.ok) result.inserted++;
        else {
          const t = await insertRes.text();
          result.errors.push(`Insert ${jobNumber}: ${t.slice(0, 100)}`);
        }
      } else {
        const cached = existing[0];
        const previousStage = cached.stage;

        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/jobs_cache?holdprint_id=eq.${encodeURIComponent(cacheId)}`,
          {
            method: "PATCH",
            headers: { ...headers, "Prefer": "return=minimal" },
            body: JSON.stringify({
              data: job,
              stage,
              previous_stage: previousStage !== stage ? previousStage : cached.previous_stage,
              last_synced: new Date().toISOString(),
            }),
          }
        );
        if (updateRes.ok) result.updated++;
        else {
          const t = await updateRes.text();
          result.errors.push(`Update ${jobNumber}: ${t.slice(0, 100)}`);
        }

        // Detect stage change
        if (previousStage && previousStage !== stage) {
          result.stage_changes++;
          const movRes = await fetch(`${supabaseUrl}/rest/v1/job_stage_movements`, {
            method: "POST",
            headers: { ...headers, "Prefer": "return=minimal" },
            body: JSON.stringify({
              job_id: holdprintId,
              job_code: job.code || null,
              job_title: String(job.title || job.description || "").slice(0, 200),
              customer_name: String(job.customerName || job.customer?.name || "").slice(0, 200),
              board_id: "holdprint-sync",
              board_name: "Holdprint Sync",
              from_stage_id: previousStage,
              from_stage_name: previousStage,
              to_stage_id: stage,
              to_stage_name: stage,
              moved_by: "Holdprint Sync",
              movement_type: "holdprint_sync",
              metadata: { source: "sync", detected_at: new Date().toISOString() },
            }),
          });
          if (!movRes.ok) {
            const t = await movRes.text();
            result.errors.push(`Movement ${jobNumber}: ${t.slice(0, 100)}`);
          }
        }
      }
    } catch (e: unknown) {
      result.errors.push((e as any).message || "Unknown error");
    }
  }

  console.log(`[sync-holdprint-jobs] Done: +${result.inserted} ins, ${result.updated} upd, ${result.stage_changes} moves, ${result.errors.length} err`);
  return result;
}
