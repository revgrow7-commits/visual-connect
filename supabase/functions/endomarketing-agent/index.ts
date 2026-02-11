import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND = {
  colors: {
    primary: "#A02040",
    secondary: "#702050",
    gradientStart: "#C0304A",
    gradientEnd: "#5030A0",
    white: "#FFFFFF",
    dark: "#1A1A1A",
  },
  fonts: ["Inter", "Poppins"],
};

const SYSTEM_PROMPT = `Você é um designer gráfico especialista em comunicação interna corporativa.
Sua tarefa é criar especificações detalhadas de cartazes para endomarketing.

PALETA DE CORES DA MARCA:
- Primária (Bordô): ${BRAND.colors.primary}
- Secundária (Roxo): ${BRAND.colors.secondary}
- Gradiente: de ${BRAND.colors.gradientStart} para ${BRAND.colors.gradientEnd}
- Branco: ${BRAND.colors.white}
- Escuro: ${BRAND.colors.dark}

TIPOGRAFIA: ${BRAND.fonts.join(", ")}

REGRAS:
1. Sempre use a paleta de cores da marca
2. Mantenha hierarquia visual clara (título > subtítulo > corpo)
3. Use espaço em branco generosamente
4. Inclua call-to-action quando aplicável
5. Adapte o tom conforme solicitado (formal, motivacional, direto)

Responda SEMPRE em JSON com a seguinte estrutura:
{
  "titulo": "Título principal do cartaz",
  "subtitulo": "Subtítulo ou tagline",
  "corpo": "Texto do corpo do cartaz",
  "callToAction": "Texto do CTA (se aplicável)",
  "layout": {
    "orientacao": "portrait" | "landscape",
    "fundo": "descrição do fundo (cor sólida, gradiente, etc.)",
    "elementosVisuais": ["lista de elementos visuais sugeridos"]
  },
  "cores": {
    "fundo": "#hex",
    "titulo": "#hex",
    "subtitulo": "#hex",
    "corpo": "#hex",
    "cta": "#hex"
  },
  "tipografia": {
    "titulo": { "font": "nome", "peso": "bold/semibold", "tamanho": "grande/medio" },
    "corpo": { "font": "nome", "peso": "regular", "tamanho": "medio/pequeno" }
  },
  "sugestoes": ["dicas extras para o designer finalizar"]
}`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const { tema, tom, detalhes, gerarImagem } = await req.json();

    if (!tema) {
      return new Response(JSON.stringify({ error: "Campo 'tema' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Crie um cartaz de endomarketing com as seguintes características:
- Tema: ${tema}
- Tom de voz: ${tom || "motivacional"}
${detalhes ? `- Detalhes adicionais: ${detalhes}` : ""}

Gere a especificação completa do cartaz em JSON.`;

    const specResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!specResponse.ok) {
      if (specResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await specResponse.text();
      console.error("Anthropic spec error:", specResponse.status, errText);
      throw new Error("Erro ao gerar especificação");
    }

    const specData = await specResponse.json();
    const rawContent = specData.content?.[0]?.text || "";

    let spec: any;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      spec = JSON.parse(jsonMatch[1].trim());
    } catch {
      spec = { raw: rawContent };
    }

    // Note: Image generation via Anthropic is not supported directly.
    // The gerarImagem flag is preserved for future integration with an image generation service.
    const imageUrl: string | null = null;

    return new Response(JSON.stringify({ spec, imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Endomarketing agent error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
