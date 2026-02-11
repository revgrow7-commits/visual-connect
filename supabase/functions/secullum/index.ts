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

const CACHE_TTL: Record<string, number> = {
  funcionarios: 60,
  totais: 30,
  detalhes: 30,
  "totais-todos": 30,
};

// ── Helpers ──

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function jsonResponse(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function errorResponse(message: string, status = 500) {
  console.error(`[secullum] ${status}: ${message}`);
  return jsonResponse({ error: message }, status);
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

// ── Cache ──

async function getCache(cacheKey: string): Promise<unknown | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("secullum_cache")
      .select("data, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) {
      sb.from("secullum_cache").delete().eq("cache_key", cacheKey).then(() => {}).catch(() => {});
      return null;
    }
    return data.data;
  } catch {
    return null;
  }
}

async function setCache(cacheKey: string, value: unknown, ttlMinutes: number): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    const expires_at = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    await sb.from("secullum_cache").upsert(
      { cache_key: cacheKey, data: value, expires_at, created_at: new Date().toISOString() },
      { onConflict: "cache_key" },
    );
  } catch (e) {
    console.error("[secullum] Cache write error:", e);
  }
}

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

// ── Secullum API ──

async function getSecullumToken(): Promise<string> {
  const stored = Deno.env.get("SECULLUM_TOKEN");
  if (stored) {
    try {
      const testRes = await fetchJSON(
        `https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`,
        { headers: { Authorization: `Bearer ${stored}` } },
        10_000,
      );
      if (testRes) return stored;
    } catch {
      // token expired
    }
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

async function getBanco(secToken: string): Promise<string> {
  const bancos = await fetchJSON(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
    headers: { Authorization: `Bearer ${secToken}` },
  });
  if (!Array.isArray(bancos) || bancos.length === 0) throw new Error("No bancos found");
  return String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");
}

async function listarFuncionarios(secToken: string, banco: string) {
  return fetchJSON(`https://${PONTO_HOST}/IntegracaoExterna/Funcionarios`, {
    headers: { Authorization: `Bearer ${secToken}`, secullumbancoselecionado: banco },
  });
}

async function calcularTotais(secToken: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  return fetchJSON(`https://${PONTO_HOST}/IntegracaoExterna/Calcular/SomenteTotais`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secToken}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
}

async function calcularDetalhes(secToken: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  return fetchJSON(`https://${PONTO_HOST}/IntegracaoExterna/Calcular`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secToken}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
}

// ── Action Handlers ──

async function handleFuncionarios(secToken: string, banco: string) {
  return listarFuncionarios(secToken, banco);
}

async function handleTotais(secToken: string, banco: string, body: Record<string, string>) {
  const { pis, dataInicial, dataFinal } = body;
  if (!pis || !dataInicial || !dataFinal) throw { status: 400, message: "Missing pis, dataInicial, or dataFinal" };
  return calcularTotais(secToken, banco, pis, dataInicial, dataFinal);
}

async function handleDetalhes(secToken: string, banco: string, body: Record<string, string>) {
  const { pis, dataInicial, dataFinal } = body;
  if (!pis || !dataInicial || !dataFinal) throw { status: 400, message: "Missing pis, dataInicial, or dataFinal" };
  return calcularDetalhes(secToken, banco, pis, dataInicial, dataFinal);
}

async function handleTotaisTodos(secToken: string, banco: string, body: Record<string, string>) {
  const { dataInicial, dataFinal } = body;
  if (!dataInicial || !dataFinal) throw { status: 400, message: "Missing dataInicial or dataFinal" };

  const funcionarios = await listarFuncionarios(secToken, banco);
  if (!Array.isArray(funcionarios) || funcionarios.length === 0) return [];

  const results: unknown[] = [];
  let errors = 0;

  for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
    const batch = funcionarios.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (func: Record<string, unknown>) => {
        const pis = (func.NumeroPis || func.Pis || func.pis) as string;
        if (!pis) return null;
        try {
          const totais = await calcularTotais(secToken, banco, String(pis), dataInicial, dataFinal);
          const funcao = func.Funcao as Record<string, string> | undefined;
          const dept = func.Departamento as Record<string, string> | undefined;
          const empresa = func.Empresa as Record<string, string> | undefined;
          return {
            funcionario: {
              Nome: func.Nome || "Sem nome",
              NumeroPis: pis,
              Cargo: funcao?.Descricao || "",
              Departamento: dept?.Descricao || "",
              Email: func.Email || "",
              Empresa: empresa?.Nome || "",
              Unidade: empresa?.Uf || "",
            },
            totais,
          };
        } catch (e) {
          console.error(`[secullum] Error PIS ${pis}:`, e);
          errors++;
          return null;
        }
      }),
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
      else if (r.status === "rejected") errors++;
    }
    if (i + BATCH_SIZE < funcionarios.length) await delay(BATCH_DELAY_MS);
  }

  if (errors > 0) console.warn(`[secullum] totais-todos: ${errors} errors / ${funcionarios.length} total`);
  return results;
}

