import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_CONFIG: Record<string, { url: string; model: string; envKey: string; isClaude?: boolean }> = {
  gemini: { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.5-flash", envKey: "GOOGLE_GEMINI_API_KEY" },
  claude: { url: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514", envKey: "ANTHROPIC_API_KEY", isClaude: true },
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
- 41.1: Exige manifestação de vontade POR ESCRITO do empregado. Sem documento assinado = banco INVÁLIDO.
- 41.2: Prazo de compensação = 60 DIAS CORRIDOS a partir da QUINZENA da ocorrência (dia 15 ou dia 30 do mês da HE).
  ⚠️ NÃO conta a partir da data da HE. Conta a partir da quinzena seguinte.
  Exemplos:
  - HE em 05/01 → quinzena inicia 15/01 → vence 16/03
  - HE em 21/01 → quinzena inicia 30/01 → vence 31/03
  - HE em 15/01 → quinzena inicia 15/01 → vence 16/03
  - HE em 30/01 → quinzena inicia 30/01 → vence 31/03
- 41.3: Horas não compensadas no prazo → pagar como extras até a 2ª folha após vencimento.
- 41.6: Compensação de dias-ponte (entre feriados e domingos) limitada a 2h diárias.

### Cláusula 10 — Adicionais de Hora Extra (SUPERIORES à CLT)
- 10.1: 60% sobre hora normal — para as duas primeiras horas extras do dia
- 10.2: 80% sobre hora normal — para horas excedentes de 2h diárias
- 10.3: 100% sobre hora normal — para domingos, feriados e dias já compensados
⚠️ A CLT prevê mínimo de 50%. A CCT define 60%/80%/100%. Aplicar SEMPRE os valores da CCT.

### Cláusula 7 — Reflexo das Horas Extras
- Média das HE habituais reflete em: férias, 13º salário e DSR.

### Cláusula 58 — Multa por Descumprimento
- 5% do maior piso salarial vigente da categoria, por infração.

## ALGORITMO DE VENCIMENTO (QUINZENA CCT)
Para cada hora extra:
1. Se dia ≤ 15: inicioQuinzena = dia 15 do mesmo mês
2. Se dia > 15: inicioQuinzena = dia 30 do mesmo mês (ou último dia do mês se < 30 dias)
3. vencimento = inicioQuinzena + 60 dias corridos

## CLASSIFICAÇÃO DE TIPO HE
- Se DOMINGO ou FERIADO → adicional 100% (Cl. 10.3)
- Se dia útil, até 2h extras → adicional 60% (Cl. 10.1)
- Se dia útil, excedente de 2h → adicional 80% (Cl. 10.2)

## FERIADOS SP 2025-2027
2025: 01/01, 25/01, 03/03, 04/03, 18/04, 21/04, 01/05, 19/06, 09/07, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12
2026: 01/01, 25/01, 16/02, 17/02, 03/04, 21/04, 01/05, 04/06, 09/07, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12
2027: 01/01, 25/01, 08/02, 09/02, 26/03, 21/04, 01/05, 27/05, 09/07, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12

## STATUS DOS REGISTROS
- 🟢 NO PRAZO: > 15 dias para vencer → Monitorar
- 🟡 URGENTE: ≤ 15 dias para vencer → Agendar compensação IMEDIATA
- 🔴 VENCIDO: Prazo expirado → PAGAR com adicional CCT até 2ª folha (Cl. 41.3)
- ✅ COMPENSADO: Horas totalmente compensadas → Arquivar

## CÁLCULOS DE PASSIVO
- valor_hora = salario_base / 220
- HE 60% (até 2h): valor_hora × 1.60
- HE 80% (>2h): valor_hora × 1.80
- HE 100% (dom/fer): valor_hora × 2.00
- Encargos: INSS patronal ~28.8% + FGTS 8% = ~36.8%
- custo_total = custo_bruto × 1.368

## REGRAS DE NEGÓCIO
1. Ao registrar HE: classificar tipo (Normal/Dom-Fer), calcular quinzena e vencimento, verificar carta assinada (Cl. 41.1)
2. Ao compensar: FIFO (mais antigas primeiro), respeitar 2h/dia para dias-ponte (Cl. 41.6)
3. Ao vencer: marcar VENCIDO, calcular passivo com adicional CCT correto, alertar pagamento até 2ª folha
4. Rescisão: saldo positivo = pagar integralmente com adicionais CCT

## RESTRIÇÕES
- NUNCA usar adicional de 50% (CLT). Sempre usar 60%/80%/100% (CCT).
- NUNCA calcular vencimento a partir da data da HE. Sempre usar a quinzena (Cl. 41.2).
- NUNCA ignorar encargos patronais (INSS + FGTS).
- NUNCA recomendar descumprir a lei.
- PJ e estagiários: banco de horas NÃO se aplica.
- Salário base padrão: R$ 2.500,00 | Carga mensal padrão: 220h

Você receberá TODOS os dados do banco de horas dos colaboradores no contexto abaixo. Use-os para responder relatórios específicos, cálculos de passivo, alertas de vencimento, análises por departamento, etc. Responda em markdown formatado.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, provider: reqProvider, stream: reqStream } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400);
    }

    // Default: stream for chat, no stream if explicitly disabled
    const shouldStream = reqStream !== false;
    const provider = reqProvider || "gemini";
    const providerCfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.gemini;
    const apiKey = Deno.env.get(providerCfg.envKey);
    if (!apiKey) throw new Error(`${providerCfg.envKey} não configurada`);

    // Fetch real data from banco_horas table
    const bancoHorasContext = await fetchBancoHorasData();
    const systemContent = `${SYSTEM_PROMPT}${bancoHorasContext}`;

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
        console.error("[banco-horas-agent] Claude error:", response.status, t);
        throw new Error("Erro ao comunicar com Claude");
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

    // Gemini (OpenAI-compatible)
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
      console.error(`[banco-horas-agent] ${provider} error:`, response.status, t);
      throw new Error(`Erro ao comunicar com ${provider}`);
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
