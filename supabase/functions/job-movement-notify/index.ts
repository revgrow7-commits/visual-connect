import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://rh-visual.lovable.app";

function buildDeepLink(params: { board_id?: string; stage_id?: string; job_id?: string }) {
  const q = new URLSearchParams();
  if (params.board_id) q.set("board", params.board_id);
  if (params.stage_id) q.set("stage", params.stage_id);
  if (params.job_id) q.set("job", params.job_id);
  return `${APP_URL}/jobs?${q.toString()}`;
}

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
  <!-- Header -->
  <tr><td style="background:#1a2332;padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;font-size:20px;margin:0;letter-spacing:0.5px;">Indústria Visual</h1>
    <p style="color:#8ba3c7;font-size:12px;margin:6px 0 0;">Sistema de Gestão de Jobs</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">
    ${content}
  </td></tr>
  <!-- Footer -->
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

function buildCtaButton(url: string, label: string) {
  return `
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" target="_blank" style="display:inline-block;background:#1DB899;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.3px;">
      ${label}
    </a>
    <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;">Clique para acessar diretamente a etapa no sistema</p>
  </div>`;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Indústria Visual <noreply@industriavisual.com.br>",
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  return { success: res.ok, id: data.id, error: data.message };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "stage_movement";

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

    // ─── Action: Micro board assignment notification ───
    if (action === "micro_board_assigned" || action === "micro_board_completed") {
      const { job_id, job_code, job_title, customer_name, micro_board_name, micro_stage_name, assigned_by, board_id, stage_id } = body;

      // Lookup board members from kanban_boards
      const microBoardId = body.micro_board_id;
      const { data: microBoard } = await adminClient
        .from("kanban_boards")
        .select("members, name")
        .eq("id", microBoardId)
        .maybeSingle();

      const members = (microBoard?.members || []) as Array<{ id: string; nome: string }>;
      const memberIds = members.map(m => m.id);

      // Also try to find by assigned_by name
      const lookupNames = [...members.map(m => m.nome)];
      if (assigned_by && assigned_by !== "Sistema") lookupNames.push(assigned_by);

      // Lookup emails from colaboradores
      const { data: colaboradores } = memberIds.length > 0
        ? await adminClient.from("colaboradores").select("id, nome, email_pessoal").in("id", memberIds)
        : await adminClient.from("colaboradores").select("id, nome, email_pessoal").in("nome", lookupNames);

      const emails = (colaboradores || [])
        .filter(c => c.email_pessoal && c.email_pessoal.includes("@"))
        .map(c => ({ name: c.nome, email: c.email_pessoal! }));

      if (emails.length === 0) {
        return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_emails", searched_members: memberIds.length, searched_names: lookupNames }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jobLabel = job_code ? `Job #${job_code}` : `Job ${job_id}`;
      const deepLink = buildDeepLink({ board_id, stage_id, job_id });
      const isCompleted = action === "micro_board_completed";
      const subject = isCompleted
        ? `✅ ${jobLabel} — Sub-processo "${micro_board_name || microBoard?.name}" concluído`
        : `📋 ${jobLabel} — Enviado ao sub-processo "${micro_board_name || microBoard?.name}"`;

      const badgeColor = isCompleted ? "#16a34a" : "#2563eb";
      const badgeBg = isCompleted ? "#f0fdf4" : "#eff6ff";
      const badgeLabel = isCompleted ? "Sub-processo Concluído" : "Novo Sub-processo";
      const actionMsg = isCompleted
        ? "O sub-processo foi finalizado. Verifique se o job pode avançar para a próxima etapa."
        : "Um job foi enviado ao seu sub-processo. Acesse o sistema para iniciar o trabalho.";

      const htmlContent = emailWrapper(`
        <div style="margin-bottom:20px;">
          <span style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${badgeLabel}</span>
        </div>
        <h2 style="color:#1a2332;font-size:20px;margin:0 0 6px;">📋 ${jobLabel}</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${job_title || "Sem título"}</p>

        <table style="width:100%;font-size:14px;color:#374151;margin-bottom:20px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;width:130px;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${customer_name || "—"}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">Micro Board</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${micro_board_name || microBoard?.name || "—"}</td></tr>
          ${micro_stage_name ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">Etapa</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${micro_stage_name}</td></tr>` : ""}
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">Enviado por</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${assigned_by || "Sistema"}</td></tr>
        </table>

        <div style="background:#fefce8;border-left:3px solid #eab308;border-radius:0 6px 6px 0;padding:12px 16px;margin:20px 0;">
          <p style="color:#854d0e;font-size:13px;margin:0;"><strong>Ação necessária:</strong> ${actionMsg}</p>
        </div>

        ${buildCtaButton(deepLink, "Acessar no Sistema →")}
      `);

      const results = [];
      for (let i = 0; i < emails.length; i++) {
        const recipient = emails[i];
        try {
          if (i > 0) await delay(600);
          const r = await sendEmail(RESEND_API_KEY, recipient.email, subject, htmlContent);
          results.push({ email: recipient.email, ...r });
        } catch (err) {
          results.push({ email: recipient.email, success: false, error: String(err) });
        }
      }

      return new Response(JSON.stringify({ success: true, notified: results.filter(r => r.success).length, results, emails_found: emails.map(e => e.email) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: Item assigned to collaborator ───
    if (action === "item_assignment") {
      const { job_id, job_code, job_title, customer_name, item_names, collaborators, assigned_by, board_id, stage_id } = body;

      const { data: colaboradores } = await adminClient
        .from("colaboradores")
        .select("id, nome, email_pessoal")
        .in("nome", collaborators || []);

      const emails = (colaboradores || [])
        .filter(c => c.email_pessoal && c.email_pessoal.includes("@"))
        .map(c => ({ name: c.nome, email: c.email_pessoal! }));

      if (emails.length === 0) {
        return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_emails" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jobLabel = job_code ? `Job #${job_code}` : `Job ${job_id}`;
      const deepLink = buildDeepLink({ board_id, stage_id, job_id });
      const subject = `📌 ${jobLabel} — Itens atribuídos a você`;

      const htmlContent = emailWrapper(`
        <div style="margin-bottom:20px;">
          <span style="display:inline-block;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">Atribuição de Itens</span>
        </div>
        <h2 style="color:#1a2332;font-size:20px;margin:0 0 6px;">📋 ${jobLabel}</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${job_title || "Sem título"}</p>

        <table style="width:100%;font-size:14px;color:#374151;margin-bottom:20px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;width:130px;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${customer_name || "—"}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">Atribuído por</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${assigned_by || "Sistema"}</td></tr>
        </table>

        <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin-bottom:8px;">
          <p style="font-weight:600;font-size:13px;color:#1e40af;margin:0 0 10px;">Itens atribuídos a você:</p>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;">
            ${(item_names || []).map((n: string) => `<li style="margin-bottom:6px;">${n}</li>`).join("")}
          </ul>
        </div>

        <div style="background:#fefce8;border-left:3px solid #eab308;border-radius:0 6px 6px 0;padding:12px 16px;margin:20px 0;">
          <p style="color:#854d0e;font-size:13px;margin:0;"><strong>Ação necessária:</strong> Acesse o sistema para verificar os detalhes e iniciar o trabalho nos itens atribuídos.</p>
        </div>

        ${buildCtaButton(deepLink, "Acessar Meus Itens →")}
      `);

      const results = [];
      for (let i = 0; i < emails.length; i++) {
        const recipient = emails[i];
        try {
          if (i > 0) await delay(600);
          const r = await sendEmail(RESEND_API_KEY, recipient.email, subject, htmlContent);
          results.push({ email: recipient.email, ...r });
        } catch (err) {
          results.push({ email: recipient.email, success: false, error: String(err) });
        }
      }

      return new Response(JSON.stringify({ success: true, notified: results.filter(r => r.success).length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: Stage movement (default) ───
    const { job_id, job_code, job_title, customer_name, board_id, board_name, from_stage_name, to_stage_name, moved_by } = body;

    // Find to_stage_id from board stages
    const { data: board } = await adminClient
      .from("kanban_boards")
      .select("members, name, stages")
      .eq("id", board_id)
      .maybeSingle();

    if (!board || !board.members) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_members" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const members = board.members as Array<{ id: string; nome: string }>;
    if (members.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "empty_members" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const memberIds = members.map(m => m.id);
    const { data: colaboradores } = await adminClient
      .from("colaboradores")
      .select("id, nome, email_pessoal")
      .in("id", memberIds);

    const emails = (colaboradores || [])
      .filter(c => c.email_pessoal && c.email_pessoal.includes("@"))
      .map(c => ({ name: c.nome, email: c.email_pessoal! }));

    if (emails.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_emails" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find stage_id for the deep link
    const stages = (board.stages || []) as Array<{ id: string; name: string }>;
    const toStage = stages.find(s => s.name === to_stage_name);
    const deepLink = buildDeepLink({ board_id, stage_id: toStage?.id, job_id });

    const jobLabel = job_code ? `Job #${job_code}` : `Job ${job_id}`;
    const subject = `🔄 ${jobLabel} movido para "${to_stage_name}"`;

    const htmlContent = emailWrapper(`
      <div style="margin-bottom:20px;">
        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">Movimentação de Etapa</span>
      </div>
      <h2 style="color:#1a2332;font-size:20px;margin:0 0 6px;">📋 ${jobLabel}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${job_title || "Sem título"}</p>

      <table style="width:100%;font-size:14px;color:#374151;margin-bottom:20px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;width:130px;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${customer_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">Board</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${board_name}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">Movido por</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${moved_by || "Sistema"}</td></tr>
      </table>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="flex:1;background:#fef2f2;border-radius:8px;padding:14px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;text-transform:uppercase;">De</p>
          <p style="color:#dc2626;font-size:15px;font-weight:600;margin:0;">${from_stage_name || "—"}</p>
        </div>
        <div style="font-size:20px;color:#9ca3af;">→</div>
        <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:14px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Para</p>
          <p style="color:#16a34a;font-size:15px;font-weight:600;margin:0;">${to_stage_name}</p>
        </div>
      </div>

      <div style="background:#fefce8;border-left:3px solid #eab308;border-radius:0 6px 6px 0;padding:12px 16px;margin:20px 0;">
        <p style="color:#854d0e;font-size:13px;margin:0;"><strong>Ação necessária:</strong> Verifique o job na nova etapa e execute os procedimentos correspondentes.</p>
      </div>

      ${buildCtaButton(deepLink, `Acessar Etapa "${to_stage_name}" →`)}
    `);

    const results = [];
    for (const recipient of emails) {
      try {
        const r = await sendEmail(RESEND_API_KEY, recipient.email, subject, htmlContent);
        results.push({ email: recipient.email, ...r });
      } catch (err) {
        results.push({ email: recipient.email, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, notified: results.filter(r => r.success).length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
