const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-holdprint-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDPRINT_BASE =
  "https://holdprint-web-api-prod.ashywater-71a7e517.eastus2.azurecontainerapps.io/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { endpoint, method = "POST", payload, token } = body as {
      endpoint: string;
      method?: string;
      payload?: unknown;
      token?: string;
    };

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "endpoint is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bearerToken = token || Deno.env.get("HOLDPRINT_API_KEY") || "";
    if (!bearerToken) {
      return new Response(
        JSON.stringify({ error: "No Holdprint token configured" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = `${HOLDPRINT_BASE}${endpoint}`;
    console.log(`[holdprint-erp] ${method} ${url}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
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
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
