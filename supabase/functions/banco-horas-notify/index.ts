const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RECIPIENTS = [
  "bruno@industriavisual.com.br",
  "vivian@industriavisual.com.br",
  "marcelo@industriavisual.com.br",
  "mayara@industriavisual.com.br",
];

interface AlertaColaborador {
  nome: string;
  cargo: string;
  departamento: string;
  saldo: string;
  saldoDecimal: number;
  ex60: string;
  ex80: string;
  ex100: string;
  passivo: number;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { alertas, competencia, resumo } = await req.json() as {
      alertas: AlertaColaborador[];
      competencia: string;
      resumo: {
        total: number;
        conformes: number;
        urgentes: number;
        criticos: number;
        conformidade: number;
        passivoTotal: number;
        saldoTotal: number;
      };
    };

    if (!alertas || alertas.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_alerts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatCurrency = (v: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

    const criticalRows = alertas
      .filter(a => a.status === "critico")
      .map(a => `
        <tr style="background: #fef2f2;">
          <td style="padding: 8px 12px; border-bottom: 1px solid #fee2e2; font-weight: 600;">🔴 ${a.nome}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fee2e2;">${a.cargo}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fee2e2;">${a.departamento}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fee2e2; font-family: monospace; font-weight: bold; color: #dc2626;">${a.saldo}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fee2e2; font-family: monospace; color: #dc2626;">${formatCurrency(a.passivo)}</td>
        </tr>
      `).join("");

    const urgentRows = alertas
      .filter(a => a.status === "urgente")
      .map(a => `
        <tr style="background: #fffbeb;">
          <td style="padding: 8px 12px; border-bottom: 1px solid #fef3c7; font-weight: 600;">⚠️ ${a.nome}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fef3c7;">${a.cargo}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fef3c7;">${a.departamento}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fef3c7; font-family: monospace; font-weight: bold; color: #d97706;">${a.saldo}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fef3c7; font-family: monospace; color: #d97706;">${formatCurrency(a.passivo)}</td>
        </tr>
      `).join("");

    const dataFormatada = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const horaFormatada = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    const subject = `⚠️ Alertas Banco de Horas — ${competencia} | ${alertas.filter(a => a.status === "critico").length} críticos, ${alertas.filter(a => a.status === "urgente").length} urgentes`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a2332; font-size: 22px; margin: 0;">Indústria Visual</h1>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Relatório de Conformidade — Banco de Horas</p>
        </div>

        <!-- Resumo -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #1a2332; font-size: 16px; margin: 0 0 16px;">📊 Resumo — Competência ${competencia}</h2>
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr>
              <td style="padding: 6px 0;">
                <span style="background: ${resumo.conformidade >= 95 ? '#d1fae5' : resumo.conformidade >= 70 ? '#fef3c7' : '#fee2e2'}; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 18px;">
                  ${resumo.conformidade}%
                </span>
                <span style="margin-left: 8px; color: #6b7280;">Conformidade CCT</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <strong>${resumo.total}</strong> colaboradores · 
                <span style="color: #10b981;">✅ ${resumo.conformes} conformes</span> · 
                <span style="color: #d97706;">⚠️ ${resumo.urgentes} urgentes</span> · 
                <span style="color: #dc2626;">🔴 ${resumo.criticos} críticos</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                Passivo projetado: <strong style="color: #dc2626;">${formatCurrency(resumo.passivoTotal)}</strong> · 
                Saldo total: <strong>${resumo.saldoTotal >= 0 ? "+" : ""}${resumo.saldoTotal.toFixed(1)}h</strong>
              </td>
            </tr>
          </table>
        </div>

        ${alertas.filter(a => a.status === "critico").length > 0 ? `
        <!-- Críticos -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #dc2626; font-size: 15px; margin: 0 0 12px;">🔴 Colaboradores Críticos (saldo > 40h)</h3>
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">Ação: Pagar como extras com adicionais CCT (Cl. 10) até 2ª folha (Cl. 41.3)</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #fef2f2;">
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fecaca;">Nome</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fecaca;">Cargo</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fecaca;">Setor</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fecaca;">Saldo</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fecaca;">Passivo</th>
              </tr>
            </thead>
            <tbody>${criticalRows}</tbody>
          </table>
        </div>
        ` : ""}

        ${alertas.filter(a => a.status === "urgente").length > 0 ? `
        <!-- Urgentes -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #d97706; font-size: 15px; margin: 0 0 12px;">⚠️ Colaboradores em Alerta (saldo > 20h)</h3>
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">Ação: Agendar compensação FIFO imediata. Prazo CCT: 60 dias/quinzena (Cl. 41.2)</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #fffbeb;">
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fef3c7;">Nome</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fef3c7;">Cargo</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fef3c7;">Setor</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fef3c7;">Saldo</th>
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #fef3c7;">Passivo</th>
              </tr>
            </thead>
            <tbody>${urgentRows}</tbody>
          </table>
        </div>
        ` : ""}

        <!-- Base Legal -->
        <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #1e40af; margin: 0;"><strong>Base Legal:</strong> CCT EAA × SESCON-SP 2025/2026 (Cl. 10, 41) prevalece sobre CLT (Art. 620). Adicionais: 60% até 2h (Cl. 10.1), 80% >2h (Cl. 10.2), 100% dom/fer (Cl. 10.3). Prazo: 60 dias por quinzena (Cl. 41.2).</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="https://rh-visual.lovable.app/rh/banco-horas" style="display: inline-block; background: #1a2332; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Ver Dashboard Completo →
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 11px; text-align: center;">
          Relatório gerado em ${dataFormatada} às ${horaFormatada}.<br/>
          © ${new Date().getFullYear()} Indústria Visual — RH Portal
        </p>
      </div>
    `;

    const results = [];
    for (const email of RECIPIENTS) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RH - Indústria Visual <mayara@industriavisual.com.br>",
            to: [email],
            subject,
            html: htmlBody,
          }),
        });
        const data = await res.json();
        results.push({ email, success: res.ok, id: data.id });
      } catch (err) {
        results.push({ email, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notified: results.filter(r => r.success).length,
      total_recipients: RECIPIENTS.length,
      results,
    }), {
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
