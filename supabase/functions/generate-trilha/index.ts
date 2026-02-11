import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-2.5-flash";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const RAG_CONTEXT = `# Base de Conhecimento – Indústria Visual
## Departamentos
Comercial, PCP, Design, Produção/Impressão, Acabamento, Instalação, Logística, Administrativo/RH, Marketing.
## Fluxo de Produção (PCP)
1. Orçamento → 2. Aprovação → 3. Briefing → 4. Aprovação arte → 5. PCP → 6. Impressão → 7. Acabamento → 8. QC → 9. Logística → 10. Instalação
## Segurança
NR-12 (Máquinas), NR-35 (Altura), NR-6 (EPIs). Uso obrigatório de EPIs na produção.`;

const SYSTEM_PROMPT = `Você é um especialista em RH e onboarding da Indústria Visual.

Com base no contexto da empresa fornecido, gere uma trilha de onboarding completa para o cargo e unidade especificados.

${RAG_CONTEXT}

REGRAS:
1. Gere entre 6 e 12 etapas relevantes para o cargo
2. Misture tipos: checklist, video, documento
3. Primeiras etapas: empresa, cultura e valores
4. Depois: etapas específicas do departamento/cargo
5. Inclua segurança (NRs) quando aplicável
6. Marque como obrigatória as etapas essenciais

Responda APENAS com o JSON usando a tool fornecida.`;

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw { status: 401, message: "Não autorizado" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw { status: 401, message: "Não autorizado" };

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) throw { status: 403, message: "Apenas administradores podem gerar trilhas" };

  return { user, supabase };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

    const { user, supabase } = await verifyAdmin(req);
    const { cargo, unidade } = await req.json();
    if (!cargo) throw { status: 400, message: "Campo 'cargo' é obrigatório" };

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Gere uma trilha de onboarding para:\n- Cargo: ${cargo}\n- Unidade: ${unidade || "Todas"}\n\nCrie a trilha com nome, descrição e todas as etapas.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_trilha",
            description: "Cria uma trilha de onboarding com suas etapas",
            parameters: {
              type: "object",
              properties: {
                nome: { type: "string" },
                descricao: { type: "string" },
                etapas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string" },
                      descricao: { type: "string" },
                      tipo: { type: "string", enum: ["checklist", "video", "documento"] },
                      obrigatoria: { type: "boolean" },
                    },
                    required: ["titulo", "descricao", "tipo", "obrigatoria"],
                  },
                },
              },
              required: ["nome", "descricao", "etapas"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_trilha" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("[generate-trilha] Gemini error:", res.status, t);
      throw new Error("Erro ao gerar trilha com IA");
    }

    const result = await res.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("IA não retornou dados válidos");

    const { nome, descricao, etapas: generatedEtapas } = JSON.parse(toolCall.function.arguments);

    const { data: trilha, error: trilhaError } = await supabase
      .from("onboarding_trilhas")
      .insert({ nome, descricao, cargo, unidade: unidade || "Todas", created_by: user.id, ativo: true })
      .select()
      .single();
    if (trilhaError) throw new Error(`Erro ao salvar trilha: ${trilhaError.message}`);

    const etapasPayload = generatedEtapas.map((e: { titulo: string; descricao: string; tipo: string; obrigatoria: boolean }, idx: number) => ({
      trilha_id: trilha.id,
      titulo: e.titulo,
      descricao: e.descricao,
      tipo: e.tipo,
      obrigatoria: e.obrigatoria,
      ordem: idx,
    }));

    const { error: etapasError } = await supabase.from("onboarding_etapas").insert(etapasPayload);
    if (etapasError) throw new Error(`Erro ao salvar etapas: ${etapasError.message}`);

    return jsonResponse({ success: true, trilha_id: trilha.id, nome, etapas_count: generatedEtapas.length });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    const status = err.message?.includes("autorizado") || err.message?.includes("admin") ? 403 : (err.status || 500);
    console.error("[generate-trilha] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, status);
  }
});
