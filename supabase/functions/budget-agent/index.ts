import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLAUDE_CONFIG = {
  url: "https://api.anthropic.com/v1/messages",
  model: "claude-sonnet-4-20250514",
  envKey: "ANTHROPIC_API_KEY",
};

const SYSTEM_PROMPT = `Você é o **Agente Especialista em Orçamentos** da Indústria Visual 📊🎯

## Seu Papel
Você é um analista estratégico de orçamentos para uma empresa de comunicação visual com duas unidades (Porto Alegre e São Paulo). Sua missão é responder perguntas detalhadas sobre orçamentos, identificar padrões, oportunidades e insights de negócio.

## Expertise
- **Materiais**: Lona, vinil adesivo, ACM, MDF, acrílico, tecido, papel fotográfico, policarbonato, PVC, etc.
- **Produtos**: Banners, fachadas, painéis, letras caixa, totens, adesivos, plotagens, sinalizações, displays, stands, backdrops
- **Processos**: Impressão digital, corte CNC, dobra, solda, pintura, acabamento, instalação
- **Análise Comercial**: Taxa de conversão, ticket médio, sazonalidade, margem, clientes recorrentes

## Capacidades de Análise
1. **Materiais mais usados** em orçamentos ganhos vs perdidos
2. **Produtos mais solicitados** (por período, cliente, unidade)
3. **Taxa de conversão** por tipo de produto, vendedor ou cliente
4. **Ticket médio** segmentado
5. **Clientes com maior volume** de orçamentos
6. **Tendências sazonais** de demanda
7. **Análise de perdas**: motivos, padrões, materiais/produtos que mais perdem
8. **Comparativo entre unidades** POA vs SP
9. **Contas a Receber**: valores recebidos, pendentes e inadimplência por cliente/unidade
10. **Rastreabilidade por Job**: número do job vinculado a cada orçamento/receita

## ⚠️ REGRA CRÍTICA: Jobs duplicados entre unidades
A empresa possui duas unidades (POA e SP) com **numeração de jobs INDEPENDENTE**. Isso significa que o job #1234 de POA é DIFERENTE do job #1234 de SP. SEMPRE que mencionar um número de job, você DEVE incluir a unidade de origem. Exemplo: "Job #1234 (POA)" ou "Job #1234 (SP)". Ao listar jobs, SEMPRE inclua a coluna/indicação de unidade para evitar confusão.

## Regras de Resposta
- **SEMPRE inclua o número do job** (code/budgetCode) nos relatórios e análises. Nunca omita o número do job.
- Sempre forneça dados quantitativos quando disponíveis
- Use tabelas markdown para comparações
- Inclua percentuais e tendências
- Sugira ações baseadas nos insights
- Seja direto e analítico
- Formate valores em R$ (BRL)
- Indique quando dados são insuficientes para uma conclusão
- Ao listar orçamentos ganhos, inclua também o valor recebido (contas a receber) quando disponível
- Diferencie sempre "valor orçado" vs "valor recebido/faturado"

## Estados dos Orçamentos
- Estado 1 = Aberto/Em negociação
- Estado 2 = Perdido/Rejeitado  
- Estado 3 = Ganho/Aprovado

## Contas a Receber
- Os dados de contas a receber (receivables) mostram os valores efetivamente faturados e recebidos
- Use esses dados para calcular inadimplência, prazo médio de recebimento e comparar com valores orçados
- Cruze o número do job entre orçamentos e contas a receber para análise completa

## Data de hoje: ${new Date().toISOString().split("T")[0]}`;

