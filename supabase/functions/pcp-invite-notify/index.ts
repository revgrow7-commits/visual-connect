import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://rh-visual.lovable.app";
const LOGO_URL = "https://ezewikxdukboalcybrfs.supabase.co/storage/v1/object/public/job-files/email-assets%2Flogo-iv.jpg";

// Brand colors from identity
const BRAND = {
  primary: "#7A1B1B",       // Bordo — hsl(350, 67%, 37%)
  primaryDark: "#5a1414",
  secondary: "#6B2A5C",     // Roxo — hsl(320, 43%, 22%)
  accent: "#1DB899",        // Verde CTA
  bg: "#f4f0f5",            // Lilás claro
  cardBg: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  border: "#e5e0e8",
  tagBg: "#fef2f2",
  tagColor: "#991b1b",
  memberBg: "#f3e8ff",
  memberColor: "#6b21a8",
};

function timestamp() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function buildDeepLink(params: { board_id?: string; stage_id?: string; job_id?: string }) {
  const q = new URLSearchParams();
  if (params.board_id) q.set("board", params.board_id);
  if (params.stage_id) q.set("stage", params.stage_id);
  if (params.job_id) q.set("job", params.job_id);
  return `${APP_URL}/jobs?${q.toString()}`;
}

function buildTagsHtml(tags: Array<{ nome: string; cor: string }>) {
  if (!tags || tags.length === 0) return "";
  return tags.map(t => {
    const bgColor = t.cor || BRAND.tagBg;
    return `<span style="display:inline-block;background:${bgColor};color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;margin:3px 4px 3px 0;letter-spacing:0.3px;">${t.nome}</span>`;
  }).join("");
}

function buildMembersHtml(members: Array<{ nome: string }>) {
  if (!members || members.length === 0) return "<em style='color:#9ca3af;'>Nenhum membro atribuído</em>";
  return members.map(m =>
    `<span style="display:inline-block;background:${BRAND.memberBg};color:${BRAND.memberColor};font-size:12px;font-weight:500;padding:5px 12px;border-radius:20px;margin:3px 4px 3px 0;">👤 ${m.nome}</span>`
  ).join("");
}

