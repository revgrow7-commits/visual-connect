import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTH_HOST = "autenticador.secullum.com.br";
const PONTO_HOST = "pontowebintegracaoexterna.secullum.com.br";
const TIMEOUT_MS = 30_000;
const BATCH_SIZE = 12;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getSecullumToken(): Promise<string> {
  const storedToken = Deno.env.get("SECULLUM_TOKEN") || "";
  if (storedToken) {
    try {
      const testRes = await fetchWithTimeout(
        `https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
        10_000
      );
      if (testRes.ok) { await testRes.text(); return storedToken; }
      await testRes.text();
    } catch { /* proceed to generate */ }
  }

  const username = Deno.env.get("SECULLUM_USERNAME");
  const password = Deno.env.get("SECULLUM_PASSWORD");
  if (!username || !password) throw new Error("Missing SECULLUM_USERNAME or SECULLUM_PASSWORD");

  const body = new URLSearchParams({ grant_type: "password", username, password, client_id: "3" });
  const tokenRes = await fetchWithTimeout(`https://${AUTH_HOST}/Token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) throw new Error(`Token error: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

function parseHoras(val: string): number {
  if (!val || val === "") return 0;
  const negative = val.startsWith("-");
  const clean = val.replace("-", "");
  const parts = clean.split(":");
  if (parts.length !== 2) return parseFloat(val) || 0;
  const hours = parseInt(parts[0]) || 0;
  const mins = parseInt(parts[1]) || 0;
  const total = hours + mins / 60;
  return negative ? -total : total;
}

function getTotal(colunas: string[], totais: string[], colName: string): string {
  const idx = colunas?.indexOf(colName);
  if (idx === undefined || idx < 0) return "00:00";
  return totais?.[idx] || "00:00";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(jwtToken);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const sbAdmin = getSupabaseAdmin();

    const { data: roleData } = await sbAdmin
      .from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "admin").maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const { competencia } = await req.json();
    if (!competencia) {
      return new Response(JSON.stringify({ error: "Missing competencia (YYYY-MM)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [year, month] = competencia.split("-").map(Number);
    const dataInicial = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dataFinal = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Fetch from Secullum
    const secToken = await getSecullumToken();

    const bancosRes = await fetchWithTimeout(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
      headers: { Authorization: `Bearer ${secToken}` },
    });
    if (!bancosRes.ok) throw new Error(`ListarBancos failed: ${bancosRes.status}`);
    const bancos = await bancosRes.json();
    if (!Array.isArray(bancos) || bancos.length === 0) throw new Error("No bancos found");
    const banco = String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");

    // Get all employees
    const funcRes = await fetchWithTimeout(`https://${PONTO_HOST}/IntegracaoExterna/Funcionarios`, {
      headers: { Authorization: `Bearer ${secToken}`, secullumbancoselecionado: banco },
    });
    if (!funcRes.ok) throw new Error(`Funcionarios failed: ${funcRes.status}`);
    const funcionarios = await funcRes.json();
    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
      return new Response(JSON.stringify({ imported: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Importing ${funcionarios.length} employees for ${competencia}...`);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const rows: any[] = [];
    let errors = 0;

    for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
      const batch = funcionarios.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (func: any) => {
          const pis = func.NumeroPis || func.Pis || func.pis;
          if (!pis) return null;
          try {
            const totaisRes = await fetchWithTimeout(
              `https://${PONTO_HOST}/IntegracaoExterna/Calcular/SomenteTotais`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${secToken}`,
                  secullumbancoselecionado: banco,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ FuncionarioPis: String(pis), DataInicial: dataInicial, DataFinal: dataFinal }),
              }
            );
            if (!totaisRes.ok) { errors++; return null; }
            const totais = await totaisRes.json();
            const colunas = totais.Colunas || [];
            const tots = totais.Totais || [];
            const bSaldo = getTotal(colunas, tots, "BSaldo");

            return {
              competencia,
              pis: String(pis),
              nome: func.Nome || "Sem nome",
              cargo: func.Funcao?.Descricao || null,
              departamento: func.Departamento?.Descricao || null,
              unidade: func.Empresa?.Uf || null,
              email: func.Email || null,
              normais: getTotal(colunas, tots, "Normais"),
              carga: getTotal(colunas, tots, "Carga"),
              faltas: getTotal(colunas, tots, "Faltas"),
              ex60: getTotal(colunas, tots, "Ex60%"),
              ex80: getTotal(colunas, tots, "Ex80%"),
              ex100: getTotal(colunas, tots, "Ex100%"),
              b_saldo: bSaldo,
              b_total: getTotal(colunas, tots, "BTotal"),
              b_cred: getTotal(colunas, tots, "BCred."),
              b_deb: getTotal(colunas, tots, "BDeb."),
              saldo_decimal: parseHoras(bSaldo),
              raw_data: totais,
              imported_by: userId,
              imported_at: new Date().toISOString(),
            };
          } catch (e) {
            console.error(`Error PIS ${pis}:`, e);
            errors++;
            return null;
          }
        })
      );

      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value) rows.push(r.value);
      }
      if (i + BATCH_SIZE < funcionarios.length) await delay(150);
    }

    // Upsert into database
    if (rows.length > 0) {
      const { error: upsertError } = await sbAdmin
        .from("banco_horas")
        .upsert(rows, { onConflict: "competencia,pis" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw new Error(`Database error: ${upsertError.message}`);
      }
    }

    console.log(`Import complete: ${rows.length} saved, ${errors} errors`);

    return new Response(JSON.stringify({
      imported: rows.length,
      errors,
      total: funcionarios.length,
      competencia,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Import error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
