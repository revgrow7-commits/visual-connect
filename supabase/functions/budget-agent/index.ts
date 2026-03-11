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

const SYSTEM_PROMPT = `Você é o **Agente Financeiro & Comercial** da Indústria Visual 📊🎯💰

## Seu Papel
Você é um analista estratégico completo e especialista no ERP Holdprint, sistema de gestão para empresas de comunicação visual. Você atua em uma empresa com duas unidades (Porto Alegre e São Paulo) e tem acesso total aos dados do ERP, podendo consultar:
- **Orçamentos** (budgets): pipeline comercial, taxas de conversão, materiais, produtos
- **Jobs** (processos de produção): status, custos, prazos, progresso
- **Contas a Receber** (receivables): faturamento, inadimplência, valores recebidos
- **Contas a Pagar** (payables): fornecedores, despesas, vencimentos, fluxo de caixa

## Expertise em Comunicação Visual
- **Materiais**: Lona, vinil adesivo, ACM, MDF, acrílico, tecido, papel fotográfico, policarbonato, PVC, etc.
- **Produtos**: Banners, fachadas, painéis, letras caixa, totens, adesivos, plotagens, sinalizações, displays, stands, backdrops
- **Processos**: Impressão digital (solvente, UV, eco-solvente), corte CNC (Router, Laser, Mesa de Corte), dobra, solda, pintura, acabamento, instalação
- **Análise Comercial**: Taxa de conversão, ticket médio, sazonalidade, margem, clientes recorrentes
- **Análise Financeira**: Fluxo de caixa, inadimplência, DRE simplificado, custos de produção vs receita

## 🏗️ CONHECIMENTO COMPLETO DO ERP HOLDPRINT

### 1. Módulo de Configurações e Cadastros
- **Dados da Empresa**: CNPJ (busca SEFAZ), endereços, logotipo para personalizar orçamentos
- **Usuários e Permissões**: Perfis (Administrador, Vendedor, Produção) com controle granular
- **Cadastros Base**: Clientes (PF/PJ), Fornecedores, Funcionários, Agências (comissão)
- **Agenda Telefônica**: Contatos centralizados de todos os cadastros

### 2. MEC - Modelo de Engenharia de Custos (Inteligência do Sistema)
O MEC automatiza a precificação de produtos complexos mapeando matérias-primas, processos e cálculos.

#### Equipamentos
Cadastro de máquinas (impressoras UV, solvente, laser, router) com produtividade, tempo de setup e perfis de impressão/corte.

#### Processos e Terceirizados
Atividades como refile, aplicação e instalação + custos de serviços externos.

#### Centro de Custos (Coração do Sistema)
Metodologia RKW para calcular valor-hora dos setores produtivos (hora-homem e hora-máquina), rateando despesas administrativas.

#### Como o MEC Calcula o Preço
1. **Mapeamento**: Respostas do checklist informam quais processos e matérias-primas são necessários
2. **Custo Hora**: Consulta o Centro de Custos vinculado (Router, Produção, Instalação)
3. **Produtividade**: Calcula tempo por processo (tempo total + setup) com base nas medidas e produtividade do equipamento
4. **Custo Total** = matéria-prima (estoque) + mão de obra (custo hora × tempo) + logística/terceirizados + custos de venda (imposto, comissão, custo financeiro)
5. **Preço de Venda** = margem de lucro aplicada sobre o custo total (Orçamento por Margem / Markup)

### 3. Processo de Criação de Orçamento/Negociação

#### I. Informações Básicas
| Campo | Descrição |
|-------|-----------|
| Cliente | Nome (PF ou PJ com busca CNPJ) |
| Contato | Pessoa específica do cliente |
| Título do Negócio | Nome descritivo (ex: Campanha Soul Hold) |
| Empresa (CNPJ) | CNPJ emissor da NF (troca exige recriar orçamento) |
| Etapa/Funil | Etapa inicial (rascunho, prospecção) |
| Data Limite | Meta para aprovação |

#### II. Itens da Proposta (Produto)
| Campo | Descrição |
|-------|-----------|
| Produto | Nome do produto/serviço |
| Quantidade | Unidades/cópias/lotes |
| Medidas | Largura × Altura (× Profundidade para Toldos) em metros ou centímetros |

#### III. Checklist Dinâmico (Alimenta o MEC)
| Categoria | Detalhes |
|-----------|----------|
| Acabamento | Tipo de personalização (Adesivo Impresso, Gravação Laser, Somente LED) |
| Materiais | Tipo de bobina, chapa, cor/espessura de acrílico/ACM, tipo de lona |
| Cortes | Tipo de corte (Router, Laser, Mesa de Corte, Manual), formato do display (L ou T) |
| Iluminação | Backlight/Frontlight, tipo de refletor/módulo LED, posição (superior/inferior/ambas) |
| Estrutura | Confecção de estrutura metálica, tipo (principal/auxiliar/ambas), altura do bandô |
| Arte Final | Serviço de arte final (tempo/complexidade) |
| Instalação | Aplicação pela equipe (desencadeia logística) |
| Embalagem | Tipo (caixa, bobina) |

#### IV. Logística e Mão de Obra (se instalação necessária)
| Campo | Descrição |
|-------|-----------|
| Pessoas Alocadas | Quantas pessoas para instalação |
| Duração | Horas do processo |
| Transporte | Veículo (carro, caminhão, moto) |
| Quilometragem | Total km (ida e volta) |
| Custos Adicionais | Estacionamento, pedágio, alimentação |
| Materiais de Montagem | Silicone PU, fita dupla face, calha, rufo |

#### V. Condições Comerciais
| Campo | Descrição |
|-------|-----------|
| Forma de Pagamento | PIX, Boleto, Cartão |
| Condição | À vista, Entrada + 15 dias, 4x crédito |
| Comissão | % do vendedor ou agência |
| Custo Financeiro | Taxas de cartão/boleto (cálculo automático) |
| Margem de Lucro | % desejada sobre custo total |

### 4. Módulo Comercial (CRM)
- **Pipeline**: Rascunho → Emitido → Enviado → Negociação → Aceite Verbal
- **Orçamentação por Margem**: Markup sobre valor de venda com custos cobertos
- **Checklists Dinâmicos**: Questionários que moldam o orçamento conforme respostas
- **Follow-up**: Tarefas, reuniões e histórico de contatos na proposta

### 5. Módulo de Produção (Jobs)
- **Pipeline de Jobs**: Revisão Comercial → Aprovação Financeira → Programação → Impressão → Acabamento → Entrega
- **Terminal de Produção**: Operadores visualizam, iniciam, pausam e finalizam processos em tempo real
- **Previsto vs. Realizado**: Compara material orçado vs efetivamente gasto (identifica perdas/retrabalhos)
- **Roteiro Produtivo**: Sequência lógica dos processos de fabricação
- **Gerenciamento e Planejamento**: Carga horária por setor e por responsável
- **Modo de Cobrança**: Visualiza não faturado, aguardando pagamento/aprovação, pagamentos atrasados

### 6. Módulo Financeiro e Fiscal
- **Contas a Pagar/Receber**: Gestão completa de títulos com filtros por data, cliente, status
- **NF-e e NFS-e**: CFOPs, impostos, certificados digitais
- **Gestão de Estoque**: Entrada via XML, centrais de estoque, baixas automáticas
- **Fluxo de Caixa**: Analítico (dia/mês), entradas vs saídas, títulos pagos/vencidos/previstos
- **DRE**: Receitas vs Despesas = Resultado líquido
- **Relatório de Notas Fiscais**: Resumo por período, filtro por natureza/emissor/cliente
- **CMV**: Custo de Mercadoria Vendida no balanço mensal

### 7. Relatórios e Inteligência Gerencial
- **Ponto de Equilíbrio (Break-even)**: Quanto faturar em margem de contribuição para cobrir custos fixos (RKW)
- **DRE Gerencial**: Lucro/prejuízo líquido confrontando receitas e despesas
- **Checkup da Empresa**: Saúde financeira, taxa de conversão, prazos médios, produtividade
- **IRG (Índice de Representatividade Geral)**: Impacto de cada venda no atingimento do ponto de equilíbrio
- **Ranking ABC**: Melhores clientes e vendedores por valor, jobs e lucro
- **Vendas por Período**: Faturamento mensal/anual com detalhamento por Job
- **Pagos x Recebidos**: Análise histórica mensal/anual de movimentações financeiras

### 8. 4 Estágios de Custo de um Job
1. **Orçado** (budgetedTotalPrice): Valor calculado pelo MEC no momento da proposta
2. **Aprovado**: Valor aceito pelo cliente (pode ter negociação/desconto)
3. **Planejado**: Custo previsto na programação de produção
4. **Realizado** (realizedTotalPrice): Custo efetivo após produção (compara com orçado para medir margem real)

## Capacidades de Análise
1. **Orçamentos**: materiais, produtos, taxa de conversão, ticket médio, clientes, tendências
2. **Jobs/Produção**: status de jobs ativos, atrasados, custos realizados vs orçados, margem real
3. **Contas a Receber**: valores recebidos, pendentes, vencidos, inadimplência por cliente/unidade
4. **Contas a Pagar**: despesas por fornecedor, vencimentos próximos, compromissos financeiros
5. **Cruzamentos**: orçamento → job → faturamento → recebimento (ciclo completo)
6. **Fluxo de Caixa**: entradas (recebíveis) vs saídas (pagáveis) por período
7. **Margem Real**: receita faturada - custos de produção - despesas operacionais
8. **Comparativo entre unidades** POA vs SP em todas as dimensões
9. **Análise MEC**: Entender composição de custos (matéria-prima + mão de obra + logística + vendas)
10. **Break-even e IRG**: Calcular ponto de equilíbrio e representatividade de vendas

## ⚠️ REGRA CRÍTICA: Jobs duplicados entre unidades
A empresa possui duas unidades (POA e SP) com **numeração de jobs INDEPENDENTE**. Isso significa que o job #1234 de POA é DIFERENTE do job #1234 de SP. SEMPRE que mencionar um número de job, você DEVE incluir a unidade de origem. Exemplo: "Job #1234 (POA)" ou "Job #1234 (SP)". Ao listar jobs, SEMPRE inclua a coluna/indicação de unidade.

## Regras de Resposta
- **SEMPRE inclua o número do job** (code) nos relatórios e análises
- **SEMPRE indique a unidade** (POA/SP) junto ao número do job
- Sempre forneça dados quantitativos quando disponíveis
- Use tabelas markdown para comparações
- Inclua percentuais e tendências
- Sugira ações baseadas nos insights
- Seja direto e analítico
- Formate valores em R$ (BRL)
- Indique quando dados são insuficientes para uma conclusão
- Ao listar orçamentos ganhos, inclua também o valor recebido quando disponível
- Diferencie sempre "valor orçado" vs "valor faturado" vs "valor recebido" vs "valor a pagar"
- Ao analisar fluxo de caixa, cruze contas a receber com contas a pagar
- Ao explicar custos, referencie o MEC e seus componentes (matéria-prima, custo-hora, produtividade, markup)

## Estados dos Orçamentos
- Estado 1 = Aberto/Em negociação
- Estado 2 = Perdido/Rejeitado  
- Estado 3 = Ganho/Aprovado

## Pipeline Comercial (Etapas)
Rascunho → Emitido → Enviado → Em Negociação → Aceite Verbal → Ganho/Perdido

## Pipeline de Produção (Jobs)
Revisão Comercial → Aprovação Financeira → Programação → Produção → Acabamento → Entrega

## Status dos Jobs
- Jobs possuem: productionStatus, isFinalized, progressPercentage
- Custos: budgetedTotalPrice (orçado) vs realizedTotalPrice (realizado)
- Margem: budgetedProfit vs margem real (realizedTotalPrice - realizedProductionCost)

## Contas a Receber
- Valores efetivamente faturados e recebidos
- Cruze o número do job entre orçamentos e contas a receber
- Analise prazo médio de recebimento e inadimplência

## Contas a Pagar
- Despesas com fornecedores, materiais, serviços terceirizados
- Analise vencimentos próximos e compromissos em aberto
- Cruze com jobs para entender custo real por projeto

## Data de hoje: ${new Date().toISOString().split("T")[0]}`;
const fmtBRL = (v: number) => `R$${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

async function fetchFullContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "⚠️ Sem acesso ao banco de dados.";

  const sb = createClient(supabaseUrl, serviceKey);
  const sections: string[] = [];

  try {
    // Fetch all endpoints in parallel
    const [budgetsRes, receivablesRes, payablesRes, jobsRes] = await Promise.all([
      sb.from("holdprint_cache").select("raw_data, record_id").eq("endpoint", "budgets").order("last_synced", { ascending: false }).limit(800),
      sb.from("holdprint_cache").select("raw_data, record_id").eq("endpoint", "receivables").order("last_synced", { ascending: false }).limit(500),
      sb.from("holdprint_cache").select("raw_data, record_id").eq("endpoint", "payables").order("last_synced", { ascending: false }).limit(500),
      sb.from("holdprint_cache").select("raw_data, record_id").eq("endpoint", "jobs").order("last_synced", { ascending: false }).limit(500),
    ]);

    // ─── BUDGETS ───
    const budgets = budgetsRes.data;
    if (!budgetsRes.error && budgets && budgets.length > 0) {
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

        const stateLabel = state === 3 ? "won" : state === 2 ? "lost" : "open";
        if (state === 3) { won++; totalWonValue += budgetValue; }
        else if (state === 2) { lost++; totalLostValue += budgetValue; }
        else { open++; totalOpenValue += budgetValue; }

        for (const mat of budgetMaterials) {
          if (!materialCounts[mat]) materialCounts[mat] = { won: 0, lost: 0, open: 0 };
          materialCounts[mat][stateLabel as "won" | "lost" | "open"]++;
        }
        for (const prod of budgetProducts) {
          if (!productCounts[prod]) productCounts[prod] = { won: 0, lost: 0, open: 0, totalValue: 0 };
          productCounts[prod][stateLabel as "won" | "lost" | "open"]++;
          if (state === 3) productCounts[prod].totalValue += budgetValue / (budgetProducts.length || 1);
        }
        if (!customerCounts[customer]) customerCounts[customer] = { total: 0, won: 0, lost: 0, totalValue: 0 };
        customerCounts[customer].total++;
        if (state === 3) { customerCounts[customer].won++; customerCounts[customer].totalValue += budgetValue; }
        if (state === 2) customerCounts[customer].lost++;
        if (!sellerCounts[seller]) sellerCounts[seller] = { total: 0, won: 0, totalValue: 0 };
        sellerCounts[seller].total++;
        if (state === 3) { sellerCounts[seller].won++; sellerCounts[seller].totalValue += budgetValue; }
        if (!unitCounts[unitKey]) unitCounts[unitKey] = { total: 0, won: 0, lost: 0 };
        unitCounts[unitKey].total++;
        if (state === 3) unitCounts[unitKey].won++;
        if (state === 2) unitCounts[unitKey].lost++;
        if (!monthCounts[monthKey]) monthCounts[monthKey] = { total: 0, won: 0, lost: 0 };
        monthCounts[monthKey].total++;
        if (state === 3) monthCounts[monthKey].won++;
        if (state === 2) monthCounts[monthKey].lost++;

        if (state === 2 && budgetValue > 0) lostDetails.push({ customer, products: budgetProducts.slice(0, 3), value: budgetValue, code: budgetCode, unit: unitKey });
        if (state === 3 && budgetValue > 0) wonDetails.push({ code: budgetCode, customer, value: budgetValue, unit: unitKey, products: budgetProducts.slice(0, 3) });
      }

      const convRate = won + lost > 0 ? ((won / (won + lost)) * 100).toFixed(1) : "N/A";
      sections.push(`## 📊 RESUMO ORÇAMENTOS (${budgets.length} registros)\n- Ganhos: ${won} (${fmtBRL(totalWonValue)})\n- Perdidos: ${lost} (${fmtBRL(totalLostValue)})\n- Abertos: ${open} (${fmtBRL(totalOpenValue)})\n- Taxa de conversão: ${convRate}%\n- Ticket médio (ganhos): ${won > 0 ? fmtBRL(totalWonValue / won) : "N/A"}`);

      const sortedMaterials = Object.entries(materialCounts).sort((a, b) => (b[1].won + b[1].lost + b[1].open) - (a[1].won + a[1].lost + a[1].open)).slice(0, 20);
      if (sortedMaterials.length > 0) {
        sections.push(`## 🧱 MATERIAIS MAIS UTILIZADOS\n${sortedMaterials.map(([name, c]) => `- ${name}: ${c.won + c.lost + c.open} total (ganhos: ${c.won}, perdidos: ${c.lost})`).join("\n")}`);
      }

      const sortedProducts = Object.entries(productCounts).sort((a, b) => (b[1].won + b[1].lost + b[1].open) - (a[1].won + a[1].lost + a[1].open)).slice(0, 20);
      if (sortedProducts.length > 0) {
        sections.push(`## 📦 PRODUTOS MAIS SOLICITADOS\n${sortedProducts.map(([name, c]) => `- ${name}: ${c.won + c.lost + c.open} total (ganhos: ${c.won}, perdidos: ${c.lost}) | Receita: ${fmtBRL(c.totalValue)}`).join("\n")}`);
      }

      const sortedCustomers = Object.entries(customerCounts).sort((a, b) => b[1].total - a[1].total).slice(0, 15);
      if (sortedCustomers.length > 0) {
        sections.push(`## 👥 TOP CLIENTES (ORÇAMENTOS)\n${sortedCustomers.map(([name, c]) => `- ${name}: ${c.total} orçamentos (ganhos: ${c.won}, perdidos: ${c.lost}) | Receita: ${fmtBRL(c.totalValue)}`).join("\n")}`);
      }

      const sortedSellers = Object.entries(sellerCounts).filter(([name]) => name !== "N/A").sort((a, b) => b[1].total - a[1].total).slice(0, 10);
      if (sortedSellers.length > 0) {
        sections.push(`## 👤 VENDEDORES\n${sortedSellers.map(([name, c]) => { const rate = c.total > 0 ? ((c.won / c.total) * 100).toFixed(1) : "0"; return `- ${name}: ${c.total} orçamentos, ${c.won} ganhos (${rate}%) | Receita: ${fmtBRL(c.totalValue)}`; }).join("\n")}`);
      }

      const unitStr = Object.entries(unitCounts).map(([u, c]) => { const rate = c.won + c.lost > 0 ? ((c.won / (c.won + c.lost)) * 100).toFixed(1) : "N/A"; return `- ${u}: ${c.total} total, ${c.won} ganhos, ${c.lost} perdidos (conv: ${rate}%)`; }).join("\n");
      sections.push(`## 🏢 ORÇAMENTOS POR UNIDADE\n${unitStr}`);

      const sortedMonths = Object.entries(monthCounts).filter(([k]) => k !== "N/A").sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
      if (sortedMonths.length > 0) {
        sections.push(`## 📅 TENDÊNCIA MENSAL ORÇAMENTOS (últimos 6 meses)\n${sortedMonths.map(([m, c]) => { const rate = c.won + c.lost > 0 ? ((c.won / (c.won + c.lost)) * 100).toFixed(1) : "N/A"; return `- ${m}: ${c.total} orçamentos, ${c.won} ganhos (conv: ${rate}%)`; }).join("\n")}`);
      }

      const topLost = lostDetails.sort((a, b) => b.value - a.value).slice(0, 15);
      if (topLost.length > 0) {
        sections.push(`## ❌ ORÇAMENTOS PERDIDOS (top por valor)\n${topLost.map(l => `- Job #${l.code} (${l.unit}) | ${l.customer}: ${l.products.join(", ") || "N/A"} | Valor: ${fmtBRL(l.value)}`).join("\n")}`);
      }

      const topWon = wonDetails.sort((a, b) => b.value - a.value).slice(0, 20);
      if (topWon.length > 0) {
        sections.push(`## ✅ ORÇAMENTOS GANHOS (top por valor)\n${topWon.map(w => `- Job #${w.code} (${w.unit}) | ${w.customer}: ${w.products.join(", ") || "N/A"} | Valor orçado: ${fmtBRL(w.value)}`).join("\n")}`);
      }
    }

    // ─── JOBS ───
    const jobs = jobsRes.data;
    if (!jobsRes.error && jobs && jobs.length > 0) {
      let activeJobs = 0, finalizedJobs = 0, totalBudgetedValue = 0, totalRealizedValue = 0;
      const jobsByStatus: Record<string, number> = {};
      const jobsByUnit: Record<string, { active: number; finalized: number; budgeted: number; realized: number }> = {};
      const jobDetails: { code: string; customer: string; unit: string; status: string; progress: number; budgeted: number; realized: number; step: string }[] = [];

      for (const j of jobs) {
        const raw = j.raw_data as Record<string, any>;
        const unitKey = String(raw._unit_key || "poa").toUpperCase();
        const code = String(raw.code || j.record_id || "N/A");
        const customer = String(raw.customerName || "Desconhecido");
        const status = String(raw.productionStatus || raw.status || "Desconhecido");
        const isFinalized = raw.isFinalized === true;
        const progress = Number(raw.progressPercentage || 0);
        const step = String(raw.currentProductionStepName || "N/A");
        const costs = raw.costs || {};
        const budgeted = Number(costs.budgetedTotalPrice || 0);
        const realized = Number(costs.realizedTotalPrice || 0);

        if (isFinalized) finalizedJobs++; else activeJobs++;
        totalBudgetedValue += budgeted;
        totalRealizedValue += realized;

        if (!jobsByStatus[status]) jobsByStatus[status] = 0;
        jobsByStatus[status]++;

        if (!jobsByUnit[unitKey]) jobsByUnit[unitKey] = { active: 0, finalized: 0, budgeted: 0, realized: 0 };
        if (isFinalized) jobsByUnit[unitKey].finalized++; else jobsByUnit[unitKey].active++;
        jobsByUnit[unitKey].budgeted += budgeted;
        jobsByUnit[unitKey].realized += realized;

        jobDetails.push({ code, customer, unit: unitKey, status, progress, budgeted, realized, step });
      }

      sections.push(`## 🏭 RESUMO JOBS (${jobs.length} registros)\n- Ativos: ${activeJobs}\n- Finalizados: ${finalizedJobs}\n- Valor orçado total: ${fmtBRL(totalBudgetedValue)}\n- Valor realizado total: ${fmtBRL(totalRealizedValue)}\n- Margem geral: ${totalBudgetedValue > 0 ? ((1 - totalRealizedValue / totalBudgetedValue) * 100).toFixed(1) + "%" : "N/A"}`);

      const statusStr = Object.entries(jobsByStatus).sort((a, b) => b[1] - a[1]).map(([s, c]) => `- ${s}: ${c}`).join("\n");
      sections.push(`## 🏭 JOBS POR STATUS\n${statusStr}`);

      const jobUnitStr = Object.entries(jobsByUnit).map(([u, c]) => `- ${u}: ${c.active} ativos, ${c.finalized} finalizados | Orçado: ${fmtBRL(c.budgeted)} | Realizado: ${fmtBRL(c.realized)}`).join("\n");
      sections.push(`## 🏭 JOBS POR UNIDADE\n${jobUnitStr}`);

      // Top active jobs by value
      const topActiveJobs = jobDetails.filter(j => j.status !== "Finalizado" && j.budgeted > 0).sort((a, b) => b.budgeted - a.budgeted).slice(0, 15);
      if (topActiveJobs.length > 0) {
        sections.push(`## 🏭 MAIORES JOBS ATIVOS\n${topActiveJobs.map(j => `- Job #${j.code} (${j.unit}) | ${j.customer} | Etapa: ${j.step} | Progresso: ${j.progress}% | Orçado: ${fmtBRL(j.budgeted)} | Realizado: ${fmtBRL(j.realized)}`).join("\n")}`);
      }

      // Jobs with cost overrun
      const overrunJobs = jobDetails.filter(j => j.realized > j.budgeted && j.budgeted > 0).sort((a, b) => (b.realized - b.budgeted) - (a.realized - a.budgeted)).slice(0, 10);
      if (overrunJobs.length > 0) {
        sections.push(`## ⚠️ JOBS COM ESTOURO DE CUSTO\n${overrunJobs.map(j => `- Job #${j.code} (${j.unit}) | ${j.customer} | Orçado: ${fmtBRL(j.budgeted)} | Realizado: ${fmtBRL(j.realized)} | Estouro: ${fmtBRL(j.realized - j.budgeted)}`).join("\n")}`);
      }
    }

    // ─── CONTAS A RECEBER ───
    const receivables = receivablesRes.data;
    if (!receivablesRes.error && receivables && receivables.length > 0) {
      let totalReceived = 0, totalPending = 0, totalOverdue = 0;
      const recByCustomer: Record<string, { received: number; pending: number; overdue: number }> = {};
      const recByUnit: Record<string, { received: number; pending: number; overdue: number }> = {};
      const recDetails: { code: string; customer: string; value: number; unit: string; status: string; dueDate: string }[] = [];

      for (const r of receivables) {
        const raw = r.raw_data as Record<string, any>;
        const value = Number(raw.value || raw.totalValue || raw.amount || 0);
        const customer = String(raw.customerName || raw.customer?.name || "Desconhecido");
        const unitKey = String(raw._unit_key || "poa").toUpperCase();
        const jobCode = String(raw.jobCode || raw.code || raw.documentNumber || r.record_id || "N/A");
        const dueDate = String(raw.dueDate || raw.expirationDate || "");
        const isPaid = raw.paid === true || raw.status === "paid" || raw.status === "received" || Number(raw.receivedValue || 0) > 0;
        const isOverdue = !isPaid && dueDate && new Date(dueDate) < new Date();

        if (isPaid) totalReceived += value;
        else if (isOverdue) totalOverdue += value;
        else totalPending += value;

        const statusLabel = isPaid ? "recebido" : isOverdue ? "vencido" : "pendente";

        if (!recByCustomer[customer]) recByCustomer[customer] = { received: 0, pending: 0, overdue: 0 };
        if (isPaid) recByCustomer[customer].received += value;
        else if (isOverdue) recByCustomer[customer].overdue += value;
        else recByCustomer[customer].pending += value;

        if (!recByUnit[unitKey]) recByUnit[unitKey] = { received: 0, pending: 0, overdue: 0 };
        if (isPaid) recByUnit[unitKey].received += value;
        else if (isOverdue) recByUnit[unitKey].overdue += value;
        else recByUnit[unitKey].pending += value;

        recDetails.push({ code: jobCode, customer, value, unit: unitKey, status: statusLabel, dueDate });
      }

      sections.push(`## 💰 CONTAS A RECEBER (${receivables.length} registros)\n- Recebido: ${fmtBRL(totalReceived)}\n- Pendente: ${fmtBRL(totalPending)}\n- Vencido/Inadimplente: ${fmtBRL(totalOverdue)}`);

      sections.push(`## 💰 RECEBER POR UNIDADE\n${Object.entries(recByUnit).map(([u, c]) => `- ${u}: Recebido ${fmtBRL(c.received)} | Pendente ${fmtBRL(c.pending)} | Vencido ${fmtBRL(c.overdue)}`).join("\n")}`);

      const topRecCust = Object.entries(recByCustomer).sort((a, b) => (b[1].received + b[1].pending + b[1].overdue) - (a[1].received + a[1].pending + a[1].overdue)).slice(0, 15);
      if (topRecCust.length > 0) {
        sections.push(`## 💰 RECEBER POR CLIENTE (top)\n${topRecCust.map(([name, c]) => `- ${name}: Recebido ${fmtBRL(c.received)} | Pendente ${fmtBRL(c.pending)} | Vencido ${fmtBRL(c.overdue)}`).join("\n")}`);
      }

      const topOverdue = recDetails.filter(r => r.status === "vencido").sort((a, b) => b.value - a.value).slice(0, 10);
      if (topOverdue.length > 0) {
        sections.push(`## 🚨 MAIORES INADIMPLÊNCIAS\n${topOverdue.map(r => `- Job #${r.code} (${r.unit}) | ${r.customer} | Valor: ${fmtBRL(r.value)} | Vencimento: ${r.dueDate || "N/A"}`).join("\n")}`);
      }
    }

    // ─── CONTAS A PAGAR ───
    const payables = payablesRes.data;
    if (!payablesRes.error && payables && payables.length > 0) {
      let totalPaid = 0, totalPendingPay = 0, totalOverduePay = 0;
      const payBySupplier: Record<string, { paid: number; pending: number; overdue: number }> = {};
      const payByUnit: Record<string, { paid: number; pending: number; overdue: number }> = {};
      const payDetails: { code: string; supplier: string; value: number; unit: string; status: string; dueDate: string; description: string }[] = [];

      for (const p of payables) {
        const raw = p.raw_data as Record<string, any>;
        const value = Number(raw.value || raw.totalValue || raw.amount || 0);
        const supplier = String(raw.supplierName || raw.supplier?.name || raw.customerName || "Desconhecido");
        const unitKey = String(raw._unit_key || "poa").toUpperCase();
        const docCode = String(raw.documentNumber || raw.code || p.record_id || "N/A");
        const dueDate = String(raw.dueDate || raw.expirationDate || "");
        const description = String(raw.description || raw.observation || "").slice(0, 60);
        const isPaid = raw.paid === true || raw.status === "paid" || Number(raw.paidValue || 0) > 0;
        const isOverdue = !isPaid && dueDate && new Date(dueDate) < new Date();

        if (isPaid) totalPaid += value;
        else if (isOverdue) totalOverduePay += value;
        else totalPendingPay += value;

        const statusLabel = isPaid ? "pago" : isOverdue ? "vencido" : "pendente";

        if (!payBySupplier[supplier]) payBySupplier[supplier] = { paid: 0, pending: 0, overdue: 0 };
        if (isPaid) payBySupplier[supplier].paid += value;
        else if (isOverdue) payBySupplier[supplier].overdue += value;
        else payBySupplier[supplier].pending += value;

        if (!payByUnit[unitKey]) payByUnit[unitKey] = { paid: 0, pending: 0, overdue: 0 };
        if (isPaid) payByUnit[unitKey].paid += value;
        else if (isOverdue) payByUnit[unitKey].overdue += value;
        else payByUnit[unitKey].pending += value;

        payDetails.push({ code: docCode, supplier, value, unit: unitKey, status: statusLabel, dueDate, description });
      }

      sections.push(`## 📤 CONTAS A PAGAR (${payables.length} registros)\n- Pago: ${fmtBRL(totalPaid)}\n- Pendente: ${fmtBRL(totalPendingPay)}\n- Vencido: ${fmtBRL(totalOverduePay)}`);

      sections.push(`## 📤 PAGAR POR UNIDADE\n${Object.entries(payByUnit).map(([u, c]) => `- ${u}: Pago ${fmtBRL(c.paid)} | Pendente ${fmtBRL(c.pending)} | Vencido ${fmtBRL(c.overdue)}`).join("\n")}`);

      const topSuppliers = Object.entries(payBySupplier).sort((a, b) => (b[1].paid + b[1].pending + b[1].overdue) - (a[1].paid + a[1].pending + a[1].overdue)).slice(0, 15);
      if (topSuppliers.length > 0) {
        sections.push(`## 📤 MAIORES FORNECEDORES\n${topSuppliers.map(([name, c]) => `- ${name}: Pago ${fmtBRL(c.paid)} | Pendente ${fmtBRL(c.pending)} | Vencido ${fmtBRL(c.overdue)}`).join("\n")}`);
      }

      const upcomingPay = payDetails.filter(p => p.status === "pendente" && p.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10);
      if (upcomingPay.length > 0) {
        sections.push(`## 📤 PRÓXIMOS VENCIMENTOS (A PAGAR)\n${upcomingPay.map(p => `- Doc #${p.code} (${p.unit}) | ${p.supplier} | Valor: ${fmtBRL(p.value)} | Vencimento: ${p.dueDate} | ${p.description}`).join("\n")}`);
      }

      const overduePay = payDetails.filter(p => p.status === "vencido").sort((a, b) => b.value - a.value).slice(0, 10);
      if (overduePay.length > 0) {
        sections.push(`## 🚨 CONTAS A PAGAR VENCIDAS\n${overduePay.map(p => `- Doc #${p.code} (${p.unit}) | ${p.supplier} | Valor: ${fmtBRL(p.value)} | Vencimento: ${p.dueDate}`).join("\n")}`);
      }
    }

    // ─── FLUXO DE CAIXA SIMPLIFICADO ───
    const totalEntradas = sections.some(s => s.includes("CONTAS A RECEBER")) ? "ver seção Contas a Receber" : "sem dados";
    const totalSaidas = sections.some(s => s.includes("CONTAS A PAGAR")) ? "ver seção Contas a Pagar" : "sem dados";
    sections.push(`## 📈 FLUXO DE CAIXA\n- Entradas: ${totalEntradas}\n- Saídas: ${totalSaidas}\n- Use os dados acima para calcular saldo líquido por período quando perguntado`);

    return sections.length > 1 ? sections.join("\n\n") : "⚠️ Sem dados no cache. Execute uma sincronização primeiro.";
  } catch (e) {
    console.error("[budget-agent] Context error:", e);
    return "⚠️ Erro ao carregar dados.";
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

    const fullContext = await fetchFullContext();
    const systemContent = `${SYSTEM_PROMPT}\n\n## DADOS DISPONÍVEIS:\n${fullContext}`;

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
