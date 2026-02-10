import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTH_HOST = "autenticador.secullum.com.br";
const PONTO_HOST = "pontowebintegracaoexterna.secullum.com.br";

async function getToken(): Promise<string> {
  // Try stored token first
  let token = Deno.env.get("SECULLUM_TOKEN") || "";

  // Validate token by listing bancos
  const testRes = await fetch(`https://${AUTH_HOST}/ContasSecullumExterno/ListarBancos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (testRes.ok) return token;

  // Token expired, generate new one
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
  token = tokenData.access_token;
  return token;
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
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

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
        const body = await req.json();
        const { pis, dataInicial, dataFinal } = body;
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
        const body = await req.json();
        const { pis, dataInicial, dataFinal } = body;
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
        const body = await req.json();
        const { dataInicial, dataFinal } = body;
        if (!dataInicial || !dataFinal) {
          return new Response(JSON.stringify({ error: "Missing dataInicial or dataFinal" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all employees
        const funcionarios = await listarFuncionarios(token, banco);
        
        // Calculate totals for each employee
        const results = [];
        for (const func of funcionarios) {
          try {
            const pis = func.NumeroPis || func.Pis || func.pis;
            if (!pis) continue;
            const totais = await calcularTotais(token, banco, String(pis), dataInicial, dataFinal);
            results.push({
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
            });
          } catch (e) {
            console.error(`Error calculating for ${func.Nome}:`, e);
          }
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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Secullum proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
