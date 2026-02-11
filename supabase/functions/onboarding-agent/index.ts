const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-2.5-flash";

const RAG_CONTEXT = `# Base de Conhecimento – Indústria Visual

## 1) Visão Geral
A Indústria Visual é uma integradora de soluções de comunicação visual e experiências físicas, com atuação forte em eventos, varejo, PDV, feiras, ativações e ambientes de marca. Opera com cultura interna C.R.I.E. (Criar, Relevância, Inovação e Eficiência).
Posicionamento: "Smart Signage by Indústria Visual - a nova arquitetura da comunicação visual."

## 2) Produto Principal: Smart Signage
Plataforma modular de comunicação visual inteligente que integra design de alto impacto, tecnologia e experiência imersiva e escalável.
Linhas: Smart Flat, Waved, Curved, Convex.

## 3) Cultura e Valores – C.R.I.E.
- Criar: Inovação constante em soluções visuais
- Relevância: Impacto real para clientes e mercado
- Inovação: Tecnologia e design de ponta
- Eficiência: Processos otimizados e sustentáveis

## 4) Departamentos
Comercial, PCP, Design, Produção/Impressão, Acabamento, Instalação, Logística, Administrativo/RH, Marketing.

## 5) Fluxo de Produção (PCP)
1. Orçamento → 2. Aprovação → 3. Briefing → 4. Aprovação arte → 5. PCP → 6. Impressão → 7. Acabamento → 8. QC → 9. Logística → 10. Instalação

## 6) Segurança e Compliance
NR-12, NR-35, NR-6. Uso obrigatório de EPIs na produção.`;

const SYSTEM_PROMPT = `Você é o **Assistente de Onboarding** da Indústria Visual. 🏭

Seu papel é ajudar novos colaboradores a conhecer a empresa, entender os processos e tirar dúvidas sobre sua integração.

${RAG_CONTEXT}

## REGRAS:
1. Seja amigável, acolhedor e use emojis moderadamente
2. Responda SEMPRE em português brasileiro
3. Use formatação markdown (listas, negrito, headers)
4. Se não souber algo específico, diga honestamente e sugira quem procurar
5. NUNCA compartilhe dados confidenciais, senhas, tokens ou informações pessoais
6. Adapte respostas ao cargo do colaborador quando informado
7. Mantenha respostas concisas mas completas`;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

    const { messages, cargo } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400);
    }

    const systemContent = cargo
      ? `${SYSTEM_PROMPT}\n\n## CONTEXTO DO COLABORADOR:\nCargo: ${cargo}\nAdapte suas respostas considerando as responsabilidades deste cargo.`
      : SYSTEM_PROMPT;

    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.filter((m: { role: string }) => m.role !== "system"),
    ];

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: apiMessages, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }, 429);
      const t = await response.text();
      console.error("[onboarding] Gemini error:", response.status, t);
      throw new Error("Erro ao comunicar com o assistente");
    }

    // Gemini OpenAI-compatible endpoint, stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[onboarding] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, 500);
  }
});