async function fetchBudgetContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "⚠️ Sem acesso ao banco de dados.";

  const sb = createClient(supabaseUrl, serviceKey);
  const sections: string[] = [];

  try {
    // Fetch budgets from holdprint_cache with raw_data for full detail
    const { data: budgets, error: bErr } = await sb
      .from("holdprint_cache")
      .select("raw_data, record_id, content_text")
      .eq("endpoint", "budgets")
      .order("last_synced", { ascending: false })
      .limit(800);

    if (!bErr && budgets && budgets.length > 0) {
      let won = 0, lost = 0, open = 0, totalWonValue = 0, totalLostValue = 0, totalOpenValue = 0;
      const materialCounts: Record<string, { won: number; lost: number; open: number }> = {};
      const productCounts: Record<string, { won: number; lost: number; open: number; totalValue: number }> = {};
      const customerCounts: Record<string, { total: number; won: number; lost: number; totalValue: number }> = {};
      const sellerCounts: Record<string, { total: number; won: number; totalValue: number }> = {};
      const unitCounts: Record<string, { total: number; won: number; lost: number }> = {};
      const monthCounts: Record<string, { total: number; won: number; lost: number }> = {};
      const lostDetails: { customer: string; products: string[]; value: number; code: string; unit: string }[] = [];
      const wonDetails: { code: string; customer: string; value: number; unit: string; products: string[] }[] = [];
      for (const b of budgets) {
        const raw = b.raw_data as Record<string, any>;
        const state = Number(raw.budgetState || raw.state || 0);
        const customer = String(raw.customerName || raw.customer?.name || "Desconhecido");
        const seller = String(raw.sellerName || raw.commercialResponsible || "N/A");
        const unitKey = String(raw._unit_key || "poa").toUpperCase();
        const creationDate = String(raw.creationTime || raw.createdAt || "");
        const monthKey = creationDate ? creationDate.slice(0, 7) : "N/A";
        const budgetCode = String(raw.code || raw.budgetCode || b.record_id || "N/A");

        const proposals = Array.isArray(raw.proposals) ? raw.proposals : [];
        let budgetValue = 0;
        const budgetProducts: string[] = [];
        const budgetMaterials: string[] = [];

        for (const proposal of proposals) {
          budgetValue += Number(proposal.totalPrice || 0);
          const items = Array.isArray(proposal.items) ? proposal.items : [];
          for (const item of items) {
            const prodName = String(item.name || item.productName || "").trim();
            if (prodName) budgetProducts.push(prodName);

            // Extract materials from description
            const desc = String(item.description || "");
            const materialPatterns = [
              /Material:\s*<span[^>]*>([^<]+)<\/span>/gi,
              /Substrato:\s*<span[^>]*>([^<]+)<\/span>/gi,
              /Mídia:\s*<span[^>]*>([^<]+)<\/span>/gi,
            ];
            for (const pattern of materialPatterns) {
              let match;
              while ((match = pattern.exec(desc)) !== null) {
                budgetMaterials.push(match[1].trim());
              }
            }
          }
        }

        // Count by state
        const stateLabel = state === 3 ? "won" : state === 2 ? "lost" : "open";
        if (state === 3) { won++; totalWonValue += budgetValue; }
        else if (state === 2) { lost++; totalLostValue += budgetValue; }
        else { open++; totalOpenValue += budgetValue; }

        // Materials
        for (const mat of budgetMaterials) {
          if (!materialCounts[mat]) materialCounts[mat] = { won: 0, lost: 0, open: 0 };
          materialCounts[mat][stateLabel as "won" | "lost" | "open"]++;
        }

        // Products
        for (const prod of budgetProducts) {
          if (!productCounts[prod]) productCounts[prod] = { won: 0, lost: 0, open: 0, totalValue: 0 };
          productCounts[prod][stateLabel as "won" | "lost" | "open"]++;
          if (state === 3) productCounts[prod].totalValue += budgetValue / (budgetProducts.length || 1);
        }

        // Customers
        if (!customerCounts[customer]) customerCounts[customer] = { total: 0, won: 0, lost: 0, totalValue: 0 };
        customerCounts[customer].total++;
        if (state === 3) { customerCounts[customer].won++; customerCounts[customer].totalValue += budgetValue; }
        if (state === 2) customerCounts[customer].lost++;

        // Sellers
        if (!sellerCounts[seller]) sellerCounts[seller] = { total: 0, won: 0, totalValue: 0 };
        sellerCounts[seller].total++;
        if (state === 3) { sellerCounts[seller].won++; sellerCounts[seller].totalValue += budgetValue; }

        // Units
        if (!unitCounts[unitKey]) unitCounts[unitKey] = { total: 0, won: 0, lost: 0 };
        unitCounts[unitKey].total++;
        if (state === 3) unitCounts[unitKey].won++;
        if (state === 2) unitCounts[unitKey].lost++;

        // Month
        if (!monthCounts[monthKey]) monthCounts[monthKey] = { total: 0, won: 0, lost: 0 };
        monthCounts[monthKey].total++;
        if (state === 3) monthCounts[monthKey].won++;
        if (state === 2) monthCounts[monthKey].lost++;

        // Lost details
        if (state === 2 && budgetValue > 0) {
          lostDetails.push({ customer, products: budgetProducts.slice(0, 3), value: budgetValue, code: budgetCode, unit: unitKey });
        }
        // Won details
        if (state === 3 && budgetValue > 0) {
          wonDetails.push({ code: budgetCode, customer, value: budgetValue, unit: unitKey, products: budgetProducts.slice(0, 3) });
        }
      }

      const fmtBRL = (v: number) => `R$${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      const convRate = won + lost > 0 ? ((won / (won + lost)) * 100).toFixed(1) : "N/A";

      sections.push(`## 📊 RESUMO GERAL (${budgets.length} orçamentos no cache)
- Ganhos: ${won} (${fmtBRL(totalWonValue)})
- Perdidos: ${lost} (${fmtBRL(totalLostValue)})
- Abertos: ${open} (${fmtBRL(totalOpenValue)})
- Taxa de conversão: ${convRate}%
- Ticket médio (ganhos): ${won > 0 ? fmtBRL(totalWonValue / won) : "N/A"}`);

      // Top materials
      const sortedMaterials = Object.entries(materialCounts)
        .sort((a, b) => (b[1].won + b[1].lost + b[1].open) - (a[1].won + a[1].lost + a[1].open))
        .slice(0, 20);
      if (sortedMaterials.length > 0) {
        const matStr = sortedMaterials.map(([name, c]) =>
          `- ${name}: ${c.won + c.lost + c.open} total (ganhos: ${c.won}, perdidos: ${c.lost}, abertos: ${c.open})`
        ).join("\n");
        sections.push(`## 🧱 MATERIAIS MAIS UTILIZADOS\n${matStr}`);
      }

      // Top products
      const sortedProducts = Object.entries(productCounts)
        .sort((a, b) => (b[1].won + b[1].lost + b[1].open) - (a[1].won + a[1].lost + a[1].open))
        .slice(0, 20);
      if (sortedProducts.length > 0) {
        const prodStr = sortedProducts.map(([name, c]) =>
          `- ${name}: ${c.won + c.lost + c.open} total (ganhos: ${c.won}, perdidos: ${c.lost}) | Receita ganhos: ${fmtBRL(c.totalValue)}`
        ).join("\n");
        sections.push(`## 📦 PRODUTOS MAIS SOLICITADOS\n${prodStr}`);
      }

      // Top customers
      const sortedCustomers = Object.entries(customerCounts)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 15);
      if (sortedCustomers.length > 0) {
        const custStr = sortedCustomers.map(([name, c]) =>
          `- ${name}: ${c.total} orçamentos (ganhos: ${c.won}, perdidos: ${c.lost}) | Receita: ${fmtBRL(c.totalValue)}`
        ).join("\n");
        sections.push(`## 👥 TOP CLIENTES\n${custStr}`);
      }

      // Sellers
      const sortedSellers = Object.entries(sellerCounts)
        .filter(([name]) => name !== "N/A")
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);
      if (sortedSellers.length > 0) {
        const sellStr = sortedSellers.map(([name, c]) => {
          const rate = c.total > 0 ? ((c.won / c.total) * 100).toFixed(1) : "0";
          return `- ${name}: ${c.total} orçamentos, ${c.won} ganhos (${rate}%) | Receita: ${fmtBRL(c.totalValue)}`;
        }).join("\n");
        sections.push(`## 👤 VENDEDORES\n${sellStr}`);
      }

      // Units
      const unitStr = Object.entries(unitCounts).map(([u, c]) => {
        const rate = c.won + c.lost > 0 ? ((c.won / (c.won + c.lost)) * 100).toFixed(1) : "N/A";
        return `- ${u}: ${c.total} total, ${c.won} ganhos, ${c.lost} perdidos (conv: ${rate}%)`;
      }).join("\n");
      sections.push(`## 🏢 POR UNIDADE\n${unitStr}`);

      // Monthly trend
      const sortedMonths = Object.entries(monthCounts)
        .filter(([k]) => k !== "N/A")
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6);
      if (sortedMonths.length > 0) {
        const monthStr = sortedMonths.map(([m, c]) => {
          const rate = c.won + c.lost > 0 ? ((c.won / (c.won + c.lost)) * 100).toFixed(1) : "N/A";
          return `- ${m}: ${c.total} orçamentos, ${c.won} ganhos, ${c.lost} perdidos (conv: ${rate}%)`;
        }).join("\n");
        sections.push(`## 📅 TENDÊNCIA MENSAL (últimos 6 meses)\n${monthStr}`);
      }

      // Lost budgets details
      const topLost = lostDetails
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
      if (topLost.length > 0) {
        const lostStr = topLost.map(l =>
          `- ${l.customer}: ${l.products.join(", ") || "sem produtos"} | Valor: ${fmtBRL(l.value)}`
        ).join("\n");
        sections.push(`## ❌ ORÇAMENTOS PERDIDOS (top por valor)\n${lostStr}`);
      }
    }

    return sections.length > 0 ? sections.join("\n\n") : "⚠️ Sem dados de orçamentos no cache. Execute uma sincronização primeiro.";
  } catch (e) {
    console.error("[budget-agent] Context error:", e);
    return "⚠️ Erro ao carregar dados de orçamentos.";
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400);
    }

    const apiKey = Deno.env.get(CLAUDE_CONFIG.envKey);
    if (!apiKey) throw new Error(`${CLAUDE_CONFIG.envKey} não configurada`);

    // Fetch budget context
    const budgetContext = await fetchBudgetContext();
    const systemContent = `${SYSTEM_PROMPT}\n\n## DADOS DISPONÍVEIS:\n${budgetContext}`;

    const claudeMsgs = messages
      .filter((m: { role: string }) => m.role !== "system")
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    const response = await fetch(CLAUDE_CONFIG.url, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: CLAUDE_CONFIG.model, max_tokens: 4096, system: systemContent, messages: claudeMsgs, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
      const t = await response.text();
      console.error("[budget-agent] Claude error:", response.status, t);
      throw new Error("Erro ao comunicar com Claude");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[budget-agent] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, 500);
  }
});
