import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { candidatoNome, candidatoEmail, cargo, unidade, token, expiraEm } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = req.headers.get("origin") || "https://rh-visual.lovable.app";
    const formUrl = `${baseUrl}/formulario/${token}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #7A1B1B; font-size: 24px; margin: 0;">Indústria Visual</h1>
          <p style="color: #666; font-size: 14px;">Portal do Colaborador</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #111; font-size: 20px; margin-top: 0;">Olá, ${candidatoNome}! 🎉</h2>
          <p style="color: #444; font-size: 14px; line-height: 1.6;">
            Parabéns! Você foi selecionado(a) para a posição de <strong>${cargo}</strong> na unidade <strong>${unidade}</strong>.
          </p>
          <p style="color: #444; font-size: 14px; line-height: 1.6;">
            Para dar continuidade ao seu processo de admissão, pedimos que preencha o formulário abaixo com seus dados pessoais e profissionais.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${formUrl}" style="display: inline-block; background: #7A1B1B; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Preencher Formulário de Admissão
            </a>
          </div>
          <p style="color: #888; font-size: 12px; text-align: center;">
            Este link expira em ${new Date(expiraEm).toLocaleDateString("pt-BR")}.
          </p>
        </div>
        <p style="color: #999; font-size: 11px; text-align: center;">
          Se você não esperava este e-mail, por favor ignore-o.<br/>
          © ${new Date().getFullYear()} Indústria Visual — Todos os direitos reservados.
        </p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RH Indústria Visual <noreply@industriavisual.com.br>",
        to: [candidatoEmail],
        subject: `🎉 Bem-vindo(a) à Indústria Visual — Formulário de Admissão`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Falha ao enviar e-mail", details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
