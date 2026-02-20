import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// Fetch CS tickets and complaints from the database
async function fetchCSTickets(sector: string): Promise<string> {
  if (sector !== "cs" && sector !== "orquestrador") return "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "";

  const sb = createClient(supabaseUrl, serviceKey);
  const sections: string[] = [];

  try {
    // Fetch recent tickets
    const { data: tickets, error: ticketsErr } = await sb
      .from("cs_tickets")
      .select("code, customer_name, category, priority, status, description, date, resolution, resolved_date, job_code, job_title, sla_response_breached, sla_resolution_breached, survey_rating")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!ticketsErr && tickets && tickets.length > 0) {
      const total = tickets.length;
      const byStatus: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      tickets.forEach((t: any) => {
        byStatus[t.status || "?"] = (byStatus[t.status || "?"] || 0) + 1;
        byCategory[t.category || "?"] = (byCategory[t.category || "?"] || 0) + 1;
        byPriority[t.priority || "?"] = (byPriority[t.priority || "?"] || 0) + 1;
      });
      const slaBreaches = tickets.filter((t: any) => t.sla_response_breached || t.sla_resolution_breached).length;
      const avgRating = tickets.filter((t: any) => t.survey_rating).reduce((s: number, t: any) => s + t.survey_rating, 0) / (tickets.filter((t: any) => t.survey_rating).length || 1);

      const recentTickets = tickets.slice(0, 10).map((t: any) =>
        `- [${t.code}] ${t.customer_name}: ${t.description?.slice(0, 100) || "?"} (${t.status}, ${t.priority}) ${t.resolution ? `→ Resolução: ${t.resolution.slice(0, 80)}` : ""}`
      ).join("\n");

      sections.push(`### 🎫 TICKETS CS (${total} registros)
Status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}
Categorias: ${Object.entries(byCategory).map(([k, v]) => `${k}: ${v}`).join(", ")}
Prioridade: ${Object.entries(byPriority).map(([k, v]) => `${k}: ${v}`).join(", ")}
SLA violados: ${slaBreaches} | Satisfação média: ${avgRating.toFixed(1)}/5
\nÚltimos tickets:\n${recentTickets}`);
    }

    // Fetch recent touchpoints
    const { data: touchpoints, error: tpErr } = await sb
      .from("cs_touchpoints")
      .select("customer_name, type, channel, status, date, notes, trigger_reason")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!tpErr && touchpoints && touchpoints.length > 0) {
      const tpSummary = touchpoints.slice(0, 8).map((tp: any) =>
        `- ${tp.customer_name}: ${tp.type} via ${tp.channel} (${tp.status}) ${tp.notes ? `- ${tp.notes.slice(0, 60)}` : ""}`
      ).join("\n");
      sections.push(`### 📞 TOUCHPOINTS RECENTES (${touchpoints.length})\n${tpSummary}`);
    }

    // Fetch opportunities
    const { data: opps, error: oppErr } = await sb
      .from("cs_oportunidades")
      .select("customer_name, type, status, estimated_value, description, next_step")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!oppErr && opps && opps.length > 0) {
      const totalValue = opps.reduce((s: number, o: any) => s + (o.estimated_value || 0), 0);
      const oppSummary = opps.slice(0, 5).map((o: any) =>
        `- ${o.customer_name}: ${o.type} — R$${(o.estimated_value || 0).toLocaleString("pt-BR")} (${o.status})`
      ).join("\n");
      sections.push(`### 💡 OPORTUNIDADES CS (${opps.length} — R$${totalValue.toLocaleString("pt-BR")})\n${oppSummary}`);
    }

    // Fetch visits
    const { data: visitas, error: visErr } = await sb
      .from("cs_visitas")
      .select("code, customer_name, type, status, scheduled_date, technician_name, report_notes")
      .order("scheduled_date", { ascending: false })
      .limit(15);

    if (!visErr && visitas && visitas.length > 0) {
      const visSummary = visitas.slice(0, 5).map((v: any) =>
        `- [${v.code}] ${v.customer_name}: ${v.type} (${v.status}) — ${new Date(v.scheduled_date).toLocaleDateString("pt-BR")}`
      ).join("\n");
      sections.push(`### 🚗 VISITAS TÉCNICAS (${visitas.length})\n${visSummary}`);
    }

    if (sections.length === 0) return "";
    return `\n\n## 🎯 DADOS CS (Banco de Dados - tempo real):\n${sections.join("\n\n")}`;
  } catch (e) {
    console.error("[cs-tickets] Error:", e);
    return "";
  }
}

