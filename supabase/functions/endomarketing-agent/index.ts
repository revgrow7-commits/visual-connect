const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const { tema, tom, detalhes } = await req.json();
    if (!tema) return jsonResponse({ error: "Campo 'tema' é obrigatório" }, 400);

    const userPrompt = `Crie um cartaz de endomarketing com as seguintes características:
- Tema: ${tema}
- Tom de voz: ${tom || "motivacional"}
${detalhes ? `- Detalhes adicionais: ${detalhes}` : ""}

Gere a especificação completa do cartaz em JSON.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return jsonResponse({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }, 429);
      if (res.status === 402) return jsonResponse({ error: "Créditos insuficientes. Adicione créditos ao workspace." }, 402);
      const t = await res.text();
      console.error("[endomarketing] AI gateway error:", res.status, t);
      throw new Error("Erro ao gerar especificação");
    }

    const data = await res.json();
    const spec = extractJSON(data.choices?.[0]?.message?.content || "");

    return jsonResponse({ spec, imageUrl: null });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[endomarketing] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, 500);
  }
});
