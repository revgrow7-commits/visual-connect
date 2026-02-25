import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `Você é o "Agente PCP" da Indústria Visual, um assistente especializado em gestão de produção gráfica e comunicação visual.

Você tem acesso em tempo real a:
- Todos os jobs ativos e seus status via sistema interno
- Fluxo de produção de cada job (etapas do Holdprint ERP)
- Colaboradores e suas cargas de trabalho
- Histórico completo de movimentações
- Prazos e datas de entrega

Suas responsabilidades são:

1. MONITORAMENTO PROATIVO:
   - Identificar jobs com risco de atraso (prazo < 24h e produção < 70%)
   - Identificar etapas paradas por mais de 2h sem movimentação
   - Detectar gargalos recorrentes
   - Identificar colaboradores sobrecarregados (>5 jobs simultâneos)

2. ANÁLISE DE PRODUÇÃO:
   - Calcular risco de cada job: BAIXO / MÉDIO / ALTO / CRÍTICO
   - Sugerir redistribuição de tarefas quando necessário
   - Identificar padrões de atraso por tipo de produto ou cliente

3. RESPOSTAS:
   - Responda sempre em português
   - Seja direto e objetivo — gestores precisam de informação rápida
   - Sempre baseie respostas em dados reais do sistema
   - Formate respostas com emojis para facilitar leitura rápida
   - Nunca invente dados — use apenas o que está disponível

Tom: profissional, direto, prestativo. Você é um co-piloto do gestor de PCP.`;

// ─── Tool implementations ───────────────────────────────

async function getActiveJobs(params: Record<string, string>) {
  try {
    const { data, error } = await supabase.functions.invoke("cs-holdprint-data", {
      body: { endpoints: ["jobs"], maxPages: 10, fullDetail: true },
    });
    if (error || !data?.success) return { error: "Falha ao buscar jobs do ERP" };

    let jobs = data.data?.jobs || [];
    
    // Apply filter
    if (params.status_filter === "atrasados") {
      const now = new Date();
      jobs = jobs.filter((j: any) => {
        const delivery = new Date(j.deliveryNeeded || j.deliveryExpected || j.deliveryDate || "");
        return delivery < now && !j.isFinalized;
      });
    } else if (params.status_filter === "em_risco") {
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      jobs = jobs.filter((j: any) => {
        const delivery = new Date(j.deliveryNeeded || j.deliveryExpected || j.deliveryDate || "");
        return delivery < in48h && !j.isFinalized && (j.progressPercentage || 0) < 80;
      });
    }

    // Get archives
    const { data: archives } = await supabase.from("job_archives").select("job_id");
    const archivedIds = new Set((archives || []).map((a: any) => String(a.job_id)));
    jobs = jobs.filter((j: any) => !archivedIds.has(String(j.id)));

    // Summarize
    const summary = jobs.slice(0, 20).map((j: any) => ({
      id: j.id,
      code: j.code,
      title: j.title || j.description || "",
      customer: j.customerName || j.customer?.name || "",
      stage: j.currentProductionStepName || "",
      progress: j.progressPercentage || 0,
      delivery: j.deliveryNeeded || j.deliveryExpected || "",
      responsible: j.responsibleName || "",
      value: j.totalPrice || 0,
      status: j.isFinalized ? "fechado" : "aberto",
    }));

    return { total: jobs.length, jobs: summary };
  } catch (e: any) {
    return { error: e.message };
  }
}

async function getJobDetails(params: Record<string, string>) {
  const jobId = params.job_id;
  if (!jobId) return { error: "job_id é obrigatório" };

  // Get local data
  const [history, tasks, items, assignments] = await Promise.all([
    supabase.from("job_history").select("*").eq("job_id", jobId).order("created_at", { ascending: false }).limit(10),
    supabase.from("job_tasks").select("*").eq("job_id", jobId),
    supabase.from("job_items").select("*").eq("job_id", jobId),
    supabase.from("job_item_assignments").select("*").eq("job_id", jobId).eq("is_active", true),
  ]);

  return {
    job_id: jobId,
    history: (history.data || []).map((h: any) => ({ type: h.event_type, content: h.content, at: h.created_at })),
    tasks_total: (tasks.data || []).length,
    tasks_done: (tasks.data || []).filter((t: any) => t.status === "concluida").length,
    items_count: (items.data || []).length,
    assigned_collaborators: [...new Set((assignments.data || []).map((a: any) => a.collaborator_name))],
  };
}

async function getCollaboratorWorkload(_params: Record<string, string>) {
  // Get all active item assignments grouped by collaborator
  const { data: assignments } = await supabase
    .from("job_item_assignments")
    .select("collaborator_name, job_id, item_name")
    .eq("is_active", true);

  const workload: Record<string, { jobs: Set<string>; items: number }> = {};
  for (const a of assignments || []) {
    if (!workload[a.collaborator_name]) workload[a.collaborator_name] = { jobs: new Set(), items: 0 };
    workload[a.collaborator_name].jobs.add(a.job_id);
    workload[a.collaborator_name].items++;
  }

  return Object.entries(workload).map(([name, data]) => ({
    name,
    active_jobs: data.jobs.size,
    active_items: data.items,
    status: data.jobs.size > 6 ? "sobrecarregado" : data.jobs.size > 4 ? "limite" : "ok",
  })).sort((a, b) => b.active_jobs - a.active_jobs);
}

