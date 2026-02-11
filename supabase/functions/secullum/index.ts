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

function jsonOk(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function jsonErr(message: string, status = 500) {
  console.error("[secullum]", status, message);
  return jsonOk({ error: message }, status);
}

async function fetchJSON(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error("HTTP " + res.status + " – " + url);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseHoras(val: string): number {
  if (!val) return 0;
  const negative = val.startsWith("-");
  const clean = val.replace("-", "");
  const parts = clean.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (isNaN(h)) return 0;
  const total = h + m / 60;
  return negative ? -total : total;
}

function getTotal(colunas: string[], totais: string[], colName: string): string {
  const idx = colunas.indexOf(colName);
  return idx >= 0 ? (totais[idx] || "00:00") : "00:00";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized" };
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await anonClient.auth.getUser();
  if (error || !data.user) throw { status: 401, message: "Invalid token" };

  const userId = data.user.id;
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

async function getSecullumToken(): Promise<string> {
  const stored = Deno.env.get("SECULLUM_TOKEN");
  if (stored) {
    try {
      await fetchJSON(
        "https://" + AUTH_HOST + "/ContasSecullumExterno/ListarBancos",
        { headers: { Authorization: "Bearer " + stored } },
      );
      return stored;
    } catch (_e) {
      console.log("[secullum] Stored token expired, re-authenticating");
    }
  }

  const username = Deno.env.get("SECULLUM_USERNAME");
  const password = Deno.env.get("SECULLUM_PASSWORD");
  if (!username || !password) throw new Error("Missing SECULLUM credentials");

  const body = new URLSearchParams({ grant_type: "password", username: username, password: password, client_id: "3" });
  const tokenData = await fetchJSON("https://" + AUTH_HOST + "/Token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return tokenData.access_token;
}

async function getBanco(secToken: string): Promise<string> {
  const bancos = await fetchJSON("https://" + AUTH_HOST + "/ContasSecullumExterno/ListarBancos", {
    headers: { Authorization: "Bearer " + secToken },
  });
  if (!Array.isArray(bancos) || bancos.length === 0) throw new Error("No bancos found");
  return String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");
}

async function listarFuncionarios(secToken: string, banco: string) {
  return fetchJSON("https://" + PONTO_HOST + "/IntegracaoExterna/Funcionarios", {
    headers: { Authorization: "Bearer " + secToken, secullumbancoselecionado: banco },
  });
}

async function calcularTotais(secToken: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  return fetchJSON("https://" + PONTO_HOST + "/IntegracaoExterna/Calcular/SomenteTotais", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secToken,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
}

async function handleImportar(secToken: string, banco: string, competencia: string, userId: string) {
  const [year, month] = competencia.split("-").map(Number);
  const dataInicial = year + "-" + String(month).padStart(2, "0") + "-01";
  const lastDay = new Date(year, month, 0).getDate();
  const dataFinal = year + "-" + String(month).padStart(2, "0") + "-" + String(lastDay).padStart(2, "0");

  const funcionarios = await listarFuncionarios(secToken, banco);
  if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
    return { imported: 0, errors: 0, total: 0, competencia: competencia };
  }

  console.log("[secullum] Importing " + funcionarios.length + " employees for " + competencia);

  const rows: Record<string, unknown>[] = [];
  let errors = 0;

  for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
    const batch = funcionarios.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (func: Record<string, unknown>) => {
        const pis = String(func.NumeroPis || func.Pis || func.pis || "");
        if (!pis) return null;
        try {
          const totais = await calcularTotais(secToken, banco, pis, dataInicial, dataFinal);
          const colunas = (totais.Colunas || []) as string[];
          const tots = (totais.Totais || []) as string[];
          const bSaldo = getTotal(colunas, tots, "BSaldo");
          const funcao = func.Funcao as Record<string, string> | undefined;
          const dept = func.Departamento as Record<string, string> | undefined;
          const empresa = func.Empresa as Record<string, string> | undefined;

          return {
            competencia: competencia,
            pis: pis,
            nome: String(func.Nome || "Sem nome"),
            cargo: funcao ? funcao.Descricao : null,
            departamento: dept ? dept.Descricao : null,
            unidade: empresa ? empresa.Uf : null,
            email: String(func.Email || "") || null,
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
          console.error("[secullum] Error PIS " + pis + ":", e);
          errors++;
          return null;
        }
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) rows.push(r.value);
    }
    if (i + BATCH_SIZE < funcionarios.length) await delay(BATCH_DELAY_MS);
  }

  if (rows.length > 0) {
    const sbAdmin = getSupabaseAdmin();
    const { error: upsertError } = await sbAdmin
      .from("banco_horas")
      .upsert(rows, { onConflict: "competencia,pis" });
    if (upsertError) throw new Error("Database error: " + upsertError.message);
  }

  console.log("[secullum] Import complete: " + rows.length + " saved, " + errors + " errors");
  return { imported: rows.length, errors: errors, total: funcionarios.length, competencia: competencia };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await verifyAdmin(req);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (!action) {
      return jsonErr("Missing action parameter. Use: funcionarios, importar", 400);
    }

    let bodyData: Record<string, string> = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch (_e) {
        return jsonErr("Invalid JSON body", 400);
      }
    }

    const secToken = await getSecullumToken();
    const banco = await getBanco(secToken);

    if (action === "funcionarios") {
      const result = await listarFuncionarios(secToken, banco);
      return jsonOk(result);
    }

    if (action === "importar") {
      const competencia = bodyData.competencia;
      if (!competencia) return jsonErr("Missing competencia (YYYY-MM)", 400);
      const result = await handleImportar(secToken, banco, competencia, userId);
      return jsonOk(result);
    }

    if (action === "totais") {
      const { pis, dataInicial, dataFinal } = bodyData;
      if (!pis || !dataInicial || !dataFinal) return jsonErr("Missing pis, dataInicial, or dataFinal", 400);
      const result = await calcularTotais(secToken, banco, pis, dataInicial, dataFinal);
      return jsonOk(result);
    }

    return jsonErr("Invalid action. Use: funcionarios, totais, importar", 400);
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string; name?: string };
    const status = err.status || (err.name === "AbortError" ? 504 : 500);
    return jsonErr(err.message || "Internal error", status);
  }
});