function buildItemsHtml(items: Array<{ name: string; dimensions?: string; quantity?: number }>) {
  if (!items || items.length === 0) return "";
  const rows = items.map((item, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.text};font-weight:500;">${i + 1}. ${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.textMuted};text-align:center;">${item.dimensions || "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.textMuted};text-align:center;">${item.quantity || 1}</td>
    </tr>
  `).join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0 8px;">
      <tr style="background:${BRAND.bg};">
        <th style="padding:8px 12px;font-size:11px;color:${BRAND.textMuted};text-align:left;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Item</th>
        <th style="padding:8px 12px;font-size:11px;color:${BRAND.textMuted};text-align:center;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Dimensões</th>
        <th style="padding:8px 12px;font-size:11px;color:${BRAND.textMuted};text-align:center;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Qtd</th>
      </tr>
      ${rows}
    </table>`;
}

function buildEmail(data: {
  recipientName: string;
  jobCode: string;
  jobTitle: string;
  customerName: string;
  boardName: string;
  stageName: string;
  deliveryDate?: string;
  value?: string;
  tags: Array<{ nome: string; cor: string }>;
  members: Array<{ nome: string }>;
  items: Array<{ name: string; dimensions?: string; quantity?: number }>;
  deepLink: string;
  invitedBy: string;
}) {
  const {
    recipientName, jobCode, jobTitle, customerName, boardName, stageName,
    deliveryDate, value, tags, members, items, deepLink, invitedBy
  } = data;

  const tagsHtml = buildTagsHtml(tags);
  const membersHtml = buildMembersHtml(members);
  const itemsHtml = buildItemsHtml(items);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Portal Indústria Visual — Convite PCP</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
<tr><td align="center">

<!-- Main Card -->
<table width="640" cellpadding="0" cellspacing="0" style="background:${BRAND.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(122,27,27,0.08);">

  <!-- Header Gradient -->
  <tr><td style="background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%);padding:36px 32px 28px;text-align:center;">
    <img src="${LOGO_URL}" alt="Indústria Visual" width="64" height="64" style="display:block;margin:0 auto 16px;border-radius:50%;border:3px solid rgba(255,255,255,0.3);" />
    <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px;font-weight:700;letter-spacing:0.3px;">Portal Indústria Visual</h1>
    <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;letter-spacing:1px;text-transform:uppercase;">Planejamento e Controle de Produção</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:32px 32px 0;">
    <p style="color:${BRAND.text};font-size:16px;margin:0 0 6px;">Olá, <strong>${recipientName}</strong>! 👋</p>
    <p style="color:${BRAND.textMuted};font-size:14px;line-height:1.6;margin:0;">
      Você foi convidado(a) por <strong>${invitedBy}</strong> para integrar o processo de produção do job abaixo. Sua participação é fundamental para garantir a qualidade e o prazo de entrega.
    </p>
  </td></tr>

  <!-- Job Card -->
  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;border:1px solid ${BRAND.border};overflow:hidden;">
      
      <!-- Job Header -->
      <tr><td style="background:${BRAND.primary};padding:14px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">JOB</span>
              <h2 style="color:#ffffff;font-size:20px;margin:2px 0 0;font-weight:700;">#${jobCode}</h2>
            </td>
            <td style="text-align:right;vertical-align:top;">
              ${value ? `<span style="background:rgba(255,255,255,0.2);color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:8px;">R$ ${value}</span>` : ""}
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Job Details -->
      <tr><td style="padding:20px;">
        <p style="color:${BRAND.text};font-size:15px;font-weight:600;margin:0 0 16px;">${jobTitle}</p>

        <table style="width:100%;font-size:13px;color:${BRAND.text};">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};width:130px;font-weight:600;color:${BRAND.textMuted};">🏢 Cliente</td>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:500;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:600;color:${BRAND.textMuted};">📋 Board</td>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:500;">${boardName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:600;color:${BRAND.textMuted};">🔄 Etapa Atual</td>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};">
              <span style="background:${BRAND.primary};color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">${stageName}</span>
            </td>
          </tr>
          ${deliveryDate ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:600;color:${BRAND.textMuted};">📅 Entrega</td>
            <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:600;color:#dc2626;">${deliveryDate}</td>
          </tr>` : ""}
        </table>

        <!-- Tags -->
        ${tagsHtml ? `
        <div style="margin:16px 0 0;">
          <p style="font-size:11px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin:0 0 8px;">🏷️ Etiquetas</p>
          <div>${tagsHtml}</div>
        </div>` : ""}

        <!-- Members -->
        <div style="margin:16px 0 0;">
          <p style="font-size:11px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin:0 0 8px;">👥 Equipe Envolvida</p>
          <div>${membersHtml}</div>
        </div>

        <!-- Items -->
        ${itemsHtml ? `
        <div style="margin:16px 0 0;">
          <p style="font-size:11px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin:0 0 4px;">📦 Itens do Job</p>
          ${itemsHtml}
        </div>` : ""}
      </td></tr>
    </table>
  </td></tr>

  <!-- Action callout -->
  <tr><td style="padding:0 32px;">
    <div style="background:linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%);border-left:4px solid #eab308;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="color:#854d0e;font-size:13px;margin:0;line-height:1.5;">
        <strong>⚡ Ação necessária:</strong> Acesse o Portal para verificar os detalhes completos, acompanhar o andamento e executar suas tarefas no processo de produção.
      </p>
    </div>
  </td></tr>

  <!-- CTA Button -->
  <tr><td style="padding:28px 32px;text-align:center;">
    <a href="${deepLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%);color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(122,27,27,0.25);">
      Acessar Portal PCP →
    </a>
    <p style="color:${BRAND.textLight};font-size:11px;margin:10px 0 0;">Clique para acessar diretamente o job no sistema</p>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 32px;">
    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:0;" />
  </td></tr>

  <!-- What to expect -->
  <tr><td style="padding:24px 32px;">
    <p style="font-size:13px;font-weight:700;color:${BRAND.text};margin:0 0 12px;">📌 O que você encontra no Portal:</p>
    <table style="width:100%;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      <tr><td style="padding:3px 0;">✅ Quadro Kanban com todas as etapas do job</td></tr>
      <tr><td style="padding:3px 0;">✅ Checklist de tarefas e responsabilidades</td></tr>
      <tr><td style="padding:3px 0;">✅ Comentários e histórico de movimentações</td></tr>
      <tr><td style="padding:3px 0;">✅ Anexos, links e documentos relacionados</td></tr>
      <tr><td style="padding:3px 0;">✅ Prazos e alertas de entrega</td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%);padding:24px 32px;text-align:center;">
    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0 0 4px;">
      Notificação automática — ${timestamp()}
    </p>
    <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:0;font-weight:600;letter-spacing:1px;">
      C.R.I.E. — Criar · Relevância · Inovação · Eficiência
    </p>
    <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:8px 0 0;">
      © ${new Date().getFullYear()} Indústria Visual — Todos os direitos reservados
    </p>
  </td></tr>

</table>
<!-- /Main Card -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      recipients,       // Array<{ name: string; email: string }>
      job_id,
      job_code,
      job_title,
      customer_name,
      board_id,
      board_name,
      stage_id,
      stage_name,
      delivery_date,
      value,
      tags,             // Array<{ nome: string; cor: string }>
      members,          // Array<{ nome: string }>
      items,            // Array<{ name: string; dimensions?: string; quantity?: number }>
      invited_by,
    } = body;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deepLink = buildDeepLink({ board_id, stage_id, job_id });

    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      try {
        if (i > 0) await delay(600);

        const html = buildEmail({
          recipientName: recipient.name,
          jobCode: job_code || "—",
          jobTitle: job_title || "Sem título",
          customerName: customer_name || "—",
          boardName: board_name || "Produção",
          stageName: stage_name || "—",
          deliveryDate: delivery_date,
          value,
          tags: tags || [],
          members: members || [],
          items: items || [],
          deepLink,
          invitedBy: invited_by || "Sistema",
        });

        const subject = `🏭 Job #${job_code || "—"} — Você foi convidado(a) para o PCP | ${customer_name || ""}`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Portal Indústria Visual <noreply@industriavisual.com.br>",
            to: [recipient.email],
            subject,
            html,
          }),
        });

        const data = await res.json();
        console.log(`[pcp-invite] Resend ${recipient.email}: status=${res.status}`, JSON.stringify(data));
        results.push({ email: recipient.email, success: res.ok, id: data.id, error: data.message });
      } catch (err) {
        results.push({ email: recipient.email, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notified: results.filter(r => r.success).length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[pcp-invite] Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
