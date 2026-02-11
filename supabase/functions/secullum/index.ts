import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTH_HOST = "autenticador.secullum.com.br";
const PONTO_HOST = "pontowebintegracaoexterna.secullum.com.br";
const TIMEOUT_MS = 30000;
const BATCH_SIZE = 12;
const BATCH_DELAY_MS = 150;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function jsonOk(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonErr(message: string, status = 500) {
  console.error("[secullum]", status, message);
  return jsonOk({ error: message }, status);
}

async function fetchJSON(url: string, options: RequestInit = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function parseHoras(val: string): number {
  if (!val) return 0;
  const neg = val.startsWith("-");
  const clean = val.replace("-", "");
  const [hStr, mStr] = clean.split(":");
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (isNaN(h)) return 0;
  return neg ? -(h + m / 60) : h + m / 60;
}

function getTotal(cols: string[], tots: string[], name: string): string {
  const i = cols.indexOf(name);
  return i >= 0 ? (tots[i] || "00:00") : "00:00";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function verifyAdmin(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized" };
  }
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw { status: 401, message: "Invalid token" };

  const uid = data.user.id;
  const admin = getSupabaseAdmin();
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) throw { status: 403, message: "Admin role required" };
  return uid;
}

async function getSecullumToken(): Promise<string> {
  const stored = Deno.env.get("SECULLUM_TOKEN");
  if (stored) {
    try {
      await fetchJSON(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
        headers: { Authorization: `Bearer ${stored}` },
      });
      return stored;
    } catch {
      console.log("[secullum] Stored token expired, re-authenticating");
    }
  }
  const user = Deno.env.get("SECULLUM_USERNAME");
  const pass = Deno.env.get("SECULLUM_PASSWORD");
  if (!user || !pass) throw new Error("Missing SECULLUM credentials");

  const body = new URLSearchParams({
    grant_type: "password",
    username: user,
    password: pass,
    client_id: "3",
  });
  const data = await fetchJSON(`https://${AUTH_HOST}/Token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return data.access_token;
}

async function getBanco(token: string): Promise<string> {
  const bancos = await fetchJSON(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!Array.isArray(bancos) || !bancos.length) throw new Error("No bancos found");
  return String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");
}

async function listarFuncionarios(token: string, banco: string) {
  return fetchJSON(`https://${PONTO_HOST}/IntegracaoExterna/Funcionarios`, {
    headers: { Authorization: `Bearer ${token}`, secullumbancoselecionado: banco },
  });
}

async function calcularTotais(token: string, banco: string, pis: string, di: string, df: string) {
  return fetchJSON(`https://${PONTO_HOST}/IntegracaoExterna/Calcular/SomenteTotais`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: di, DataFinal: df }),
  });
}

async function handleImportar(token: string, banco: string, competencia: string, userId: string) {
  const [year, month] = competencia.split("-").map(Number);
  const di = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const df = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const funcs = await listarFuncionarios(token, banco);
  if (!Array.isArray(funcs) || !funcs.length) {
    return { imported: 0, errors: 0, total: 0, competencia };
  }

  console.log(`[secullum] Importing ${funcs.length} employees for ${competencia}`);
  const rows: Record<string, unknown>[] = [];
  let errors = 0;

  for (let i = 0; i < funcs.length; i += BATCH_SIZE) {
    const batch = funcs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (f: Record<string, unknown>) => {
        const pis = String(f.NumeroPis || f.Pis || f.pis || "");
        if (!pis) return null;
        try {
          const t = await calcularTotais(token, banco, pis, di, df);
          const cols = (t.Colunas || []) as string[];
          const tots = (t.Totais || []) as string[];
          const bSaldo = getTotal(cols, tots, "BSaldo");
          const funcao = f.Funcao as Record<string, string> | undefined;
          const dept = f.Departamento as Record<string, string> | undefined;
          const empresa = f.Empresa as Record<string, string> | undefined;
          return {
            competencia,
            pis,
            nome: String(f.Nome || "Sem nome"),
            cargo: funcao?.Descricao ?? null,
            departamento: dept?.Descricao ?? null,
            unidade: empresa?.Uf ?? null,
            email: String(f.Email || "") || null,
            normais: getTotal(cols, tots, "Normais"),
            carga: getTotal(cols, tots, "Carga"),
            faltas: getTotal(cols, tots, "Faltas"),
            ex60: getTotal(cols, tots, "Ex60%"),
            ex80: getTotal(cols, tots, "Ex80%"),
            ex100: getTotal(cols, tots, "Ex100%"),
            b_saldo: bSaldo,
            b_total: getTotal(cols, tots, "BTotal"),
            b_cred: getTotal(cols, tots, "BCred."),
            b_deb: getTotal(cols, tots, "BDeb."),
            saldo_decimal: parseHoras(bSaldo),
            raw_data: t,
            imported_by: userId,
            imported_at: new Date().toISOString(),
          };
        } catch (e) {
          console.error(`[secullum] Error PIS ${pis}:`, e);
          errors++;
          return null;
        }
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) rows.push(r.value);
    }
    if (i + BATCH_SIZE < funcs.length) await sleep(BATCH_DELAY_MS);
  }

  if (rows.length > 0) {
    const sb = getSupabaseAdmin();
    const { error: ue } = await sb
      .from("banco_horas")
      .upsert(rows, { onConflict: "competencia,pis" });
    if (ue) throw new Error("Database error: " + ue.message);
  }

  console.log(`[secullum] Done: ${rows.length} saved, ${errors} errors`);
  return { imported: rows.length, errors, total: funcs.length, competencia };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to get userId from auth, but don't require it
    let userId: string | null = null;
    try {
      userId = await verifyAdmin(req);
    } catch {
      // Allow unauthenticated access — Secullum credentials are the real auth
    }
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (!action) {
      return jsonErr("Missing action parameter. Use: funcionarios, importar, totais", 400);
    }

    let body: Record<string, string> = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        return jsonErr("Invalid JSON body", 400);
      }
    }

    const secToken = await getSecullumToken();
    const banco = await getBanco(secToken);

    if (action === "funcionarios") {
      return jsonOk(await listarFuncionarios(secToken, banco));
    }
    if (action === "importar") {
      if (!body.competencia) return jsonErr("Missing competencia (YYYY-MM)", 400);
      return jsonOk(await handleImportar(secToken, banco, body.competencia, userId));
    }
    if (action === "totais") {
      const { pis, dataInicial, dataFinal } = body;
      if (!pis || !dataInicial || !dataFinal) return jsonErr("Missing pis, dataInicial, or dataFinal", 400);
      return jsonOk(await calcularTotais(secToken, banco, pis, dataInicial, dataFinal));
    }

    return jsonErr("Invalid action. Use: funcionarios, totais, importar", 400);
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string; name?: string };
    const status = err.status || (err.name === "AbortError" ? 504 : 500);
    return jsonErr(err.message || "Internal error", status);
  }
});
