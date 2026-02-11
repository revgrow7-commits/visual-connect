import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
Conceito central: Arquitetura efêmera inteligente — estruturas modulares, portáteis e personalizáveis que transformam espaços em ambientes de marca.
Linhas: Smart Flat, Waved, Curved, Convex.
Diferenciais: Impacto visual premium, praticidade, modularidade, integração tecnológica, sustentabilidade, patente INPI.

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
NR-12, NR-35, NR-6. Uso obrigatório de EPIs na produção. Não compartilhar senhas, tokens ou dados pessoais.`;

const SYSTEM_PROMPT = `Você é o **Assistente de Onboarding** da Indústria Visual. 🏭

Seu papel é ajudar novos colaboradores a conhecer a empresa, entender os processos e tirar dúvidas sobre sua integração.

${RAG_CONTEXT}

## REGRAS DE COMPORTAMENTO:
1. Seja amigável, acolhedor e use emojis moderadamente
2. Responda SEMPRE em português brasileiro
3. Use formatação markdown para organizar suas respostas (listas, negrito, headers)
4. Se não souber algo específico, diga honestamente e sugira quem procurar
5. NUNCA compartilhe dados confidenciais, senhas, tokens ou informações pessoais de colaboradores
6. Adapte suas respostas ao cargo do colaborador quando informado
7. Mantenha respostas concisas mas completas
8. Na primeira mensagem, dê boas-vindas e explique o que pode ajudar

## TÓPICOS QUE VOCÊ DOMINA:
- Como a empresa funciona (estrutura, departamentos)
- O fluxo de produção (PCP - do orçamento à entrega)
- As etapas de cada processo (impressão, acabamento, instalação)
- Cultura e valores da empresa (C.R.I.E.)
- Produto Smart Signage e suas linhas
- Dúvidas específicas sobre departamentos`;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const { messages, cargo } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Campo 'messages' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemContent = cargo
      ? `${SYSTEM_PROMPT}\n\n## CONTEXTO DO COLABORADOR:\nCargo: ${cargo}\nAdapte suas respostas considerando as responsabilidades e o contexto deste cargo.`
      : SYSTEM_PROMPT;

    // Convert messages to Anthropic format (filter out system messages)
    const anthropicMessages = messages
      .filter((m: any) => m.role !== "system")
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

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
        system: systemContent,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      throw new Error("Erro ao comunicar com o assistente");
    }

    // Transform Anthropic SSE stream to OpenAI-compatible SSE stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ") || line.trim() === "") continue;

              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);
                // Anthropic streaming: content_block_delta events contain text
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  const chunk = JSON.stringify({
                    choices: [{ delta: { content: parsed.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                }
              } catch {
                // skip malformed lines
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: any) {
    console.error("Onboarding agent error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
