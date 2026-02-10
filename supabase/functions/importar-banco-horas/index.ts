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
const BATCH_DELAY_MS = 150;

// ── Helpers ──

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function fetchJSON(url: string, options: RequestInit = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseHoras(val: string): number {
  if (!val) return 0;
  const negative = val.startsWith("-");
  const clean = val.replace("-", "");
  const [h, m] = clean.split(":").map(Number);
  if (isNaN(h)) return 0;
  const total = h + (m || 0) / 60;
  return negative ? -total : total;
}

function getTotal(colunas: string[], totais: string[], colName: string): string {
  const idx = colunas?.indexOf(colName);
  return idx !== undefined && idx >= 0 ? totais?.[idx] || "00:00" : "00:00";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Auth ──

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw { status: 401, message: "Unauthorized" };

  const jwt = authHeader.replace("Bearer ", "");
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await anonClient.auth.getClaims(jwt);
  if (error || !data?.claims) throw { status: 401, message: "Invalid token" };

  const userId = data.claims.sub as string;
  const sbAdmin = getSupabaseAdmin();
  const { data: role } = await sbAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) throw { status: 403, message: "Admin role required" };
  return { userId, sbAdmin };
}

// ── Secullum ──

async function getSecullumToken(): Promise<string> {
  const stored = Deno.env.get("SECULLUM_TOKEN");
  if (stored) {
    try {
      await fetchJSON(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
        headers: { Authorization: `Bearer ${stored}` },
      }, 10_000);
      return stored;
    } catch { /* token expired, generate new */ }
  }

  const username = Deno.env.get("SECULLUM_USERNAME");
  const password = Deno.env.get("SECULLUM_PASSWORD");
  if (!username || !password) throw new Error("Missing SECULLUM credentials");

  const body = new URLSearchParams({ grant_type: "password", username, password, client_id: "3" });
  const tokenData = await fetchJSON(`https://${AUTH_HOST}/Token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return tokenData.access_token;
}

async function fetchEmployeeTotals(
  secToken: string,
  banco: string,
  func: Record<string, any>,
  competencia: string,
  dataInicial: string,
  dataFinal: string,
  userId: string,
): Promise<Record<string, any> | null> {
  const pis = func.NumeroPis || func.Pis || func.pis;
  if (!pis) return null;

  const totais = await fetchJSON(
    `https://${PONTO_HOST}/IntegracaoExterna/Calcular/SomenteTotais`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secToken}`,
        secullumbancoselecionado: banco,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ FuncionarioPis: String(pis), DataInicial: dataInicial, DataFinal: dataFinal }),
    },
  );

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
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, sbAdmin } = await verifyAdmin(req);

    const { competencia } = await req.json();
    if (!competencia) {
      return new Response(JSON.stringify({ error: "Missing competencia (YYYY-MM)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [year, month] = competencia.split("-").map(Number);
    const dataInicial = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dataFinal = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const secToken = await getSecullumToken();

    const bancos = await fetchJSON(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
      headers: { Authorization: `Bearer ${secToken}` },
    });
    if (!Array.isArray(bancos) || bancos.length === 0) throw new Error("No bancos found");
    const banco = String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");

    const funcionarios = await fetchJSON(
      `https://${PONTO_HOST}/IntegracaoExterna/Funcionarios`,
      { headers: { Authorization: `Bearer ${secToken}`, secullumbancoselecionado: banco } },
    );
    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
      return new Response(JSON.stringify({ imported: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Importing ${funcionarios.length} employees for ${competencia}`);

    const rows: Record<string, any>[] = [];
    let errors = 0;

    for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
      const batch = funcionarios.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((func: any) =>
          fetchEmployeeTotals(secToken, banco, func, competencia, dataInicial, dataFinal, userId).catch((e) => {
            console.error(`Error PIS ${func.NumeroPis || func.Pis}:`, e);
            errors++;
            return null;
          })
        ),
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) rows.push(r.value);
      }

      if (i + BATCH_SIZE < funcionarios.length) await delay(BATCH_DELAY_MS);
    }

    if (rows.length > 0) {
      const { error: upsertError } = await sbAdmin
        .from("banco_horas")
        .upsert(rows, { onConflict: "competencia,pis" });
      if (upsertError) throw new Error(`Database error: ${upsertError.message}`);
    }

    console.log(`Import complete: ${rows.length} saved, ${errors} errors`);

    return new Response(
      JSON.stringify({ imported: rows.length, errors, total: funcionarios.length, competencia }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    const status = e.status || 500;
    const message = e.message || "Internal error";
    console.error("Import error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
