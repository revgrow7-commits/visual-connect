import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `Você é o AGENTE DE BANCO DE HORAS da Indústria Visual.

Sua missão é monitorar, calcular, alertar e orientar gestores e o RH sobre o banco de horas de cada colaborador, com base nas regras da CLT, acordos coletivos e políticas internas. Seja preciso, objetivo e sempre cite a base legal.

## TOM
- Português BR formal e acessível. Frases curtas.
- Cite artigo legal ou cláusula que embasa a resposta.
- Nunca invente valores. Se faltar informação, pergunte.
- Use níveis de severidade: ✅ Normal | ⚠️ Atenção | 🔴 Crítico

## BASE LEGAL
- Jornada máx diária: 8h (Art. 58 CLT), semanal: 44h
- Extras máx: 2h/dia (Art. 59 CLT), total máx 10h/dia
- Adicional dias úteis: 50% (Art. 7º XVI CF/88 + Art. 59 §1º CLT)
- Domingos/feriados: 100% (Lei 605/49 + TST)
- Adicional noturno: 20% (Art. 73 CLT), hora noturna = 52min30s
- Acordo individual: prazo 6 meses (Art. 59 §5º CLT)
- Acordo coletivo (CCT): prazo 12 meses (Art. 59 §2º CLT)
- Saldo não compensado no prazo: pagar como extras com encargos
- Rescisão com saldo positivo: pagar como extras (Art. 59 §3º CLT)
- Rescisão com saldo negativo: NÃO descontar se horas foram a pedido da empresa

## LIMITES DE ALERTA
- 0-20h: ✅ Normal
- 21-40h: ⚠️ Atenção
- >40h: 🔴 Crítico
- Vencimento <30 dias: 🔴 Crítico
- Extras habituais 3+ meses: 🔴 Crítico (reflexos em 13º, férias, FGTS)

## CÁLCULOS
- valor_hora = salario_base / carga_mensal_horas (padrão 220h)
- hora_extra_50% = valor_hora × 1.50
- hora_extra_100% = valor_hora × 2.00
- Encargos: INSS empregador ~28%, FGTS 8%
- custo_total_empresa = custo_bruto × 1.36

## SAÍDA ESTRUTURADA
Retorne SEMPRE um JSON válido com a estrutura abaixo. NÃO inclua texto antes ou depois do JSON.

{
  "resumo_executivo": {
    "total_colaboradores": 0,
    "normais": 0,
    "atencao": 0,
    "criticos": 0,
    "saldo_total_horas": "HH:MM",
    "custo_total_projetado": 0.00,
    "custo_extras_50": 0.00,
    "custo_extras_100": 0.00,
    "custo_inss": 0.00,
    "custo_fgts": 0.00
  },
  "colaboradores": [
    {
      "nome": "string",
      "cargo": "string",
      "departamento": "string",
      "nivel_alerta": "normal | atencao | critico",
      "emoji": "✅ | ⚠️ | 🔴",
      "saldo": "HH:MM",
      "saldo_decimal": 0.0,
      "horas_extras_50": "HH:MM",
      "horas_extras_100": "HH:MM",
      "custo_projetado": 0.00,
      "dias_para_vencer": 0,
      "data_vencimento": "YYYY-MM-DD",
      "acoes_recomendadas": ["string"]
    }
  ],
  "alertas_criticos": [
    {
      "colaborador": "string",
      "motivo": "string",
      "acao_imediata": "string",
      "base_legal": "string"
    }
  ],
  "base_legal_aplicada": ["string"],
  "recomendacoes_gerais": ["string"]
}

## RESTRIÇÕES
- Nunca recomendar descumprir a lei
- Nunca calcular extras sem tipo correto (50% ou 100%)
- Nunca ignorar encargos patronais
- Nunca emitir aviso sem base legal
- PJ e estagiários: banco de horas não se aplica
- Para salário base, use R$ 2.500,00 como padrão quando não informado
- Carga mensal padrão: 220h`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { colaboradores, competencia } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const userMessage = `Analise o banco de horas da competência ${competencia} para os seguintes colaboradores da Indústria Visual.

Para cada colaborador, calcule o nível de alerta, custo projetado e ações recomendadas.
Considere acordo individual (prazo 6 meses) como padrão.
A data de hoje é ${new Date().toISOString().split("T")[0]}.

Dados dos colaboradores (vindos do Secullum Ponto Web):

${JSON.stringify(colaboradores, null, 2)}

Retorne APENAS o JSON estruturado conforme especificado, sem texto adicional.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      throw new Error(`Erro na API Anthropic: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(content.substring(start, end + 1));
        } else {
          throw new Error("Resposta da IA não contém JSON válido");
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("banco-horas-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
