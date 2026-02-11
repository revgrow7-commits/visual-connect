import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAG_CONTEXT = `# Base de Conhecimento – Indústria Visual
## Departamentos
Comercial, PCP, Design, Produção/Impressão, Acabamento, Instalação, Logística, Administrativo/RH, Marketing.
## Fluxo de Produção (PCP)
1. Orçamento → 2. Aprovação → 3. Briefing → 4. Aprovação arte → 5. PCP → 6. Impressão → 7. Acabamento → 8. QC → 9. Logística → 10. Instalação
## Segurança
NR-12 (Máquinas), NR-35 (Altura), NR-6 (EPIs). Uso obrigatório de EPIs na produção.`;

const GENERATION_PROMPT = `Você é um especialista em RH e onboarding da Indústria Visual.

Com base no contexto da empresa fornecido, gere uma trilha de onboarding completa para o cargo e unidade especificados.

${RAG_CONTEXT}

REGRAS:
1. Gere entre 6 e 12 etapas relevantes para o cargo
2. Misture tipos: checklist (tarefas práticas), video (conteúdos para assistir), documento (materiais para ler)
3. As primeiras etapas devem ser sobre a empresa, cultura e valores
4. Depois inclua etapas específicas do departamento/cargo
5. Inclua etapas de segurança (NRs) quando aplicável (produção, instalação, acabamento)
6. Marque como obrigatória as etapas essenciais

Responda APENAS com o JSON usando a tool fornecida.`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Não autorizado");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Apenas administradores podem gerar trilhas");

    const { cargo, unidade } = await req.json();
    if (!cargo) throw new Error("Campo 'cargo' é obrigatório");

    const userPrompt = `Gere uma trilha de onboarding para:
- Cargo: ${cargo}
- Unidade: ${unidade || "Todas"}

Crie a trilha com nome, descrição e todas as etapas.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: GENERATION_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          name: "create_trilha",
          description: "Cria uma trilha de onboarding com suas etapas",
          input_schema: {
            type: "object",
            properties: {
              nome: { type: "string", description: "Nome da trilha" },
              descricao: { type: "string", description: "Descrição da trilha" },
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
        }],
        tool_choice: { type: "tool", name: "create_trilha" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      throw new Error("Erro ao gerar trilha com IA");
    }

    const result = await response.json();
    const toolUseBlock = result.content?.find((b: any) => b.type === "tool_use");
    if (!toolUseBlock?.input) throw new Error("IA não retornou dados válidos");

    const { nome, descricao, etapas: generatedEtapas } = toolUseBlock.input;

    const { data: trilha, error: trilhaError } = await supabase
      .from("onboarding_trilhas")
      .insert({
        nome,
        descricao,
        cargo,
        unidade: unidade || "Todas",
        created_by: user.id,
        ativo: true,
      })
      .select()
      .single();

    if (trilhaError) throw new Error(`Erro ao salvar trilha: ${trilhaError.message}`);

    const etapasPayload = generatedEtapas.map((e: any, idx: number) => ({
      trilha_id: trilha.id,
      titulo: e.titulo,
      descricao: e.descricao,
      tipo: e.tipo,
      obrigatoria: e.obrigatoria,
      ordem: idx,
    }));

    const { error: etapasError } = await supabase
      .from("onboarding_etapas")
      .insert(etapasPayload);

    if (etapasError) throw new Error(`Erro ao salvar etapas: ${etapasError.message}`);

    return new Response(
      JSON.stringify({ success: true, trilha_id: trilha.id, nome, etapas_count: generatedEtapas.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-trilha error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes("autorizado") || error.message.includes("admin") ? 403 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
