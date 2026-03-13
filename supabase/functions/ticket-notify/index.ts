const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TicketNotifyPayload {
  ticket_code: string;
  customer_name: string;
  category: string;
  priority: string;
  description: string;
  responsible_name: string;
  responsible_email: string | null;
  responsible_phone: string | null;
  job_code?: number;
  job_title?: string;
}

const priorityLabels: Record<string, string> = {
  critical: "🔴 Crítica",
  high: "🟠 Alta",
  medium: "🟡 Média",
  low: "⚪ Baixa",
};

const categoryLabels: Record<string, string> = {
  delivery_delay: "Atraso na Entrega",
  production_defect: "Defeito de Produção",
  budget_divergence: "Divergência Orçamentária",
  installation: "Instalação",
  other: "Outros",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: TicketNotifyPayload = await req.json();
    const results: { email?: string; whatsapp?: string } = {};

    const message = `📋 *Novo Ticket Atribuído*\n\n` +
      `🎫 Código: ${payload.ticket_code}\n` +
      `👤 Cliente: ${payload.customer_name}\n` +
      `📂 Categoria: ${categoryLabels[payload.category] || payload.category}\n` +
      `⚡ Prioridade: ${priorityLabels[payload.priority] || payload.priority}\n` +
      (payload.job_code ? `🔧 Job: #${payload.job_code} ${payload.job_title || ""}\n` : "") +
      `\n📝 ${payload.description.slice(0, 200)}${payload.description.length > 200 ? "..." : ""}\n\n` +
      `Acesse o sistema para mais detalhes.`;

    // Send Email via Resend
    if (payload.responsible_email) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Indústria Visual <noreply@industriavisual.com.br>",
              to: [payload.responsible_email],
              subject: `[${payload.ticket_code}] Ticket atribuído — ${payload.customer_name} (${priorityLabels[payload.priority] || payload.priority})`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <h2 style="color:#1DB899">📋 Novo Ticket Atribuído</h2>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:8px;font-weight:bold">Código:</td><td style="padding:8px">${payload.ticket_code}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold">Cliente:</td><td style="padding:8px">${payload.customer_name}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold">Categoria:</td><td style="padding:8px">${categoryLabels[payload.category] || payload.category}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold">Prioridade:</td><td style="padding:8px">${priorityLabels[payload.priority] || payload.priority}</td></tr>
                    ${payload.job_code ? `<tr><td style="padding:8px;font-weight:bold">Job:</td><td style="padding:8px">#${payload.job_code} ${payload.job_title || ""}</td></tr>` : ""}
                    <tr><td style="padding:8px;font-weight:bold">Responsável:</td><td style="padding:8px">${payload.responsible_name}</td></tr>
                  </table>
                  <div style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:8px">
                    <strong>Descrição:</strong><br/>
                    <p>${payload.description}</p>
                  </div>
                  <p style="margin-top:16px;color:#666;font-size:12px">Este é um email automático do sistema de CS.</p>
                </div>
              `,
            }),
          });
          const emailData = await emailRes.json();
          results.email = emailRes.ok ? "sent" : `failed: ${JSON.stringify(emailData)}`;
          console.log("Email result:", results.email);
        } catch (e) {
          results.email = `error: ${(e as Error).message}`;
          console.error("Email error:", e);
        }
      } else {
        results.email = "skipped: RESEND_API_KEY not configured";
      }
    } else {
      results.email = "skipped: no email";
    }

    // Send WhatsApp via Z-API
    if (payload.responsible_phone) {
      const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
      const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
      const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

      if (ZAPI_INSTANCE_ID && ZAPI_TOKEN) {
        try {
          // Clean phone number
          const phone = payload.responsible_phone.replace(/\D/g, "");
          const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;

          const whatsRes = await fetch(
            `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(ZAPI_CLIENT_TOKEN ? { "Client-Token": ZAPI_CLIENT_TOKEN } : {}),
              },
              body: JSON.stringify({
                phone: fullPhone,
                message: message,
              }),
            }
          );
          const whatsData = await whatsRes.json();
          results.whatsapp = whatsRes.ok ? "sent" : `failed: ${JSON.stringify(whatsData)}`;
          console.log("WhatsApp result:", results.whatsapp);
        } catch (e) {
          results.whatsapp = `error: ${(e as Error).message}`;
          console.error("WhatsApp error:", e);
        }
      } else {
        results.whatsapp = "skipped: Z-API not configured";
      }
    } else {
      results.whatsapp = "skipped: no phone";
    }

    // Also log to whatsapp_logs table if WhatsApp was sent
    if (payload.responsible_phone && results.whatsapp === "sent") {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const phone = payload.responsible_phone.replace(/\D/g, "");
        const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;

        await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            phone: fullPhone,
            customer_name: payload.responsible_name,
            direction: "outbound",
            message: message,
            origin: "ticket",
            origin_id: payload.ticket_code,
            status: "sent",
            sent_at: new Date().toISOString(),
            sent_by: "Sistema CS",
          }),
        });
      } catch (e) {
        console.error("Failed to log WhatsApp message:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ticket-notify error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
