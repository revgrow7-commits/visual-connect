const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    if (!EVOLUTION_API_KEY) {
      return new Response(JSON.stringify({ error: "EVOLUTION_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "https://api.evolution-api.com";

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "fetch-instances";

    let endpoint = "";
    let method = "GET";
    let body: string | undefined;

    switch (action) {
      case "fetch-instances":
        endpoint = "/instance/fetchInstances";
        break;
      case "send-text": {
        endpoint = "/message/sendText";
        method = "POST";
        const reqBody = await req.json();
        body = JSON.stringify({
          number: reqBody.number,
          text: reqBody.text,
          delay: reqBody.delay || 1200,
        });
        const instanceName = reqBody.instanceName;
        if (instanceName) {
          endpoint = `/message/sendText/${instanceName}`;
        }
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error(`Evolution API error [${response.status}]:`, data);
      return new Response(JSON.stringify({ error: "Evolution API error", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
