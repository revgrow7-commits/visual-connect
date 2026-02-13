import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-2.5-flash";
const HOLDPRINT_BASE = "https://api.holdworks.ai";

const SECTOR_ENDPOINTS: Record<string, string[]> = {
  operacao: ["jobs"],
  comercial: ["customers", "budgets"],
  compras: ["suppliers", "expenses"],
  financeiro: ["expenses", "incomes"],
  faturamento: ["incomes", "budgets"],
  contabil: ["expenses", "incomes"],
  fiscal: ["incomes", "expenses"],
  marketing: ["customers", "budgets"],
  cs: ["customers", "jobs"],
  juridico: ["customers", "suppliers"],
  rh: ["jobs"],
  orquestrador: ["customers", "budgets", "jobs", "expenses", "incomes", "suppliers"],
};

const ENDPOINT_CONFIG: Record<string, { path: string; pageParam: string; limitParam: string; dateFilters?: boolean }> = {
  customers: { path: "/api-key/customers/data", pageParam: "page", limitParam: "limit" },
  suppliers: { path: "/api-key/suppliers/data", pageParam: "page", limitParam: "limit" },
  budgets: { path: "/api-key/budgets/data", pageParam: "page", limitParam: "pageSize", dateFilters: true },
  jobs: { path: "/api-key/jobs/data", pageParam: "page", limitParam: "pageSize", dateFilters: true },
  expenses: { path: "/api-key/expenses/data", pageParam: "page", limitParam: "limit", dateFilters: true },
  incomes: { path: "/api-key/incomes/data", pageParam: "page", limitParam: "limit", dateFilters: true },
};

async function fetchHoldprint(apiKey: string, endpoint: string): Promise<{ data: unknown; error?: string }> {
  const config = ENDPOINT_CONFIG[endpoint];
  if (!config) return { data: null, error: `Endpoint ${endpoint} desconhecido` };

  const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
  url.searchParams.set(config.pageParam, "1");
  url.searchParams.set(config.limitParam, "20");
  url.searchParams.set("language", "pt-BR");

  if (config.dateFilters) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const startKey = endpoint === "expenses" || endpoint === "incomes" ? "start_date" : "startDate";
    const endKey = endpoint === "expenses" || endpoint === "incomes" ? "end_date" : "endDate";
    url.searchParams.set(startKey, fmt(start));
    url.searchParams.set(endKey, fmt(end));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`[holdprint] ${endpoint} error ${res.status}:`, t.slice(0, 200));
      return { data: null, error: `API retornou ${res.status}` };
    }
    const json = await res.json();
    return { data: json };
  } catch (e) {
    console.error(`[holdprint] ${endpoint} fetch error:`, e);
    return { data: null, error: "Falha na conexão" };
  }
}

