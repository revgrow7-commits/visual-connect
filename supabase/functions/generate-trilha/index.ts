import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAG_CONTEXT = `# Base de Conhecimento – Indústria Visual

## 1) Visão Geral
A Indústria Visual é uma integradora de soluções de comunicação visual e experiências físicas, com atuação forte em eventos, varejo, PDV, feiras, ativações e ambientes de marca. Opera com cultura interna C.R.I.E. (Criar, Relevância, Inovação e Eficiência).
Posicionamento: "Smart Signage by Indústria Visual - a nova arquitetura da comunicação visual."

## 2) Produto Principal: Smart Signage
Plataforma modular de comunicação visual inteligente que integra design de alto impacto, tecnologia e experiência imersiva e escalável.
Linhas: Smart Flat, Waved, Curved, Convex.
Diferenciais: Impacto visual premium, praticidade, modularidade, integração tecnológica, sustentabilidade, patente INPI.
Construção: Estrutura modular em alumínio, sistema click-in, tensionamento de tecido, transporte compacto.

## 3) Cultura e Valores – C.R.I.E.
- Criar: Inovação constante em soluções visuais
- Relevância: Impacto real para clientes e mercado
- Inovação: Tecnologia e design de ponta
- Eficiência: Processos otimizados e sustentáveis

## 4) Departamentos
- Comercial: Prospecção, atendimento ao cliente, orçamentos
- PCP: Gestão do fluxo de produção
- Design: Criação de projetos visuais e layouts
- Produção/Impressão: Impressão digital e offset
- Acabamento: Corte, laminação, montagem de peças
- Instalação: Montagem em campo, eventos e PDVs
- Logística: Transporte e distribuição
- Administrativo/RH: Gestão de pessoas e processos internos
- Marketing: Comunicação interna e externa

## 5) Fluxo de Produção (PCP)
1. Orçamento comercial → 2. Aprovação do cliente → 3. Briefing e projeto de design → 4. Aprovação de arte → 5. Planejamento PCP → 6. Impressão → 7. Acabamento → 8. Controle de qualidade → 9. Embalagem e logística → 10. Instalação/Entrega

## 6) Processos por Área
Impressão: Impressão digital grande formato, UV, sublimação tecido.
Acabamento: Corte CNC/plotter, laminação, montagem estruturas.
Instalação: Montagem estandes, aplicação adesivos, comunicação visual.

## 7) Segurança e Compliance
- NR-12 (Segurança em máquinas), NR-35 (Trabalho em altura), NR-6 (EPIs)
- Uso obrigatório de EPIs na produção
- Procedimentos de segurança para instalação`;

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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
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

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: GENERATION_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          tools: [{
            function_declarations: [{
              name: "create_trilha",
              description: "Cria uma trilha de onboarding com suas etapas",
              parameters: {
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
          }],
          tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["create_trilha"] } },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      throw new Error("Erro ao gerar trilha com IA");
    }

    const geminiData = await response.json();
    const functionCall = geminiData.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    if (!functionCall?.args) throw new Error("IA não retornou dados válidos");

    const { nome, descricao, etapas: generatedEtapas } = functionCall.args;

    // Insert trilha
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

    // Insert etapas
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
