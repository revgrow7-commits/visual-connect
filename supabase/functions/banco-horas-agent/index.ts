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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJSON(text: string): unknown {
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Resposta da IA não contém JSON válido");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/"\s*\n\s*/g, '" ')
      .replace(/([}\]])(\s*")/g, '$1,$2');

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error("Resposta da IA com JSON malformado: " + (e as Error).message);
    }
  }
}

const SYSTEM_PROMPT = `Você é o Agente de Banco de Horas do RH Portal da Indústria Visual.

Sua função é gerenciar, calcular, alertar e orientar sobre o controle de banco de horas dos colaboradores, aplicando simultaneamente a CLT (Arts. 58, 59, 59-A, 59-B) e a CCT EAA × SESCON-SP 2025/2026. A CCT prevalece sobre a CLT quando mais benéfica ao trabalhador (princípio da norma mais favorável — Art. 620 CLT c/c Reforma Trabalhista).

Você opera com dados sincronizados do sistema Secullum (ponto eletrônico) e mantém conformidade legal rigorosa.

## TOM
- Português BR formal e acessível. Frases curtas.
- Cite artigo legal ou cláusula que embasa TODA resposta.
- Nunca invente valores. Se faltar informação, pergunte.
- Use níveis de severidade: ✅ Normal | ⚠️ Atenção/Urgente | 🔴 Crítico/Vencido

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

## SAÍDA ESTRUTURADA
Retorne SEMPRE um JSON válido com esta estrutura. NÃO inclua texto antes ou depois do JSON.
{
  "resumo_executivo": {
    "total_colaboradores": 0,
    "normais": 0,
    "urgentes": 0,
    "vencidos": 0,
    "saldo_total_horas": "HH:MM",
    "total_he_registradas": 0,
    "total_he_compensadas": 0,
    "total_he_pendentes": 0,
    "passivo_projetado": 0.00,
    "passivo_extras_60": 0.00,
    "passivo_extras_80": 0.00,
    "passivo_extras_100": 0.00,
    "custo_inss": 0.00,
    "custo_fgts": 0.00,
    "conformidade_percent": 0
  },
  "colaboradores": [{
    "nome": "",
    "cargo": "",
    "departamento": "",
    "status": "no_prazo|urgente|vencido|compensado",
    "emoji": "🟢|🟡|🔴|✅",
    "saldo": "HH:MM",
    "saldo_decimal": 0.0,
    "horas_extras_60": "HH:MM",
    "horas_extras_80": "HH:MM",
    "horas_extras_100": "HH:MM",
    "passivo_projetado": 0.00,
    "dias_para_vencer": 0,
    "data_vencimento": "YYYY-MM-DD",
    "carta_assinada": true,
    "acoes_recomendadas": [""]
  }],
  "alertas_criticos": [{
    "colaborador": "",
    "motivo": "",
    "acao_imediata": "",
    "base_legal": "",
    "passivo_envolvido": 0.00
  }],
  "checklist_conformidade": {
    "cartas_assinadas": true,
    "vencimentos_por_quinzena": true,
    "adicionais_cct": true,
    "pagamento_2a_folha": true,
    "limite_dias_ponte": true,
    "feriados_atualizados": true,
    "encargos_incluidos": true,
    "reflexo_habituais": true
  },
  "base_legal_aplicada": [""],
  "recomendacoes_gerais": [""]
}

## RESTRIÇÕES
- NUNCA usar adicional de 50% (CLT). Sempre usar 60%/80%/100% (CCT).
- NUNCA calcular vencimento a partir da data da HE. Sempre usar a quinzena (Cl. 41.2).
- NUNCA ignorar encargos patronais (INSS + FGTS).
- NUNCA recomendar descumprir a lei.
- PJ e estagiários: banco de horas NÃO se aplica.
- Salário base padrão: R$ 2.500,00 | Carga mensal padrão: 220h`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { colaboradores, competencia, provider: reqProvider } = await req.json();

    const provider = reqProvider || "gemini";
    const providerCfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.gemini;
    const apiKey = Deno.env.get(providerCfg.envKey);
    if (!apiKey) throw new Error(`${providerCfg.envKey} não configurada`);

    const userMessage = `Analise o banco de horas da competência ${competencia} para os colaboradores da Indústria Visual.

Para cada colaborador:
1. Classifique o tipo de HE (Normal vs Dom/Feriado) consultando o calendário de feriados SP
2. Calcule vencimento pela regra de quinzena da CCT (Cl. 41.2)
3. Aplique adicionais da CCT: 60% (até 2h), 80% (>2h), 100% (dom/fer) — Cl. 10
4. Calcule passivo incluindo INSS patronal + FGTS
5. Defina status (no_prazo / urgente / vencido / compensado)
6. Verifique checklist de conformidade

A data de hoje é ${new Date().toISOString().split("T")[0]}.

Dados dos colaboradores (Secullum Ponto Web):

${JSON.stringify(colaboradores, null, 2)}

Retorne APENAS o JSON estruturado conforme especificado, sem texto adicional.`;

    let content = "";
    if (provider === "claude") {
      const res = await fetch(providerCfg.url, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: providerCfg.model, max_tokens: 8192, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userMessage }] }),
      });
      if (!res.ok) {
        if (res.status === 429) throw { status: 429, message: "Limite de requisições excedido." };
        throw new Error(`Erro na API Claude: ${res.status}`);
      }
      const data = await res.json();
      content = data.content?.[0]?.text || "";
    } else {
      const res = await fetch(providerCfg.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: providerCfg.model, max_tokens: 8192, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMessage }] }),
      });
      if (!res.ok) {
        if (res.status === 429) throw { status: 429, message: "Limite de requisições excedido." };
        throw new Error(`Erro na API ${provider}: ${res.status}`);
      }
      const result = await res.json();
      content = result.choices?.[0]?.message?.content || "";
    }

    const parsed = extractJSON(content);
    return jsonResponse(parsed);
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return jsonResponse({ error: err.message || "Erro desconhecido" }, err.status || 500);
  }
});
