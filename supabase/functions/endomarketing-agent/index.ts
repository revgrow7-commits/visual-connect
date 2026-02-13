const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_CONFIG: Record<string, { url: string; model: string; envKey: string }> = {
  gemini: { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.5-flash", envKey: "GOOGLE_GEMINI_API_KEY" },
  claude: { url: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514", envKey: "ANTHROPIC_API_KEY" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o", envKey: "OPENAI_API_KEY" },
  perplexity: { url: "https://api.perplexity.ai/chat/completions", model: "sonar-pro", envKey: "PERPLEXITY_API_KEY" },
};

const BRAND = {
  colors: { primary: "#A02040", secondary: "#702050", gradientStart: "#C0304A", gradientEnd: "#5030A0", white: "#FFFFFF", dark: "#1A1A1A" },
  fonts: ["Inter", "Poppins"],
};

const SYSTEM_PROMPT = `Você é um designer gráfico especialista em comunicação interna corporativa.
Sua tarefa é criar especificações detalhadas de cartazes para endomarketing.

PALETA DE CORES DA MARCA:
- Primária (Bordô): ${BRAND.colors.primary}
- Secundária (Roxo): ${BRAND.colors.secondary}
- Gradiente: de ${BRAND.colors.gradientStart} para ${BRAND.colors.gradientEnd}
- Branco: ${BRAND.colors.white} | Escuro: ${BRAND.colors.dark}

TIPOGRAFIA: ${BRAND.fonts.join(", ")}

REGRAS:
1. Sempre use a paleta de cores da marca
2. Mantenha hierarquia visual clara (título > subtítulo > corpo)
3. Use espaço em branco generosamente
4. Inclua call-to-action quando aplicável
5. Adapte o tom conforme solicitado (formal, motivacional, direto)

Responda SEMPRE em JSON com a seguinte estrutura:
{
  "titulo": "", "subtitulo": "", "corpo": "", "callToAction": "",
  "layout": { "orientacao": "portrait|landscape", "fundo": "", "elementosVisuais": [""] },
  "cores": { "fundo": "#hex", "titulo": "#hex", "subtitulo": "#hex", "corpo": "#hex", "cta": "#hex" },
  "tipografia": { "titulo": { "font": "", "peso": "", "tamanho": "" }, "corpo": { "font": "", "peso": "", "tamanho": "" } },
  "sugestoes": [""]
}`;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJSON(text: string): unknown {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(fenced ? fenced[1].trim() : text);
  } catch {
    return { raw: text };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, tom, detalhes, provider: reqProvider } = await req.json();
    if (!tema) return jsonResponse({ error: "Campo 'tema' é obrigatório" }, 400);

    const provider = reqProvider || "gemini";
    const providerCfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.gemini;
    const apiKey = Deno.env.get(providerCfg.envKey);
    if (!apiKey) throw new Error(`${providerCfg.envKey} não configurada`);

    const userPrompt = `Crie um cartaz de endomarketing com as seguintes características:
- Tema: ${tema}
- Tom de voz: ${tom || "motivacional"}
${detalhes ? `- Detalhes adicionais: ${detalhes}` : ""}

Gere a especificação completa do cartaz em JSON.`;

    let content = "";
    if (provider === "claude") {
      const res = await fetch(providerCfg.url, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: providerCfg.model, max_tokens: 4096, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }] }),
      });
      if (!res.ok) {
        if (res.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
        throw new Error("Erro ao gerar especificação");
      }
      const data = await res.json();
      content = data.content?.[0]?.text || "";
    } else {
      const res = await fetch(providerCfg.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: providerCfg.model, max_tokens: 4096, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }] }),
      });
      if (!res.ok) {
        if (res.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
        throw new Error("Erro ao gerar especificação");
      }
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || "";
    }

    const spec = extractJSON(content);
    return jsonResponse({ spec, imageUrl: null });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[endomarketing] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, 500);
  }
});
