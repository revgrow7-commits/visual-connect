import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://rh-visual.lovable.app";

function timestamp() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function emailWrapper(content: string) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
  <tr><td style="background:#1a2332;padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;font-size:20px;margin:0;letter-spacing:0.5px;">Indústria Visual</h1>
    <p style="color:#8ba3c7;font-size:12px;margin:6px 0 0;">Comunicação Interna</p>
  </td></tr>
  <tr><td style="padding:32px;">
    ${content}
  </td></tr>
  <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">
      Notificação automática — ${timestamp()}<br/>
      © ${new Date().getFullYear()} Indústria Visual
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmail(apiKey: string, to: string[], subject: string, html: string) {
  const results = [];

  for (let i = 0; i < to.length; i++) {
    const email = to[i];
    try {
      // Rate limit: max 2 req/s — wait 600ms between each
      if (i > 0) await delay(600);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Indústria Visual <noreply@industriavisual.com.br>",
          to: [email],
          subject,
          html,
        }),
      });
      const data = await res.json();
      console.log(`[notify-comunicado] Resend response for ${email}: status=${res.status}`, JSON.stringify(data));
      results.push({ email, success: res.ok, id: data.id, error: data.message });
    } catch (err) {
      results.push({ email, success: false, error: String(err) });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comunicado_id, titulo, conteudo, categoria, unidade } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get collaborators to notify based on unit
    let query = adminClient
      .from("colaboradores")
      .select("nome, email_pessoal, unidade")
      .eq("status", "ativo");

    if (unidade && unidade !== "Todas") {
      query = query.eq("unidade", unidade);
    }

    const { data: colaboradores } = await query;

    const emails = (colaboradores || [])
      .filter(c => c.email_pessoal && c.email_pessoal.includes("@"))
      .map(c => c.email_pessoal!);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_emails" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoriaColors: Record<string, { bg: string; color: string }> = {
      "Geral": { bg: "#eff6ff", color: "#2563eb" },
      "RH": { bg: "#fdf2f8", color: "#db2777" },
      "Operação": { bg: "#f0fdf4", color: "#16a34a" },
      "Financeiro": { bg: "#fefce8", color: "#ca8a04" },
      "Segurança": { bg: "#fef2f2", color: "#dc2626" },
    };

    const catStyle = categoriaColors[categoria] || categoriaColors["Geral"];

    const subject = `📢 Novo Comunicado: ${titulo}`;

    const previewText = conteudo
      ? conteudo.replace(/<[^>]*>/g, "").substring(0, 200)
      : "Acesse o sistema para ver o comunicado completo.";

    const htmlContent = emailWrapper(`
      <div style="margin-bottom:20px;">
        <span style="display:inline-block;background:${catStyle.bg};color:${catStyle.color};font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${categoria}</span>
        ${unidade !== "Todas" ? `<span style="display:inline-block;background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;margin-left:6px;">${unidade}</span>` : ""}
      </div>

      <h2 style="color:#1a2332;font-size:22px;margin:0 0 12px;">📢 ${titulo}</h2>

      <div style="color:#374151;font-size:14px;line-height:1.7;margin-bottom:24px;">
        ${previewText}${conteudo && conteudo.length > 200 ? "..." : ""}
      </div>

      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${APP_URL}" target="_blank" style="display:inline-block;background:#1DB899;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.3px;">
          Ver Comunicado Completo →
        </a>
      </div>
    `);

    const results = await sendEmail(RESEND_API_KEY, emails, subject, htmlContent);
    const sent = results.filter(r => r.success).length;

    return new Response(JSON.stringify({
      success: true,
      notified: sent,
      total_recipients: emails.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-comunicado error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
