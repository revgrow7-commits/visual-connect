import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTH_HOST = "autenticador.secullum.com.br";
const PONTO_HOST = "pontowebintegracaoexterna.secullum.com.br";

// Cache TTL in minutes per action type
const CACHE_TTL: Record<string, number> = {
  funcionarios: 60,      // 1 hour
  totais: 30,            // 30 min
  detalhes: 30,          // 30 min
  "totais-todos": 30,   // 30 min
};

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

async function getCache(cacheKey: string): Promise<any | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("secullum_cache")
      .select("data, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (error || !data) return null;

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      // Expired - delete async, return null
      sb.from("secullum_cache").delete().eq("cache_key", cacheKey).then(() => {});
      return null;
    }

    return data.data;
  } catch {
    return null;
  }
}

async function setCache(cacheKey: string, value: any, ttlMinutes: number): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    const expires_at = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    await sb.from("secullum_cache").upsert(
      { cache_key: cacheKey, data: value, expires_at, created_at: new Date().toISOString() },
      { onConflict: "cache_key" }
    );
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

async function getToken(): Promise<string> {
  let token = Deno.env.get("SECULLUM_TOKEN") || "";

  const testRes = await fetch(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (testRes.ok) return token;

  console.log("Secullum token expired, generating new one...");
  const username = Deno.env.get("SECULLUM_USERNAME");
  const password = Deno.env.get("SECULLUM_PASSWORD");

  if (!username || !password) {
    throw new Error("Missing SECULLUM_USERNAME or SECULLUM_PASSWORD");
  }

  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    client_id: "3",
  });

  const tokenRes = await fetch(`https://${AUTH_HOST}/Token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to generate token: ${tokenRes.status} - ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function listarBancos(token: string) {
  const res = await fetch(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`ListarBancos failed: ${res.status}`);
  return res.json();
}

async function listarFuncionarios(token: string, banco: string) {
  const res = await fetch(`https://${PONTO_HOST}/IntegracaoExterna/Funcionarios`, {
    headers: {
      Authorization: `Bearer ${token}`,
      secullumbancoselecionado: banco,
    },
  });
  if (!res.ok) throw new Error(`ListarFuncionarios failed: ${res.status}`);
  return res.json();
}

async function calcularTotais(token: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  const res = await fetch(`https://${PONTO_HOST}/IntegracaoExterna/Calcular/SomenteTotais`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
  if (!res.ok) throw new Error(`CalcularTotais failed: ${res.status}`);
  return res.json();
}

async function calcularDetalhes(token: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  const res = await fetch(`https://${PONTO_HOST}/IntegracaoExterna/Calcular`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
  if (!res.ok) throw new Error(`CalcularDetalhes failed: ${res.status}`);
  return res.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTH CHECK: Verify JWT and require admin role ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // === END AUTH CHECK ===

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const skipCache = url.searchParams.get("refresh") === "true";

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build cache key based on action + body params
    let bodyData: any = {};
    if (req.method === "POST") {
      bodyData = await req.json();
    }
    const cacheKey = `secullum:${action}:${JSON.stringify(bodyData)}`;

    // Check cache first (unless refresh requested)
    if (!skipCache) {
      const cached = await getCache(cacheKey);
      if (cached !== null) {
        console.log(`Cache HIT for ${action}`);
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
        });
      }
    }
    console.log(`Cache MISS for ${action}, calling Secullum API...`);

    const token = await getToken();

    // Get banco
    const bancos = await listarBancos(token);
    if (!Array.isArray(bancos) || bancos.length === 0) {
      return new Response(JSON.stringify({ error: "No bancos found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const banco = String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");

    let result: any;

    switch (action) {
      case "funcionarios": {
        result = await listarFuncionarios(token, banco);
        break;
      }

      case "totais": {
        const { pis, dataInicial, dataFinal } = bodyData;
        if (!pis || !dataInicial || !dataFinal) {
          return new Response(JSON.stringify({ error: "Missing pis, dataInicial, or dataFinal" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = await calcularTotais(token, banco, pis, dataInicial, dataFinal);
        break;
      }

      case "detalhes": {
        const { pis, dataInicial, dataFinal } = bodyData;
        if (!pis || !dataInicial || !dataFinal) {
          return new Response(JSON.stringify({ error: "Missing pis, dataInicial, or dataFinal" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = await calcularDetalhes(token, banco, pis, dataInicial, dataFinal);
        break;
      }

      case "totais-todos": {
        const { dataInicial, dataFinal } = bodyData;
        if (!dataInicial || !dataFinal) {
          return new Response(JSON.stringify({ error: "Missing dataInicial or dataFinal" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const funcionarios = await listarFuncionarios(token, banco);
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
        const BATCH_SIZE = 6;
        const results: any[] = [];

        for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
          const batch = funcionarios.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (func: any) => {
              const pis = func.NumeroPis || func.Pis || func.pis;
              if (!pis) return null;
              const totais = await calcularTotais(token, banco, String(pis), dataInicial, dataFinal);
              return {
                funcionario: {
                  Nome: func.Nome,
                  NumeroPis: pis,
                  Cargo: func.Funcao?.Descricao || "",
                  Departamento: func.Departamento?.Descricao || "",
                  Email: func.Email || "",
                  Empresa: func.Empresa?.Nome || "",
                  Unidade: func.Empresa?.Uf || "",
                },
                totais,
              };
            })
          );
          for (const r of batchResults) {
            if (r.status === "fulfilled" && r.value) results.push(r.value);
            else if (r.status === "rejected") console.error("Batch error:", r.reason);
          }
          if (i + BATCH_SIZE < funcionarios.length) await delay(100);
        }
        result = results;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action. Use: funcionarios, totais, detalhes, totais-todos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Store in cache
    const ttl = CACHE_TTL[action] || 30;
    await setCache(cacheKey, result, ttl);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error: any) {
    console.error("Secullum proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

Deno.serve(handler);