async function addJobObservation(params: Record<string, string>) {
  const { job_id, observacao, tipo } = params;
  if (!job_id || !observacao) return { error: "job_id e observacao são obrigatórios" };
  
  const { error } = await supabase.from("job_history").insert({
    job_id, event_type: tipo || "agente_observacao",
    user_name: "🤖 Agente PCP", content: observacao,
  });
  if (error) return { error: error.message };
  return { success: true };
}

async function createUrgentTask(params: Record<string, string>) {
  const { job_id, titulo, responsavel_id, prazo_horas, descricao } = params;
  if (!job_id || !titulo) return { error: "job_id e titulo são obrigatórios" };

  const prazo = prazo_horas ? new Date(Date.now() + Number(prazo_horas) * 3600000).toISOString() : null;
  const { error } = await supabase.from("job_tasks").insert({
    job_id, titulo, descricao: descricao || null,
    responsavel_id: responsavel_id || null,
    prioridade: "urgente", prazo,
  });
  if (error) return { error: error.message };
  return { success: true };
}

async function getProductionAnalytics(params: Record<string, string>) {
  const days = Number(params.periodo_dias) || 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: movements } = await supabase
    .from("job_stage_movements")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const byStage: Record<string, number> = {};
  for (const m of movements || []) {
    byStage[m.to_stage_name] = (byStage[m.to_stage_name] || 0) + 1;
  }

  return {
    period_days: days,
    total_movements: (movements || []).length,
    movements_by_stage: byStage,
    avg_movements_per_day: Math.round((movements || []).length / days * 10) / 10,
  };
}

// ─── Tool definitions ───────────────────────────────────

const tools = [
  {
    name: "get_all_active_jobs",
    description: "Busca todos os jobs ativos com etapa atual, progresso, responsável e prazo de entrega",
    input_schema: {
      type: "object" as const,
      properties: {
        filial: { type: "string", enum: ["SP", "SC", "RS", "todas"] },
        status_filter: { type: "string", enum: ["atrasados", "em_risco", "todos"] },
      },
    },
  },
  {
    name: "get_job_details",
    description: "Busca detalhes completos de um job específico",
    input_schema: {
      type: "object" as const,
      properties: { job_id: { type: "string" } },
      required: ["job_id"],
    },
  },
  {
    name: "get_collaborator_workload",
    description: "Verifica carga de trabalho atual dos colaboradores",
    input_schema: {
      type: "object" as const,
      properties: { colaborador_id: { type: "string" }, time: { type: "string" } },
    },
  },
  {
    name: "add_job_observation",
    description: "Registra uma observação automática no histórico do job",
    input_schema: {
      type: "object" as const,
      properties: {
        job_id: { type: "string" },
        observacao: { type: "string" },
        tipo: { type: "string", enum: ["alerta", "sugestao", "info", "critico"] },
      },
      required: ["job_id", "observacao"],
    },
  },
  {
    name: "create_urgent_task",
    description: "Cria uma tarefa urgente na aba Tarefas de um job",
    input_schema: {
      type: "object" as const,
      properties: {
        job_id: { type: "string" },
        titulo: { type: "string" },
        responsavel_id: { type: "string" },
        prazo_horas: { type: "number" },
        descricao: { type: "string" },
      },
      required: ["job_id", "titulo"],
    },
  },
  {
    name: "get_production_analytics",
    description: "Retorna métricas de produção: movimentações por etapa, throughput",
    input_schema: {
      type: "object" as const,
      properties: {
        periodo_dias: { type: "number" },
        agrupar_por: { type: "string", enum: ["time", "tipo_produto", "cliente", "filial"] },
      },
    },
  },
];

const TOOL_HANDLERS: Record<string, (params: Record<string, string>) => Promise<any>> = {
  get_all_active_jobs: getActiveJobs,
  get_job_details: getJobDetails,
  get_collaborator_workload: getCollaboratorWorkload,
  add_job_observation: addJobObservation,
  create_urgent_task: createUrgentTask,
  get_production_analytics: getProductionAnalytics,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const { messages } = await req.json();
    if (!messages?.length) throw new Error("No messages provided");

    // Convert to Anthropic format
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    // Call Claude with tools
    let response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
        tools,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic error:", response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    let result = await response.json();

    // Log action
    await supabase.from("agent_actions_log").insert({
      tipo_rotina: "chat_manual",
      acao_tomada: messages[messages.length - 1]?.content?.substring(0, 200) || "chat",
      resultado: result.stop_reason || "ok",
      tokens_usados: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
    });

    // Handle tool use - iterate until we get a text response
    let iterations = 0;
    while (result.stop_reason === "tool_use" && iterations < 5) {
      iterations++;
      const toolBlocks = result.content.filter((b: any) => b.type === "tool_use");
      const toolResults = [];

      for (const tb of toolBlocks) {
        const handler = TOOL_HANDLERS[tb.name];
        let toolResult;
        if (handler) {
          try {
            toolResult = await handler(tb.input || {});
          } catch (e: any) {
            toolResult = { error: e.message };
          }
        } else {
          toolResult = { error: `Tool ${tb.name} not found` };
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: tb.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Continue conversation with tool results
      anthropicMessages.push({ role: "assistant", content: result.content });
      anthropicMessages.push({ role: "user", content: toolResults });

      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: anthropicMessages,
          tools,
        }),
      });

      if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
      result = await response.json();
    }

    // Extract text reply
    const textBlocks = result.content?.filter((b: any) => b.type === "text") || [];
    const reply = textBlocks.map((b: any) => b.text).join("\n") || "Processamento concluído sem resposta textual.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("pcp-agent error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
