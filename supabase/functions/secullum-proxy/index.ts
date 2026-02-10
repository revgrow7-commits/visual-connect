import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTH_HOST = "autenticador.secullum.com.br";
const PONTO_HOST = "pontowebintegracaoexterna.secullum.com.br";
const REQUEST_TIMEOUT_MS = 30_000; // 30s timeout per Secullum API call

// Cache TTL in minutes per action type
const CACHE_TTL: Record<string, number> = {
  funcionarios: 60,
  totais: 30,
  detalhes: 30,
  "totais-todos": 30,
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

    if (new Date(data.expires_at) < new Date()) {
      sb.from("secullum_cache").delete().eq("cache_key", cacheKey).then(() => {}).catch(() => {});
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

/** Fetch with timeout to prevent hanging on Secullum API */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function getSecullumToken(): Promise<string> {
  const storedToken = Deno.env.get("SECULLUM_TOKEN") || "";

  // Test if stored token is still valid
  if (storedToken) {
    try {
      const testRes = await fetchWithTimeout(
        `https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
        10_000 // shorter timeout for token validation
      );
      if (testRes.ok) {
        await testRes.text(); // consume body
        return storedToken;
      }
      await testRes.text(); // consume body even on failure
    } catch {
      // Token test failed, proceed to generate new one
    }
  }

  console.log("Secullum token expired or missing, generating new one...");
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

  const tokenRes = await fetchWithTimeout(`https://${AUTH_HOST}/Token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to generate Secullum token: ${tokenRes.status} - ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function listarBancos(secToken: string) {
  const res = await fetchWithTimeout(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
    headers: { Authorization: `Bearer ${secToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ListarBancos failed: ${res.status} - ${t}`);
  }
  return res.json();
}

async function listarFuncionarios(secToken: string, banco: string) {
  const res = await fetchWithTimeout(`https://${PONTO_HOST}/IntegracaoExterna/Funcionarios`, {
    headers: {
      Authorization: `Bearer ${secToken}`,
      secullumbancoselecionado: banco,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ListarFuncionarios failed: ${res.status} - ${t}`);
  }
  return res.json();
}

async function calcularTotais(secToken: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  const res = await fetchWithTimeout(`https://${PONTO_HOST}/IntegracaoExterna/Calcular/SomenteTotais`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secToken}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`CalcularTotais failed for PIS ${pis}: ${res.status} - ${t}`);
  }
  return res.json();
}

async function calcularDetalhes(secToken: string, banco: string, pis: string, dataInicial: string, dataFinal: string) {
  const res = await fetchWithTimeout(`https://${PONTO_HOST}/IntegracaoExterna/Calcular`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secToken}`,
      secullumbancoselecionado: banco,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ FuncionarioPis: pis, DataInicial: dataInicial, DataFinal: dataFinal }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`CalcularDetalhes failed for PIS ${pis}: ${res.status} - ${t}`);
  }
  return res.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTH CHECK ===
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

    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(jwtToken);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role using service role to avoid RLS issues
    const sbAdmin = getSupabaseAdmin();
    const { data: roleData } = await sbAdmin
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

    // Parse body for POST requests
    let bodyData: any = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    // Get Secullum API token (renamed to avoid shadowing JWT token)
    const secToken = await getSecullumToken();

    // Get banco
    const bancos = await listarBancos(secToken);
    if (!Array.isArray(bancos) || bancos.length === 0) {
      return new Response(JSON.stringify({ error: "No bancos found in Secullum" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const banco = String(bancos[0].identificador || bancos[0]).replace(/[^a-zA-Z0-9]/g, "");

    let result: any;

    switch (action) {
      case "funcionarios": {
        result = await listarFuncionarios(secToken, banco);
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
        result = await calcularTotais(secToken, banco, pis, dataInicial, dataFinal);
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
        result = await calcularDetalhes(secToken, banco, pis, dataInicial, dataFinal);
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

        const funcionarios = await listarFuncionarios(secToken, banco);
        if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
          result = [];
          break;
        }

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
        const BATCH_SIZE = 6;
        const results: any[] = [];
        let errors = 0;

        for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
          const batch = funcionarios.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (func: any) => {
              const pis = func.NumeroPis || func.Pis || func.pis;
              if (!pis) return null;
              try {
                const totais = await calcularTotais(secToken, banco, String(pis), dataInicial, dataFinal);
                return {
                  funcionario: {
                    Nome: func.Nome || "Sem nome",
                    NumeroPis: pis,
                    Cargo: func.Funcao?.Descricao || "",
                    Departamento: func.Departamento?.Descricao || "",
                    Email: func.Email || "",
                    Empresa: func.Empresa?.Nome || "",
                    Unidade: func.Empresa?.Uf || "",
                  },
                  totais,
                };
              } catch (e) {
                console.error(`Error for PIS ${pis}:`, e);
                errors++;
                return null;
              }
            })
          );
          for (const r of batchResults) {
            if (r.status === "fulfilled" && r.value) results.push(r.value);
            else if (r.status === "rejected") {
              console.error("Batch error:", r.reason);
              errors++;
            }
          }
          if (i + BATCH_SIZE < funcionarios.length) await delay(150);
        }

        if (errors > 0) {
          console.warn(`totais-todos completed with ${errors} errors out of ${funcionarios.length} employees`);
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
    const statusCode = error.message?.includes("timeout") || error.name === "AbortError" ? 504 : 500;
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

Deno.serve(handler);