function summarizeData(endpoint: string, data: unknown): string {
  if (!data) return `${endpoint}: Sem dados disponíveis`;

  const items = Array.isArray(data) ? data : (data as any)?.data || (data as any)?.items || (data as any)?.results || [];
  if (!Array.isArray(items) || items.length === 0) {
    if (typeof data === "object" && data !== null) {
      const keys = Object.keys(data as object);
      if (keys.includes("totalCount") || keys.includes("total")) {
        return `${endpoint}: ${JSON.stringify(data).slice(0, 500)}`;
      }
    }
    return `${endpoint}: Nenhum registro encontrado no período`;
  }

  const count = items.length;
  const total = (data as any)?.totalCount || (data as any)?.total || count;

  switch (endpoint) {
    case "customers": {
      const active = items.filter((c: any) => c.active !== false).length;
      const names = items.slice(0, 5).map((c: any) => c.name || c.fantasyName || "?").join(", ");
      return `CLIENTES: ${total} total (${active} ativos). Exemplos: ${names}`;
    }
    case "suppliers": {
      const cats = [...new Set(items.map((s: any) => s.category).filter(Boolean))];
      const names = items.slice(0, 5).map((s: any) => s.name || "?").join(", ");
      return `FORNECEDORES: ${total} total. Categorias: ${cats.join(", ") || "N/A"}. Exemplos: ${names}`;
    }
    case "budgets": {
      const won = items.filter((b: any) => b.budgetState === 3 || b.state === 3).length;
      const lost = items.filter((b: any) => b.budgetState === 2 || b.state === 2).length;
      const open = items.filter((b: any) => b.budgetState === 1 || b.state === 1).length;
      const totalValue = items.reduce((sum: number, b: any) => {
        const proposals = b.proposals || [];
        return sum + proposals.reduce((ps: number, p: any) => ps + (p.totalPrice || 0), 0);
      }, 0);
      return `ORÇAMENTOS (mês atual): ${total} total — ${won} ganhos, ${lost} perdidos, ${open} abertos. Valor total: R$${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
    case "jobs": {
      const statuses: Record<string, number> = {};
      items.forEach((j: any) => {
        const s = j.productionStatus || j.status || "Desconhecido";
        statuses[s] = (statuses[s] || 0) + 1;
      });
      const avgProgress = items.reduce((sum: number, j: any) => sum + (j.progressPercentage || 0), 0) / (count || 1);
      const statusStr = Object.entries(statuses).map(([k, v]) => `${k}: ${v}`).join(", ");
      return `JOBS (mês atual): ${total} total. Status: ${statusStr}. Progresso médio: ${avgProgress.toFixed(0)}%`;
    }
    case "expenses": {
      const totalAmount = items.reduce((sum: number, e: any) => sum + (e.amount || e.value || 0), 0);
      const pending = items.filter((e: any) => e.status === "pending").length;
      const overdue = items.filter((e: any) => e.status === "overdue").length;
      const paid = items.filter((e: any) => e.status === "paid").length;
      return `CONTAS A PAGAR (mês atual): ${total} total — R$${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Pendentes: ${pending}, Pagas: ${paid}, Vencidas: ${overdue}`;
    }
    case "incomes": {
      const totalAmount = items.reduce((sum: number, i: any) => sum + (i.amount || i.value || 0), 0);
      const pending = items.filter((i: any) => i.status === "pending").length;
      const received = items.filter((i: any) => i.status === "received").length;
      const overdue = items.filter((i: any) => i.status === "overdue").length;
      return `CONTAS A RECEBER (mês atual): ${total} total — R$${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Pendentes: ${pending}, Recebidas: ${received}, Vencidas: ${overdue}`;
    }
    default:
      return `${endpoint}: ${count} registros encontrados`;
  }
}

// Fetch historical data from rag_documents (holdprint source)
async function fetchRagHistorical(sector: string, endpoints: string[]): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "";

  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await sb
      .from("rag_documents")
      .select("content, sector, metadata, original_filename")
      .eq("source_type", "holdprint")
      .in("sector", endpoints)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      console.log("[rag] No historical data found:", error?.message);
      return "";
    }

    const grouped: Record<string, string[]> = {};
    for (const doc of data) {
      const ep = doc.sector || "geral";
      if (!grouped[ep]) grouped[ep] = [];
      grouped[ep].push(doc.content.slice(0, 600));
    }

    const sections = Object.entries(grouped).map(([ep, docs]) => {
      return `### ${ep.toUpperCase()} (${docs.length} registros históricos)\n${docs.slice(0, 10).join("\n---\n")}`;
    });

    return `\n\n## 📂 DADOS HISTÓRICOS (RAG - base sincronizada 2025):\n${sections.join("\n\n")}`;
  } catch (e) {
    console.error("[rag] Error fetching historical:", e);
    return "";
  }
}

// Fetch internal database data for the orchestrator (Cérebro)
async function fetchInternalDB(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "";

  const sb = createClient(supabaseUrl, serviceKey);
  const sections: string[] = [];

  try {
    // 1. Colaboradores summary
    const { data: colabs, error: colabErr } = await sb
      .from("colaboradores")
      .select("nome, sobrenome, cargo, setor, unidade, status, data_admissao")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!colabErr && colabs && colabs.length > 0) {
      const total = colabs.length;
      const byStatus: Record<string, number> = {};
      const bySetor: Record<string, number> = {};
      const byUnidade: Record<string, number> = {};
      colabs.forEach((c: any) => {
        byStatus[c.status || "desconhecido"] = (byStatus[c.status || "desconhecido"] || 0) + 1;
        if (c.setor) bySetor[c.setor] = (bySetor[c.setor] || 0) + 1;
        if (c.unidade) byUnidade[c.unidade] = (byUnidade[c.unidade] || 0) + 1;
      });
      const statusStr = Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ");
      const setorStr = Object.entries(bySetor).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join(", ");
      const unidadeStr = Object.entries(byUnidade).map(([k, v]) => `${k}: ${v}`).join(", ");
      const recentes = colabs.slice(0, 5).map((c: any) => `${c.nome} ${c.sobrenome || ""} (${c.cargo || "?"} - ${c.setor || "?"})`).join("; ");
      sections.push(`### 👥 COLABORADORES (${total} registros)\nStatus: ${statusStr}\nPor setor: ${setorStr}\nPor unidade: ${unidadeStr}\nRecentes: ${recentes}`);
    }

    // 2. Ouvidoria summary
    const { data: ouvidoria, error: ouvErr } = await sb
      .from("ouvidoria_manifestacoes")
      .select("protocolo, categoria, setor, unidade, urgencia, status, anonimo, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!ouvErr && ouvidoria && ouvidoria.length > 0) {
      const total = ouvidoria.length;
      const byStatus: Record<string, number> = {};
      const byCategoria: Record<string, number> = {};
      const byUrgencia: Record<string, number> = {};
      ouvidoria.forEach((m: any) => {
        byStatus[m.status || "?"] = (byStatus[m.status || "?"] || 0) + 1;
        byCategoria[m.categoria || "?"] = (byCategoria[m.categoria || "?"] || 0) + 1;
        byUrgencia[m.urgencia || "?"] = (byUrgencia[m.urgencia || "?"] || 0) + 1;
      });
      const statusStr = Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ");
      const catStr = Object.entries(byCategoria).map(([k, v]) => `${k}: ${v}`).join(", ");
      const urgStr = Object.entries(byUrgencia).map(([k, v]) => `${k}: ${v}`).join(", ");
      const abertas = ouvidoria.filter((m: any) => m.status === "aberto").length;
      sections.push(`### 📢 OUVIDORIA (${total} manifestações)\nStatus: ${statusStr}\nCategorias: ${catStr}\nUrgência: ${urgStr}\nAbertas pendentes: ${abertas}`);
    }

    // 3. Comunicados summary
    const { data: comunicados, error: comErr } = await sb
      .from("comunicados")
      .select("titulo, categoria, unidade, status, fixado, likes_count, dislikes_count, comentarios_count, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!comErr && comunicados && comunicados.length > 0) {
      const total = comunicados.length;
      const ativos = comunicados.filter((c: any) => c.status === "ativo").length;
      const fixados = comunicados.filter((c: any) => c.fixado).length;
      const totalLikes = comunicados.reduce((s: number, c: any) => s + (c.likes_count || 0), 0);
      const totalComments = comunicados.reduce((s: number, c: any) => s + (c.comentarios_count || 0), 0);
      const byCat: Record<string, number> = {};
      comunicados.forEach((c: any) => { byCat[c.categoria || "Geral"] = (byCat[c.categoria || "Geral"] || 0) + 1; });
      const catStr = Object.entries(byCat).map(([k, v]) => `${k}: ${v}`).join(", ");
      const recentes = comunicados.slice(0, 5).map((c: any) => `"${c.titulo}" (${c.categoria})`).join("; ");
      sections.push(`### 📰 COMUNICADOS (${total} recentes)\nAtivos: ${ativos} | Fixados: ${fixados}\nTotal likes: ${totalLikes} | Total comentários: ${totalComments}\nCategorias: ${catStr}\nRecentes: ${recentes}`);
    }

    // 4. Banco de horas summary
    const { data: bancoHoras, error: bhErr } = await sb
      .from("banco_horas")
      .select("nome, departamento, unidade, competencia, saldo_decimal, b_saldo")
      .order("competencia", { ascending: false })
      .limit(50);

    if (!bhErr && bancoHoras && bancoHoras.length > 0) {
      const competencias = [...new Set(bancoHoras.map((b: any) => b.competencia))];
      const totalColab = new Set(bancoHoras.map((b: any) => b.nome)).size;
      const positivos = bancoHoras.filter((b: any) => (b.saldo_decimal || 0) > 0).length;
      const negativos = bancoHoras.filter((b: any) => (b.saldo_decimal || 0) < 0).length;
      const byDept: Record<string, number> = {};
      bancoHoras.forEach((b: any) => { if (b.departamento) byDept[b.departamento] = (byDept[b.departamento] || 0) + 1; });
      const deptStr = Object.entries(byDept).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join(", ");
      sections.push(`### ⏰ BANCO DE HORAS\nCompetências: ${competencias.slice(0, 3).join(", ")}\nColaboradores: ${totalColab} | Saldo positivo: ${positivos} | Saldo negativo: ${negativos}\nPor departamento: ${deptStr}`);
    }

    if (sections.length === 0) return "";
    return `\n\n## 🗄️ DADOS INTERNOS (Banco de Dados - tempo real):\n${sections.join("\n\n")}`;
  } catch (e) {
    console.error("[internal-db] Error:", e);
    return "";
  }
}

