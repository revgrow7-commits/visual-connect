import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      job_id,
      job_code,
      job_title,
      customer_name,
      board_id,
      board_name,
      from_stage_name,
      to_stage_name,
      moved_by,
    } = await req.json();

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

    // Get board members to notify
    const { data: board } = await adminClient
      .from("kanban_boards")
      .select("members, name")
      .eq("id", board_id)
      .maybeSingle();

    if (!board || !board.members) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_members" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const members = board.members as Array<{ id: string; nome: string; cargo?: string }>;
    if (members.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "empty_members" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get emails of member collaborators
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

    const jobLabel = job_code ? `Job #${job_code}` : `Job ${job_id}`;
    const subject = `🔄 ${jobLabel} movido para "${to_stage_name}" — ${board_name}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a2332; font-size: 22px; margin: 0;">Indústria Visual</h1>
          <p style="color: #6b7280; font-size: 13px;">Notificação de Movimentação</p>
        </div>
        <div style="background: #f0fdf4; border-left: 4px solid #1DB899; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1a2332; font-size: 18px; margin: 0 0 12px 0;">📋 ${jobLabel} — ${job_title || "Sem título"}</h2>
          <table style="font-size: 14px; color: #374151; line-height: 1.8;">
            <tr><td style="font-weight: 600; padding-right: 12px;">Cliente:</td><td>${customer_name || "—"}</td></tr>
            <tr><td style="font-weight: 600; padding-right: 12px;">Board:</td><td>${board_name}</td></tr>
            <tr><td style="font-weight: 600; padding-right: 12px;">De:</td><td><span style="background:#fee2e2;padding:2px 8px;border-radius:4px;">${from_stage_name || "—"}</span></td></tr>
            <tr><td style="font-weight: 600; padding-right: 12px;">Para:</td><td><span style="background:#d1fae5;padding:2px 8px;border-radius:4px;font-weight:600;">${to_stage_name}</span></td></tr>
            <tr><td style="font-weight: 600; padding-right: 12px;">Movido por:</td><td>${moved_by || "Sistema"}</td></tr>
            <tr><td style="font-weight: 600; padding-right: 12px;">Data/Hora:</td><td>${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="https://rh-visual.lovable.app/jobs" style="display: inline-block; background: #1a2332; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Ver no Kanban →
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">
          Você recebe esta notificação por ser membro do board "${board_name}".<br/>
          © ${new Date().getFullYear()} Indústria Visual
        </p>
      </div>
    `;

    // Send emails to all board members
    const results = [];
    for (const recipient of emails) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Jobs - Indústria Visual <mayara@industriavisual.com.br>",
            to: [recipient.email],
            subject,
            html: htmlBody,
          }),
        });
        const data = await res.json();
        results.push({ email: recipient.email, success: res.ok, id: data.id });
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
