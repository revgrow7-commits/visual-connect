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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY não está configurada");

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

    // Step 1: Generate poster spec with Gemini
    const specResponse = await fetch(
      `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        }),
      }
    );

    if (!specResponse.ok) {
      if (specResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await specResponse.text();
      console.error("Gemini spec error:", specResponse.status, errText);
      throw new Error("Erro ao gerar especificação");
    }

    const specData = await specResponse.json();
    const rawContent = specData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response (may be wrapped in markdown code block)
    let spec: any;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      spec = JSON.parse(jsonMatch[1].trim());
    } catch {
      spec = { raw: rawContent };
    }

    let imageUrl: string | null = null;

    // Step 2: Optionally generate an image preview with Gemini image model
    if (gerarImagem) {
      const imagePrompt = `Create a corporate internal communication poster with the following specifications:
Title: "${spec.titulo || tema}"
Subtitle: "${spec.subtitulo || ""}"
Style: Modern, clean, professional
Color scheme: burgundy (#A02040), deep purple (#702050), gradient from #C0304A to #5030A0
Font: Inter or Poppins, clean sans-serif
Layout: ${spec.layout?.orientacao === "landscape" ? "Landscape 16:9" : "Portrait A4"}
Background: ${spec.layout?.fundo || "gradient from burgundy to purple"}
Visual elements: ${spec.layout?.elementosVisuais?.join(", ") || "abstract geometric shapes"}
Tone: ${tom || "motivational"}
Include the title text "${spec.titulo || tema}" prominently displayed.
Ultra high resolution corporate poster design.`;

      try {
        const imgResponse = await fetch(
          `${GEMINI_API_URL}/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
              },
            }),
          }
        );

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          const parts = imgData.candidates?.[0]?.content?.parts || [];
          const imagePart = parts.find((p: any) => p.inlineData);
          if (imagePart?.inlineData) {
            imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          }
        } else {
          console.error("Image generation failed:", imgResponse.status);
        }
      } catch (e) {
        console.error("Image generation error:", e);
      }
    }

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