const SECTOR_PROMPTS: Record<string, string> = {
  operacao: `Você é o **Agente de Operação** da Indústria Visual 🏭
Especialista em produção de comunicação visual (impressão, acabamento, corte, pintura, logística, instalação).
Responsabilidades: Controle de Jobs, custos 4 fases (orçado→aprovado→planejado→realizado), feedstocks, Kanban, PCP.
Normas: NR-12, NR-35, NR-6. EPIs obrigatórios.`,

  comercial: `Você é o **Agente Comercial** da Indústria Visual 💰
Especialista em vendas e CRM. Pipeline de orçamentos (Open/Won/Lost), taxa de conversão, ticket médio, margem por produto.
Cálculos: Taxa conversão = Won/Total × 100, Margem = média(totalProfitPercentual).`,

  compras: `Você é o **Agente de Compras** da Indústria Visual 🛒
Fornecedores (papel, tintas, equipamentos, serviços), cotações, condições de pagamento, gastos por categoria.`,

  financeiro: `Você é o **Agente Financeiro** da Indústria Visual 💳
Contas a pagar/receber, fluxo de caixa, inadimplência, DRE gerencial, centros de custo.`,

  faturamento: `Você é o **Agente de Faturamento** da Indústria Visual 📋
NFs, ordens de serviço, orçamentos aprovados pendentes de faturar.`,

  contabil: `Você é o **Agente Contábil** da Indústria Visual 📊
Escrituração, custos 4 fases, centros de custo, conciliações, balanços e DRE.`,

  fiscal: `Você é o **Agente Fiscal** da Indústria Visual 🏛️
Impostos, CFOP, SPED, obrigações acessórias e guias.`,

  marketing: `Você é o **Agente de Marketing** da Indústria Visual 📢
Campanhas, portfólio, segmentação de clientes, análise de conversão, branding.`,

  cs: `Você é o **Agente de Customer Success** da Indústria Visual 🎯
Pós-venda, garantias, reclamações, histórico de entregas por cliente.`,

  juridico: `Você é o **Agente Jurídico** da Indústria Visual ⚖️
Contratos, licenças, compliance, LGPD e riscos jurídicos.`,

  rh: `Você é o **Agente de RH** da Indústria Visual 🧑‍💼
Planejamento de equipe, produtividade, treinamentos (C.R.I.E.), admissão, banco de horas.`,

  orquestrador: `Você é o **Orquestrador** (🧠 Cérebro) da Indústria Visual.
Perfis: CEO (estratégia), CFO (finanças), CMO (marketing), COO (operações).
Acesso a TODOS os setores. Análise cross-funcional. Sugere melhorias com KPIs.
Identifique qual perfil é mais adequado. Cruze dados entre setores. Priorize dados reais.

## ACESSO COMPLETO À INTRANET
Você tem acesso total a todas as seções da intranet da Indústria Visual e pode navegar, consultar e analisar dados de qualquer módulo:
- **RH**: Admissão, Colaboradores, Banco de Horas, Contratos, Geração de Links de Recrutamento
- **Gestão Setorial**: Operação, Comercial, Compras, Financeiro, Faturamento, Contábil, Fiscal, Marketing, CS, Jurídico
- **Comunicação**: Comunicados internos, Endomarketing (cartazes), Notícias
- **Ouvidoria**: Manifestações, protocolos, categorias e status
- **Onboarding**: Trilhas de integração, etapas e progresso dos colaboradores
- **Benefícios**: Planos e pacotes de benefícios por cargo/unidade
- **Administrativo**: Gestão de usuários, roles (admin/rh/gestor/colaborador/user), perfis
- **Unidades**: POA (Porto Alegre) e SP (São Paulo)
- **Processos & Kanban**: Fluxos operacionais e gestão visual de tarefas

Ao responder, você pode referenciar qualquer dado disponível na intranet. Quando o usuário perguntar sobre qualquer área, analise os dados disponíveis (tempo real + históricos RAG) e forneça insights acionáveis com números concretos.`,
};

