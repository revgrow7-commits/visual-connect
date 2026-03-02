import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE = "https://api.holdworks.ai";
const FETCH_TIMEOUT_MS = 15000; // 15s timeout
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok || attempt === retries) return res;
      // Retry on 5xx
      if (res.status >= 500) {
        console.warn(`[holdprint-erp] Attempt ${attempt + 1} failed with ${res.status}, retrying...`);
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e: unknown) {
      if (attempt === retries) throw e;
      console.warn(`[holdprint-erp] Attempt ${attempt + 1} error: ${(e as Error).message}, retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Max retries reached");
}

function extractEndpointAndRecordHint(endpoint: string): { resource: string; isList: boolean } {
  // e.g. /api-key/customers/data?page=1&limit=20 -> customers, isList
  const match = endpoint.match(/\/api-key\/([^/]+)\/data/);
  if (match) return { resource: match[1], isList: true };
  return { resource: "", isList: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { endpoint, method = "GET", payload, unidade = "poa", useCacheFallback = true } = body as {
      endpoint: string;
      method?: string;
      payload?: unknown;
      unidade?: "poa" | "sp";
      useCacheFallback?: boolean;
    };

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "endpoint is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenKey = unidade === "sp" ? "HOLDPRINT_TOKEN_SP" : "HOLDPRINT_TOKEN_POA";
    const apiKey = Deno.env.get(tokenKey) || "";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `No Holdprint token configured for ${unidade}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${HOLDPRINT_BASE}${endpoint}`;
    console.log(`[holdprint-erp] ${method} ${url} (${unidade})`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    };

    if (method !== "GET" && payload !== undefined) {
      fetchOptions.body = JSON.stringify(payload);
    }

    try {
      const res = await fetchWithRetry(url, fetchOptions);

      if (!res.ok) {
        const text = await res.text();
        console.error(`[holdprint-erp] ${res.status}: ${text.slice(0, 500)}`);

        // Try cache fallback on API failure
        if (useCacheFallback && method === "GET") {
          const cached = await getCachedData(endpoint, unidade);
          if (cached) {
            console.log(`[holdprint-erp] Returning cached data (${cached.length} records)`);
            return new Response(JSON.stringify({ data: cached, _cached: true }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        return new Response(
          JSON.stringify({ error: `Holdprint API error: ${res.status}`, details: text.slice(0, 500) }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchErr: unknown) {
      const msg = (fetchErr as Error).message || "Network error";
      console.error(`[holdprint-erp] Fetch failed: ${msg}`);

      // Fallback to cache on network failure
      if (useCacheFallback && method === "GET") {
        const cached = await getCachedData(endpoint, unidade);
        if (cached) {
          console.log(`[holdprint-erp] API unreachable, returning cached data (${cached.length} records)`);
          return new Response(JSON.stringify({ data: cached, _cached: true, _error: msg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[holdprint-erp] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getCachedData(endpoint: string, unidade: string): Promise<Record<string, unknown>[] | null> {
  try {
    const { resource, isList } = extractEndpointAndRecordHint(endpoint);
    if (!isList || !resource) return null;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await sb
      .from("holdprint_cache")
      .select("raw_data")
      .eq("endpoint", resource)
      .like("record_id", `${unidade}_%`)
      .order("last_synced", { ascending: false })
      .limit(500);

    if (error || !data?.length) return null;
    return data.map((r: { raw_data: Record<string, unknown> }) => r.raw_data);
  } catch {
    return null;
  }
}
