const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { to } = await req.json();
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  console.log("[test-email] Sending to:", to);
  console.log("[test-email] API key present:", !!RESEND_API_KEY);
  console.log("[test-email] API key starts with:", RESEND_API_KEY?.substring(0, 8));

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Indústria Visual <noreply@industriavisual.com.br>",
      to: [to],
      subject: "Teste de Email - Indústria Visual",
      html: "<h1>Teste</h1><p>Este é um email de teste do sistema.</p>",
    }),
  });
  
  const data = await res.json();
  console.log("[test-email] Resend status:", res.status, JSON.stringify(data));

  return new Response(JSON.stringify({ status: res.status, data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