async function handleImportar(secToken: string, banco: string, body: Record<string, string>, userId: string) {
  const { competencia } = body;
  if (!competencia) throw { status: 400, message: "Missing competencia (YYYY-MM)" };

  const [year, month] = competencia.split("-").map(Number);
  const dataInicial = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dataFinal = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const funcionarios = await listarFuncionarios(secToken, banco);
  if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
    return { imported: 0, errors: 0, total: 0, competencia };
  }

  console.log(`[secullum] Importing ${funcionarios.length} employees for ${competencia}`);

  const rows: Record<string, unknown>[] = [];
  let errors = 0;

  for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
    const batch = funcionarios.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (func: Record<string, unknown>) => {
        const pis = (func.NumeroPis || func.Pis || func.pis) as string;
        if (!pis) return null;
        try {
          const totais = await calcularTotais(secToken, banco, String(pis), dataInicial, dataFinal);
          const colunas = (totais.Colunas || []) as string[];
          const tots = (totais.Totais || []) as string[];
          const bSaldo = getTotal(colunas, tots, "BSaldo");
          const funcao = func.Funcao as Record<string, string> | undefined;
          const dept = func.Departamento as Record<string, string> | undefined;
          const empresa = func.Empresa as Record<string, string> | undefined;

          return {
            competencia,
            pis: String(pis),
            nome: (func.Nome as string) || "Sem nome",
            cargo: funcao?.Descricao || null,
            departamento: dept?.Descricao || null,
            unidade: empresa?.Uf || null,
            email: (func.Email as string) || null,
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
          console.error(`[secullum] Error PIS ${pis}:`, e);
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
    if (upsertError) throw new Error(`Database error: ${upsertError.message}`);
  }

  console.log(`[secullum] Import complete: ${rows.length} saved, ${errors} errors`);
  return { imported: rows.length, errors, total: funcionarios.length, competencia };
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await verifyAdmin(req);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const skipCache = url.searchParams.get("refresh") === "true";

    if (!action) return errorResponse("Missing action parameter. Use: funcionarios, totais, detalhes, totais-todos, importar", 400);

    let bodyData: Record<string, string> = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
    }

    // Importar bypasses cache entirely
    if (action === "importar") {
      const secToken = await getSecullumToken();
      const banco = await getBanco(secToken);
      const result = await handleImportar(secToken, banco, bodyData, userId);
      return jsonResponse(result);
    }

    // Check cache for other actions
    const cacheKey = `secullum:${action}:${JSON.stringify(bodyData)}`;
    if (!skipCache) {
      const cached = await getCache(cacheKey);
      if (cached !== null) {
        console.log(`[secullum] Cache HIT: ${action}`);
        return jsonResponse(cached, 200, { "X-Cache": "HIT" });
      }
    }
    console.log(`[secullum] Cache MISS: ${action}`);

    const secToken = await getSecullumToken();
    const banco = await getBanco(secToken);

    let result: unknown;
    switch (action) {
      case "funcionarios":
        result = await handleFuncionarios(secToken, banco);
        break;
      case "totais":
        result = await handleTotais(secToken, banco, bodyData);
        break;
      case "detalhes":
        result = await handleDetalhes(secToken, banco, bodyData);
        break;
      case "totais-todos":
        result = await handleTotaisTodos(secToken, banco, bodyData);
        break;
      default:
        return errorResponse("Invalid action. Use: funcionarios, totais, detalhes, totais-todos, importar", 400);
    }

    const ttl = CACHE_TTL[action] || 30;
    await setCache(cacheKey, result, ttl);

    return jsonResponse(result, 200, { "X-Cache": "MISS" });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string; name?: string };
    const status = err.status || (err.name === "AbortError" ? 504 : 500);
    return errorResponse(err.message || "Internal error", status);
  }
});