// Fetch PCP Kanban data from external system
async function fetchPCPKanban(sector: string): Promise<string> {
  if (sector !== "cs" && sector !== "orquestrador" && sector !== "operacao") return "";

  try {
    const res = await fetch("https://empflow-22.emergent.host/kanban", {
      headers: { "Accept": "text/html" },
    });
    if (!res.ok) {
      console.error(`[pcp-kanban] HTTP ${res.status}`);
      return "\n\n### 🏭 PCP KANBAN: Indisponível no momento";
    }
    const html = await res.text();

    // Extract text content from HTML (remove tags, scripts, styles)
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    if (cleaned.length < 50) {
      return "\n\n### 🏭 PCP KANBAN: Sem dados extraíveis (possível SPA com carregamento dinâmico)";
    }

    return `\n\n### 🏭 PCP KANBAN (dados extraídos do painel externo - empflow):\n${cleaned}`;
  } catch (e) {
    console.error("[pcp-kanban] Error:", e);
    return "\n\n### 🏭 PCP KANBAN: Erro ao acessar painel externo";
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
Especialista em pós-venda, garantias, reclamações, entregas, tickets e histórico de relacionamento com clientes.
Você tem acesso aos tickets CS, visitas técnicas, touchpoints, oportunidades, dados históricos de jobs/clientes da Holdprint E ao painel PCP (Kanban) externo com dados de produção.
Ao receber perguntas sobre ocorrências, reclamações ou histórico de clientes, USE os dados de tickets, touchpoints e visitas técnicas fornecidos abaixo.
Quando perguntarem sobre PCP, produção, etapas de fabricação ou status de jobs no kanban, USE os dados do PCP Kanban fornecidos.
Quando um cliente reporta um problema, analise o histórico de tickets, jobs E status no PCP para identificar padrões e sugerir ações.`,

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

## ACESSO COMPLETO À HOLDPRINT (ERP)
Você tem acesso direto a todos os dados do sistema Holdprint (api.holdworks.ai) para ambas as unidades (POA e SP):
- **Processos (Jobs)**: Todos os jobs de produção com status, etapa atual, progresso, cliente, custos (orçado vs realizado), prazos de entrega e finalização. Use para análise de produtividade, gargalos, atrasos e eficiência operacional.
- **Clientes (Customers)**: Base completa de clientes com dados de contato, endereços, status (ativo/inativo), limite de crédito. Use para análise de carteira, segmentação e oportunidades de cross-sell.
- **Oportunidades (Budgets)**: Pipeline de orçamentos com estados (Aberto, Enviado, Ganho, Perdido), valores das propostas, itens, margem de lucro e taxa de conversão. Use para previsão de receita, análise de pipeline e desempenho comercial.
- **Receitas (Incomes)**: Contas a receber, valores faturados, status de pagamento e inadimplência.
- **Despesas (Expenses)**: Contas a pagar, fornecedores, categorias de custo e fluxo de caixa.
- **Fornecedores (Suppliers)**: Base de fornecedores com categorias e dados de contato.

## ACESSO COMPLETO AO MÓDULO CS (Customer Success)
Você tem acesso aos dados de pós-venda e relacionamento com clientes:
- **Tickets CS**: Reclamações, solicitações e chamados com SLA, prioridade, status, categoria e pesquisa de satisfação.
- **Visitas Técnicas**: Agendamento, execução e relatórios de visitas a clientes.
- **Touchpoints**: Régua de relacionamento com histórico de interações (reuniões, ligações, e-mails).
- **Oportunidades CS**: Leads de upsell, cross-sell e retenção com valores estimados.
- **PCP Kanban**: Painel de produção externo com status de fabricação em tempo real.

## INSTRUÇÕES DE ANÁLISE
Ao responder, você DEVE:
1. Cruzar dados entre Holdprint, CS e dados internos para fornecer insights 360°
2. Quando perguntarem sobre um cliente, buscar dados em TODAS as fontes: jobs, orçamentos, tickets, visitas, touchpoints
3. Para análise comercial, combinar pipeline de orçamentos com histórico de jobs e receitas
4. Para análise operacional, cruzar jobs com tickets CS para identificar problemas de qualidade
5. Para análise financeira, cruzar receitas, despesas e orçamentos para projeções
6. Sempre citar números específicos e fontes dos dados
7. Fornecer insights acionáveis com KPIs concretos`,
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

// Fire-and-forget sync (non-blocking) — limited to 5 pages max to avoid timeout
async function syncHoldprintLightweight(endpoints: string[]): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;

  const sb = createClient(supabaseUrl, serviceKey);

  const UNITS = [
    { key: "poa", label: "Porto Alegre", envVar: "HOLDPRINT_TOKEN_POA" },
    { key: "sp", label: "São Paulo", envVar: "HOLDPRINT_TOKEN_SP" },
  ];

  const MAX_PAGES = 3;
  const PAGE_SIZE = 50;

  for (const unit of UNITS) {
    const token = Deno.env.get(unit.envVar);
    if (!token) continue;

    for (const endpoint of endpoints) {
      const config = ENDPOINT_CONFIG[endpoint];
      if (!config) continue;

      const allItems: Record<string, unknown>[] = [];
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = new URL(`${HOLDPRINT_BASE}${config.path}`);
        url.searchParams.set(config.pageParam, String(page));
        url.searchParams.set(config.limitParam, String(PAGE_SIZE));
        url.searchParams.set("language", "pt-BR");

        if (config.dateFilters) {
          const now = new Date();
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          const fmt = (d: Date) => d.toISOString().split("T")[0];
          const sk = endpoint === "expenses" || endpoint === "incomes" ? "start_date" : "startDate";
          const ek = endpoint === "expenses" || endpoint === "incomes" ? "end_date" : "endDate";
          url.searchParams.set(sk, fmt(threeMonthsAgo));
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
          if (items.length < PAGE_SIZE) break;
        } catch { break; }
      }

      if (allItems.length === 0) continue;

      const buildText = (item: Record<string, unknown>): string => {
        switch (endpoint) {
          case "customers": return `Cliente: ${item.name || item.fantasyName || "?"} | CNPJ: ${item.cnpj || "N/A"}`;
          case "suppliers": return `Fornecedor: ${item.name || "?"} | Categoria: ${item.category || "N/A"}`;
          case "budgets": return `Orçamento #${item.id || "?"} | Estado: ${item.budgetState || item.state || "?"}`;
          case "jobs": return `Job #${item.id || "?"} | ${item.title || item.description || "?"} | Cliente: ${(item as any).customerName || "?"} | Status: ${item.productionStatus || item.status || "?"}`;
          case "expenses": return `Despesa #${item.id || "?"} | Valor: R$${item.amount || item.value || 0}`;
          case "incomes": return `Receita #${item.id || "?"} | Valor: R$${item.amount || item.value || 0}`;
          default: return JSON.stringify(item).slice(0, 200);
        }
      };

      const extractId = (item: Record<string, unknown>) =>
        String(item.id || item.Id || item.ID || item.code || crypto.randomUUID());

      // Upsert rag_documents only (skip cache for speed)
      const ragRows = allItems.map((item) => {
        const rid = `${unit.key}_${extractId(item)}`;
        return {
          content: `[${unit.label}] ${buildText(item)}\n\nDados: ${JSON.stringify(item).slice(0, 2000)}`,
          sector: endpoint,
          source_type: "holdprint",
          original_filename: `holdprint_${unit.key}_${endpoint}_${rid}`,
          metadata: { endpoint, unit: unit.key, record_id: rid, synced_at: new Date().toISOString() },
        };
      });

      for (let i = 0; i < ragRows.length; i += 100) {
        const batch = ragRows.slice(i, i + 100);
        await sb.from("rag_documents").upsert(batch, { onConflict: "original_filename" }).then(({ error }) => {
          if (error) console.error(`[sync-light] ${unit.key}/${endpoint} rag error:`, error.message);
        });
      }

      console.log(`[sync-light] ${unit.key}/${endpoint}: ${allItems.length} registros`);
    }
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
    const { messages, sector, provider: reqProvider } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Campo 'messages' é obrigatório" }, 400);
    }

    const provider = reqProvider || "gemini";
    const providerCfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.gemini;
    const apiKey = Deno.env.get(providerCfg.envKey);
    if (!apiKey) throw new Error(`${providerCfg.envKey} não configurada`);

    const holdprintKey = Deno.env.get("HOLDPRINT_API_KEY");

    const sectorPrompt = SECTOR_PROMPTS[sector] || SECTOR_PROMPTS.orquestrador;
    const endpoints = SECTOR_ENDPOINTS[sector] || [];

    const isOrquestrador = sector === "orquestrador";

    // Fire-and-forget sync — DO NOT await (prevents timeout)
    if (endpoints.length > 0) {
      syncHoldprintLightweight(endpoints).catch((e) => console.error("[sync-bg] error:", e));
    }

    // Fetch all context data in parallel (these are fast queries)
    const [holdprintContext, ragContext, csContext, internalDbContext, pcpContext] = await Promise.all([
      (async () => {
        if (!holdprintKey) return "\n\n⚠️ API Holdprint não configurada. Respondendo com base no conhecimento geral e dados do RAG.";
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
      fetchCSTickets(sector),
      isOrquestrador ? fetchInternalDB() : Promise.resolve(""),
      fetchPCPKanban(sector),
    ]);

    const systemContent = `${sectorPrompt}\n${BASE_RULES}${holdprintContext}${ragContext}${csContext}${internalDbContext}${pcpContext}`;

    // Claude uses a different API format
    if (provider === "claude") {
      const claudeMsgs = messages.filter((m: { role: string }) => m.role !== "system").map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
      const response = await fetch(providerCfg.url, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: providerCfg.model, max_tokens: 4096, system: systemContent, messages: claudeMsgs, stream: true }),
      });
      if (!response.ok) {
        if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
        const t = await response.text();
        console.error("[sector-agent] Claude error:", response.status, t);
        throw new Error("Erro ao comunicar com o agente Claude");
      }
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // OpenAI-compatible (Gemini, OpenAI, Perplexity)
    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.filter((m: { role: string }) => m.role !== "system"),
    ];

    const response = await fetch(providerCfg.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: providerCfg.model, max_tokens: 4096, messages: apiMessages, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Limite de requisições excedido." }, 429);
      const t = await response.text();
      console.error(`[sector-agent] ${provider} error:`, response.status, t);
      throw new Error(`Erro ao comunicar com o agente ${provider}`);
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