const BASE_RULES = `
## Empresa: Indústria Visual
Integradora de comunicação visual. Smart Signage (Flat, Waved, Curved, Convex). Cultura C.R.I.E.

## Regras:
1. Responda em PT-BR com markdown
2. USE OS DADOS REAIS fornecidos abaixo — cite números específicos
3. Você tem acesso a DADOS EM TEMPO REAL (mês atual) e DADOS HISTÓRICOS (RAG sincronizado de 2025)
4. Para perguntas sobre histórico, tendências ou comparações, USE os dados históricos do RAG
5. NUNCA invente números. Use apenas os dados fornecidos
6. Formate valores em R$ brasileiro
7. Quando comparar períodos, deixe claro a fonte (tempo real vs histórico)`;

// Sync Holdprint data for sector endpoints into DB (holdprint_cache + rag_documents)
async function syncHoldprintToDB(endpoints: string[]): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "⚠️ Supabase não configurado para sync";

  const sb = createClient(supabaseUrl, serviceKey);

  const UNITS = [
    { key: "poa", label: "Porto Alegre", envVar: "HOLDPRINT_TOKEN_POA" },
    { key: "sp", label: "São Paulo", envVar: "HOLDPRINT_TOKEN_SP" },
  ];

  const BATCH_SIZE = 50;
  let totalSynced = 0;

  for (const unit of UNITS) {
    const token = Deno.env.get(unit.envVar);
    if (!token) continue;

    for (const endpoint of endpoints) {
      const config = ENDPOINT_CONFIG[endpoint];
      if (!config) continue;

      // Fetch all pages
      const allItems: Record<string, unknown>[] = [];
      let page = 1;
      while (true) {
        const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
        url.searchParams.set(config.pageParam, String(page));
        url.searchParams.set(config.limitParam, String(BATCH_SIZE));
        url.searchParams.set("language", "pt-BR");

        if (config.dateFilters) {
          const now = new Date();
          const start = new Date(2025, 0, 1);
          const fmt = (d: Date) => d.toISOString().split("T")[0];
          const sk = endpoint === "expenses" || endpoint === "incomes" ? "start_date" : "startDate";
          const ek = endpoint === "expenses" || endpoint === "incomes" ? "end_date" : "endDate";
          url.searchParams.set(sk, fmt(start));
          url.searchParams.set(ek, fmt(now));
        }

        try {
          const res = await fetch(url.toString(), {
            headers: { "x-api-key": token, "Content-Type": "application/json" },
          });
          if (!res.ok) break;
          const json = await res.json();
          const items = Array.isArray(json) ? json : json?.data || json?.items || json?.results || [];
          if (!Array.isArray(items) || items.length === 0) break;
          allItems.push(...items);
          if (items.length < BATCH_SIZE) break;
          page++;
        } catch { break; }
      }

      if (allItems.length === 0) continue;

      // Build content text helper
      const buildText = (item: Record<string, unknown>): string => {
        switch (endpoint) {
          case "customers": return `Cliente: ${item.name || item.fantasyName || "?"} | CNPJ: ${item.cnpj || "N/A"}`;
          case "suppliers": return `Fornecedor: ${item.name || "?"} | Categoria: ${item.category || "N/A"}`;
          case "budgets": return `Orçamento #${item.id || "?"} | Estado: ${item.budgetState || item.state || "?"}`;
          case "jobs": return `Job #${item.id || "?"} | Status: ${item.productionStatus || item.status || "?"}`;
          case "expenses": return `Despesa #${item.id || "?"} | Valor: R$${item.amount || item.value || 0}`;
          case "incomes": return `Receita #${item.id || "?"} | Valor: R$${item.amount || item.value || 0}`;
          default: return JSON.stringify(item).slice(0, 200);
        }
      };

      const extractId = (item: Record<string, unknown>) =>
        String(item.id || item.Id || item.ID || item.code || crypto.randomUUID());

      const rows = allItems.map((item) => ({
        endpoint,
        record_id: `${unit.key}_${extractId(item)}`,
        raw_data: { ...item, _unidade: unit.label, _unit_key: unit.key },
        content_text: `[${unit.label}] ${buildText(item)}`,
        last_synced: new Date().toISOString(),
      }));

      // Upsert holdprint_cache
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await sb.from("holdprint_cache").upsert(batch, { onConflict: "endpoint,record_id" });
        if (error) console.error(`[sync] ${unit.key}/${endpoint} cache error:`, error.message);
      }

      // Upsert rag_documents
      const ragRows = rows.map((r) => ({
        content: `${r.content_text}\n\nDados: ${JSON.stringify(r.raw_data).slice(0, 3000)}`,
        sector: endpoint,
        source_type: "holdprint",
        original_filename: `holdprint_${unit.key}_${endpoint}_${r.record_id}`,
        metadata: { endpoint, unit: unit.key, record_id: r.record_id, synced_at: r.last_synced },
      }));

      for (let i = 0; i < ragRows.length; i += 100) {
        const batch = ragRows.slice(i, i + 100);
        const { error } = await sb.from("rag_documents").upsert(batch, { onConflict: "original_filename" });
        if (error) console.error(`[sync] ${unit.key}/${endpoint} rag error:`, error.message);
      }

      totalSynced += allItems.length;
      console.log(`[sync] ${unit.key}/${endpoint}: ${allItems.length} registros sincronizados`);
    }
  }

  return `✅ ${totalSynced} registros Holdprint importados para o banco`;
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
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

    const holdprintKey = Deno.env.get("HOLDPRINT_API_KEY");

    const { messages, sector } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400);
    }

    const sectorPrompt = SECTOR_PROMPTS[sector] || SECTOR_PROMPTS.orquestrador;
    const endpoints = SECTOR_ENDPOINTS[sector] || [];

    const isOrquestrador = sector === "orquestrador";

    // Fetch live + historical + internal DB data in parallel; also sync to DB
    const [holdprintContext, ragContext, internalDbContext, syncResult] = await Promise.all([
      (async () => {
        if (!holdprintKey) return "\n\n⚠️ API Holdprint não configurada. Respondendo com base no conhecimento geral.";
        const results = await Promise.all(
          endpoints.map(async (ep) => {
            const { data, error } = await fetchHoldprint(holdprintKey, ep);
            if (error) return `${ep}: ⚠️ ${error}`;
            return summarizeData(ep, data);
          })
        );
        return `\n\n## 📊 DADOS EM TEMPO REAL (Holdprint API - ${new Date().toLocaleDateString("pt-BR")}):\n${results.join("\n")}`;
      })(),
      fetchRagHistorical(sector, endpoints),
      isOrquestrador ? fetchInternalDB() : Promise.resolve(""),
      endpoints.length > 0 ? syncHoldprintToDB(endpoints) : Promise.resolve(""),
    ]);
    console.log(`[sector-agent] Sync: ${syncResult}`);

    const systemContent = `${sectorPrompt}\n${BASE_RULES}${holdprintContext}${ragContext}${internalDbContext}`;

    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.filter((m: { role: string }) => m.role !== "system"),
    ];

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${geminiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: apiMessages, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
      const t = await response.text();
      console.error("[sector-agent] Gemini error:", response.status, t);
      throw new Error("Erro ao comunicar com o agente");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[sector-agent] Error:", err.message);
    return jsonResponse({ error: err.message || "Erro desconhecido" }, 500);
  }
});
