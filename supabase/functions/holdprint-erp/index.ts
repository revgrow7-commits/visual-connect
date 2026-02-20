const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Use the same API base that works for sync (api-key based)
const HOLDPRINT_BASE = "https://api.holdworks.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { endpoint, method = "GET", payload, unidade = "poa" } = body as {
      endpoint: string;
      method?: string;
      payload?: unknown;
      unidade?: "poa" | "sp";
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

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[holdprint-erp] ${res.status}: ${text.slice(0, 500)}`);
      return new Response(
        JSON.stringify({ error: `Holdprint API error: ${res.status}`, details: text.slice(0, 500) }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[holdprint-erp] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
