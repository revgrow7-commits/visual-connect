const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-2.5-flash";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1].trim());
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) return JSON.parse(text.substring(start, end + 1));
    throw new Error("Resposta da IA não contém JSON válido");
  }
}

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
- 0-20h: ✅ Normal | 21-40h: ⚠️ Atenção | >40h: 🔴 Crítico
- Vencimento <30 dias: 🔴 Crítico
- Extras habituais 3+ meses: 🔴 Crítico (reflexos em 13º, férias, FGTS)

## CÁLCULOS
- valor_hora = salario_base / carga_mensal_horas (padrão 220h)
- hora_extra_50% = valor_hora × 1.50 | hora_extra_100% = valor_hora × 2.00
- Encargos: INSS empregador ~28%, FGTS 8%
- custo_total_empresa = custo_bruto × 1.36

## SAÍDA ESTRUTURADA
Retorne SEMPRE um JSON válido com a estrutura abaixo. NÃO inclua texto antes ou depois do JSON.
{
  "resumo_executivo": { "total_colaboradores": 0, "normais": 0, "atencao": 0, "criticos": 0, "saldo_total_horas": "HH:MM", "custo_total_projetado": 0.00, "custo_extras_50": 0.00, "custo_extras_100": 0.00, "custo_inss": 0.00, "custo_fgts": 0.00 },
  "colaboradores": [{ "nome": "", "cargo": "", "departamento": "", "nivel_alerta": "normal|atencao|critico", "emoji": "✅|⚠️|🔴", "saldo": "HH:MM", "saldo_decimal": 0.0, "horas_extras_50": "HH:MM", "horas_extras_100": "HH:MM", "custo_projetado": 0.00, "dias_para_vencer": 0, "data_vencimento": "YYYY-MM-DD", "acoes_recomendadas": [""] }],
  "alertas_criticos": [{ "colaborador": "", "motivo": "", "acao_imediata": "", "base_legal": "" }],
  "base_legal_aplicada": [""],
  "recomendacoes_gerais": [""]
}

## RESTRIÇÕES
- Nunca recomendar descumprir a lei
- Nunca calcular extras sem tipo correto (50% ou 100%)
- Nunca ignorar encargos patronais
- PJ e estagiários: banco de horas não se aplica
- Salário base padrão: R$ 2.500,00 | Carga mensal padrão: 220h`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

    const { colaboradores, competencia } = await req.json();

    const userMessage = `Analise o banco de horas da competência ${competencia} para os seguintes colaboradores da Indústria Visual.

Para cada colaborador, calcule o nível de alerta, custo projetado e ações recomendadas.
Considere acordo individual (prazo 6 meses) como padrão.
A data de hoje é ${new Date().toISOString().split("T")[0]}.

Dados dos colaboradores (vindos do Secullum Ponto Web):

${JSON.stringify(colaboradores, null, 2)}

Retorne APENAS o JSON estruturado conforme especificado, sem texto adicional.`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8192, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMessage }] }),
    });

    if (!res.ok) {
      if (res.status === 429) throw { status: 429, message: "Limite de requisições excedido. Tente novamente em alguns minutos." };
      const t = await res.text();
      console.error("[banco-horas-agent] Gemini error:", res.status, t);
      throw new Error(`Erro na API Gemini: ${res.status}`);
    }

    const result = await res.json();
    const content = result.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(content);

    return jsonResponse(parsed);
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return jsonResponse({ error: err.message || "Erro desconhecido" }, err.status || 500);
  }
});
