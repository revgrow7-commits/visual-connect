import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_CONFIG: Record<string, { url: string; model: string; envKey: string; isClaude?: boolean }> = {
  gemini: { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.5-flash", envKey: "GOOGLE_GEMINI_API_KEY" },
  claude: { url: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514", envKey: "ANTHROPIC_API_KEY", isClaude: true },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o", envKey: "OPENAI_API_KEY" },
  perplexity: { url: "https://api.perplexity.ai/chat/completions", model: "sonar-pro", envKey: "PERPLEXITY_API_KEY" },
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchBancoHorasData(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "\n\n⚠️ Conexão com banco de dados indisponível.";

  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await sb
      .from("banco_horas")
      .select("nome, cargo, departamento, unidade, competencia, normais, faltas, ex60, ex80, ex100, b_cred, b_deb, b_saldo, b_total, carga, saldo_decimal, email")
      .order("competencia", { ascending: false })
      .limit(500);

    if (error || !data || data.length === 0) return "\n\n⚠️ Sem dados de banco de horas disponíveis no momento.";

    const competencias = [...new Set(data.map((r: any) => r.competencia))];
    const totalColab = new Set(data.map((r: any) => r.nome)).size;
    const positivos = data.filter((r: any) => (r.saldo_decimal || 0) > 0).length;
    const negativos = data.filter((r: any) => (r.saldo_decimal || 0) < 0).length;
    const criticos = data.filter((r: any) => Math.abs(r.saldo_decimal || 0) > 40).length;

    const byDept: Record<string, { count: number; saldo: number }> = {};
    data.forEach((r: any) => {
      const dept = r.departamento || "Sem departamento";
      if (!byDept[dept]) byDept[dept] = { count: 0, saldo: 0 };
      byDept[dept].count++;
      byDept[dept].saldo += r.saldo_decimal || 0;
    });

    const deptSummary = Object.entries(byDept)
      .map(([dept, info]) => `  - ${dept}: ${info.count} registros, saldo total: ${info.saldo.toFixed(1)}h`)
      .join("\n");

    const rows = data.map((r: any) =>
      `- ${r.nome} | ${r.cargo || "?"} | ${r.departamento || "?"} | ${r.unidade || "?"} | Comp: ${r.competencia} | Saldo: ${r.b_saldo || "00:00"} (${r.saldo_decimal || 0}h) | Ex60: ${r.ex60 || "00:00"} | Ex80: ${r.ex80 || "00:00"} | Ex100: ${r.ex100 || "00:00"} | Cred: ${r.b_cred || "00:00"} | Deb: ${r.b_deb || "00:00"} | Normais: ${r.normais || "00:00"} | Faltas: ${r.faltas || "00:00"} | Carga: ${r.carga || "00:00"}`
    ).join("\n");

    return `\n\n## ⏰ DADOS BANCO DE HORAS (Secullum - ${data.length} registros)
Data de hoje: ${new Date().toISOString().split("T")[0]}
Competências disponíveis: ${competencias.join(", ")}
Total colaboradores: ${totalColab} | Saldo positivo: ${positivos} | Saldo negativo: ${negativos} | Críticos (>40h): ${criticos}

### Por departamento:
${deptSummary}

### Registros completos:
${rows}`;
  } catch (e) {
    console.error("[banco-horas-ctx] Error:", e);
    return "\n\n⚠️ Erro ao buscar dados do banco de horas.";
  }
}

const SYSTEM_PROMPT = `Você é o **Agente Especialista em Banco de Horas e Conformidade Trabalhista** da Indústria Visual ⚖️

Sua função é gerenciar, calcular, alertar e orientar sobre o controle de banco de horas dos colaboradores, aplicando simultaneamente a CLT (Arts. 58, 59, 59-A, 59-B) e a CCT EAA × SESCON-SP 2025/2026. A CCT prevalece sobre a CLT quando mais benéfica ao trabalhador (princípio da norma mais favorável — Art. 620 CLT c/c Reforma Trabalhista).

Você opera com dados sincronizados do sistema Secullum (ponto eletrônico) e mantém conformidade legal rigorosa.

## EMPRESA
Indústria Visual — Integradora de comunicação visual. Unidades: POA (Porto Alegre) e SP (São Paulo).

## TOM
- Português BR formal e acessível. Frases curtas.
- Cite artigo legal ou cláusula que embasa TODA resposta.
- Nunca invente valores. Se faltar informação, pergunte.
- Use níveis de severidade: ✅ Normal | ⚠️ Atenção/Urgente | 🔴 Crítico/Vencido
- Formate respostas em **Markdown** rico (tabelas, listas, negrito, emojis).

## BASE LEGAL — CLT
- Art. 58: Jornada padrão 8h/dia, 44h/semana
- Art. 59: Limite 2h extras/dia; acordo individual escrito para banco até 6 meses
- Art. 59 §5º: Banco por acordo individual → compensação em até 6 meses
- Art. 59-A: Jornada 12×36 mediante acordo individual escrito
- Art. 59-B: HE habituais não descaracterizam o banco
- Art. 7º XVI CF/88: Remuneração mínima 50% sobre hora normal
- Lei 605/49: DSR e feriados

## BASE LEGAL — CCT EAA × SESCON-SP 2025/2026 (PREVALECE)

### Cláusula 41 — Compensação de Horário (Banco de Horas)
- 41.1: Exige manifestação de vontade POR ESCRITO do empregado.
- 41.2: Prazo de compensação = 60 DIAS CORRIDOS a partir da QUINZENA da ocorrência.
- 41.3: Horas não compensadas no prazo → pagar como extras até a 2ª folha após vencimento.
- 41.6: Compensação de dias-ponte limitada a 2h diárias.

### Cláusula 10 — Adicionais de Hora Extra (SUPERIORES à CLT)
- 10.1: 60% sobre hora normal — para as duas primeiras horas extras do dia
- 10.2: 80% sobre hora normal — para horas excedentes de 2h diárias
- 10.3: 100% sobre hora normal — para domingos, feriados e dias já compensados

### Cláusula 7 — Reflexo das Horas Extras
- Média das HE habituais reflete em: férias, 13º salário e DSR.

### Cláusula 58 — Multa por Descumprimento
- 5% do maior piso salarial vigente da categoria, por infração.

## CÁLCULOS DE PASSIVO
- valor_hora = salario_base / 220
- HE 60% (até 2h): valor_hora × 1.60
- HE 80% (>2h): valor_hora × 1.80
- HE 100% (dom/fer): valor_hora × 2.00
- Encargos: INSS patronal ~28.8% + FGTS 8% = ~36.8%
- custo_total = custo_bruto × 1.368
- Salário base padrão: R$ 2.500,00 | Carga mensal padrão: 220h

Você receberá TODOS os dados do banco de horas dos colaboradores no contexto abaixo. Use-os para responder relatórios específicos, cálculos de passivo, alertas de vencimento, análises por departamento, etc. Responda em markdown formatado.`;

// Tool definition for structured report output
const REPORT_TOOL = {
  type: "function",
  function: {
    name: "generate_report",
    description: "Gera relatório estruturado de banco de horas com análise CCT/CLT completa",
    parameters: {
      type: "object",
      properties: {
        resumo_executivo: {
          type: "object",
          properties: {
            total_colaboradores: { type: "number" },
            normais: { type: "number" },
            urgentes: { type: "number" },
            vencidos: { type: "number" },
            saldo_total_horas: { type: "string" },
            total_he_registradas: { type: "number" },
            total_he_compensadas: { type: "number" },
            total_he_pendentes: { type: "number" },
            passivo_projetado: { type: "number" },
            passivo_extras_60: { type: "number" },
            passivo_extras_80: { type: "number" },
            passivo_extras_100: { type: "number" },
            custo_inss: { type: "number" },
            custo_fgts: { type: "number" },
            conformidade_percent: { type: "number" },
          },
          required: ["total_colaboradores", "normais", "urgentes", "vencidos", "passivo_projetado", "passivo_extras_60", "passivo_extras_80", "passivo_extras_100", "custo_inss", "custo_fgts", "conformidade_percent"],
        },
        colaboradores: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              cargo: { type: "string" },
              departamento: { type: "string" },
              status: { type: "string", enum: ["normal", "urgente", "vencido", "compensado"] },
              emoji: { type: "string" },
              saldo: { type: "string" },
              saldo_decimal: { type: "number" },
              horas_extras_60: { type: "string" },
              horas_extras_80: { type: "string" },
              horas_extras_100: { type: "string" },
              passivo_projetado: { type: "number" },
              dias_para_vencer: { type: "number" },
              data_vencimento: { type: "string" },
              carta_assinada: { type: "boolean" },
              acoes_recomendadas: { type: "array", items: { type: "string" } },
            },
            required: ["nome", "status", "saldo", "saldo_decimal", "passivo_projetado", "dias_para_vencer"],
          },
        },
        alertas_criticos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              colaborador: { type: "string" },
              motivo: { type: "string" },
              acao_imediata: { type: "string" },
              base_legal: { type: "string" },
              passivo_envolvido: { type: "number" },
            },
            required: ["colaborador", "motivo", "acao_imediata", "base_legal", "passivo_envolvido"],
          },
        },
        checklist_conformidade: {
          type: "object",
          properties: {
            cartas_assinadas: { type: "boolean" },
            vencimentos_por_quinzena: { type: "boolean" },
            adicionais_cct: { type: "boolean" },
            pagamento_2a_folha: { type: "boolean" },
            limite_dias_ponte: { type: "boolean" },
            feriados_atualizados: { type: "boolean" },
            encargos_incluidos: { type: "boolean" },
            reflexo_habituais: { type: "boolean" },
          },
        },
        base_legal_aplicada: { type: "array", items: { type: "string" } },
        recomendacoes_gerais: { type: "array", items: { type: "string" } },
      },
      required: ["resumo_executivo", "colaboradores", "alertas_criticos", "checklist_conformidade", "base_legal_aplicada", "recomendacoes_gerais"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, provider: reqProvider, stream: reqStream, mode } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400);
    }

    const shouldStream = reqStream !== false;
    const isReportMode = mode === "report";
    const provider = reqProvider || "gemini";
    const providerCfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.gemini;
    const apiKey = Deno.env.get(providerCfg.envKey);
    if (!apiKey) throw new Error(`${providerCfg.envKey} não configurada`);

    const bancoHorasContext = await fetchBancoHorasData();
    const systemContent = `${SYSTEM_PROMPT}${bancoHorasContext}`;

    // Report mode: use tool calling for structured output (Gemini only, no streaming)
    if (isReportMode) {
      const apiMessages = [
        { role: "system", content: systemContent },
        ...messages.filter((m: { role: string }) => m.role !== "system"),
      ];

      const body: any = {
        model: providerCfg.model,
        max_tokens: 8192,
        messages: apiMessages,
        tools: [REPORT_TOOL],
        tool_choice: { type: "function", function: { name: "generate_report" } },
      };

      const response = await fetch(providerCfg.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error(`[banco-horas-agent] report error:`, response.status, t);
        if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
        throw new Error(`Erro ao gerar relatório: ${response.status}`);
      }

      const result = await response.json();
      console.log("[banco-horas-agent] report result keys:", JSON.stringify(Object.keys(result)));
      console.log("[banco-horas-agent] finish_reason:", result.choices?.[0]?.finish_reason);
      console.log("[banco-horas-agent] message keys:", JSON.stringify(Object.keys(result.choices?.[0]?.message || {})));
      
      // Extract tool call arguments
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const reportData = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        return jsonResponse({ report: reportData });
      }

      // Fallback: try content as text with JSON inside
      const content = result.choices?.[0]?.message?.content;
      if (content && typeof content === "string") {
        // Try to extract JSON from the content
        let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const jsonStart = cleaned.indexOf("{");
        const jsonEnd = cleaned.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
            .replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
          try {
            const parsed = JSON.parse(cleaned);
            return jsonResponse({ report: parsed });
          } catch (parseErr) {
            console.error("[banco-horas-agent] JSON parse fallback failed:", parseErr);
          }
        }
        return jsonResponse({ content });
      }

      console.error("[banco-horas-agent] Unexpected response:", JSON.stringify(result).substring(0, 500));
      throw new Error("Resposta inesperada do modelo");
    }

    // Chat mode (streaming)
    if (providerCfg.isClaude) {
      const claudeMsgs = messages
        .filter((m: { role: string }) => m.role !== "system")
        .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

      const response = await fetch(providerCfg.url, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: providerCfg.model,
          max_tokens: 8192,
          system: systemContent,
          messages: claudeMsgs,
          stream: shouldStream,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
        const t = await response.text();
        console.error("[banco-horas-agent] Claude error:", response.status, t.substring(0, 500));
        return jsonResponse({ error: `Claude ${response.status}: ${t.substring(0, 200)}` }, response.status);
      }

      if (shouldStream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
      const claudeResult = await response.json();
      const claudeText = claudeResult.content?.[0]?.text || "";
      return jsonResponse({ choices: [{ message: { content: claudeText } }] });
    }

    // Gemini (OpenAI-compatible) - chat mode
    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.filter((m: { role: string }) => m.role !== "system"),
    ];

    const response = await fetch(providerCfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: providerCfg.model,
        max_tokens: 8192,
        messages: apiMessages,
        stream: shouldStream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
      const t = await response.text();
      console.error(`[banco-horas-agent] ${provider} error:`, response.status, t.substring(0, 500));
      return jsonResponse({ error: `${provider} ${response.status}: ${t.substring(0, 200)}` }, response.status);
    }

    if (shouldStream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[banco-horas-agent] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, 500);
  }
});
