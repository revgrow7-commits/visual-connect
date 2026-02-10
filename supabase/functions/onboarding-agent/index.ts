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

### Linhas do produto:
- Smart Flat
- Waved
- Curved
- Convex

### Diferenciais competitivos:
- Impacto visual premium
- Praticidade e economia (montagem rápida e logística otimizada)
- Modularidade (reuso, expansão e customização)
- Integração tecnológica
- Sustentabilidade (reuso e redução de descarte)
- Patente registrada no INPI

### Construção e montagem:
- Estrutura modular em alumínio
- Sistema de montagem rápida tipo click-in
- Tensionamento de tecido para acabamento premium
- Transporte compacto e modular

## 3) Catálogo e Aplicações
Aplicações em: feiras, PDVs, eventos corporativos, showrooms, ativações de marca.

## 4) Gestão de Marketing (Trello)
Colunas: Comercial/Relatórios/Receptivo, Reuniões, E-mail Marketing, Instagram, LinkedIn, YouTube.

## 5) Cultura e Valores – C.R.I.E.
- **Criar**: Inovação constante em soluções visuais
- **Relevância**: Impacto real para clientes e mercado
- **Inovação**: Tecnologia e design de ponta
- **Eficiência**: Processos otimizados e sustentáveis

## 6) Departamentos
- **Comercial**: Prospecção, atendimento ao cliente, orçamentos
- **PCP (Planejamento e Controle de Produção)**: Gestão do fluxo de produção
- **Design**: Criação de projetos visuais e layouts
- **Produção/Impressão**: Impressão digital e offset
- **Acabamento**: Corte, laminação, montagem de peças
- **Instalação**: Montagem em campo, eventos e PDVs
- **Logística**: Transporte e distribuição
- **Administrativo/RH**: Gestão de pessoas e processos internos
- **Marketing**: Comunicação interna e externa

## 7) Fluxo de Produção (PCP)
1. Orçamento comercial
2. Aprovação do cliente
3. Briefing e projeto de design
4. Aprovação de arte
5. Planejamento de produção (PCP)
6. Impressão
7. Acabamento
8. Controle de qualidade
9. Embalagem e logística
10. Instalação/Entrega

## 8) Processos por Área
### Impressão:
- Impressão digital de grande formato
- Impressão UV
- Sublimação em tecido

### Acabamento:
- Corte CNC e plotter
- Laminação e aplicação
- Montagem de estruturas

### Instalação:
- Montagem de estandes
- Aplicação de adesivos
- Instalação de comunicação visual

## 9) Segurança e Compliance
- Não compartilhar senhas, tokens, chaves de API
- Não compartilhar dados de clientes
- Não compartilhar dados pessoais de colaboradores
- Operar com ambientes segregados
- Usar variáveis de ambiente e secrets manager`;

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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY não está configurada");

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

    // Convert OpenAI-style messages to Gemini format
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemContent }] },
          contents: geminiContents,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      throw new Error("Erro ao comunicar com o assistente");
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
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
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  // Emit OpenAI-compatible SSE chunk
                  const chunk = JSON.stringify({
                    choices: [{ delta: { content: text } }],
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
