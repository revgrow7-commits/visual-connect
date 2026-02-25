import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getTeamFromStep(stepName: string): string {
  const s = (stepName || "").toLowerCase();
  if (s.includes("arte") || s.includes("projeto") || s.includes("design") || s.includes("revisão comercial")) return "Projetos";
  if (s.includes("impressão") || s.includes("impres") || s.includes("produção")) return "Impressão";
  if (s.includes("acabamento") || s.includes("corte") || s.includes("solda")) return "Acabamento";
  if (s.includes("instalação") || s.includes("instal")) return "Instalação";
  if (s.includes("logística") || s.includes("entrega") || s.includes("expedição")) return "Logística";
  if (s.includes("faturamento") || s.includes("financeiro")) return "Faturamento";
  return "Gerenciamento";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const now = Date.now();
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now - ONE_WEEK_MS).toISOString();

    // 1. Get already archived job IDs
    const { data: existingArchives } = await supabase.from("job_archives").select("job_id");
    const archivedSet = new Set((existingArchives || []).map((a: any) => String(a.job_id)));

    // 2. Get jobs older than 2 weeks from cache — archive them
    // Use pagination to handle large volumes
    let archivedCount = 0;
    let offset = 0;
    const batchSize = 200;

    while (true) {
      const { data: oldJobs, error } = await supabase
        .from("holdprint_cache")
        .select("record_id, raw_data")
        .eq("endpoint", "jobs")
        .range(offset, offset + batchSize - 1);

      if (error || !oldJobs || oldJobs.length === 0) break;

      const toArchive = oldJobs.filter((row: any) => {
        const createdAt = row.raw_data?.creationTime || row.raw_data?.createdAt || "";
        const id = row.raw_data?.id || row.record_id?.replace(/^(poa|sp)_/, "");
        return createdAt < twoWeeksAgo && !archivedSet.has(String(id));
      });

      if (toArchive.length > 0) {
        const archiveRows = toArchive.map((row: any) => {
          const job = row.raw_data;
          const id = String(job?.id || row.record_id?.replace(/^(poa|sp)_/, ""));
          return {
            job_id: id,
            job_code: job?.code || null,
            job_title: (job?.title || "").substring(0, 200),
            customer_name: (job?.customerName || "").substring(0, 200),
            reason: "Arquivamento automático — job com mais de 2 semanas",
            archived_by: "🤖 Agente PCP",
          };
        });

        // Insert in sub-batches of 50
        for (let i = 0; i < archiveRows.length; i += 50) {
          const batch = archiveRows.slice(i, i + 50);
          const { error: insErr } = await supabase.from("job_archives").insert(batch as any);
          if (!insErr) {
            archivedCount += batch.length;
            batch.forEach(b => archivedSet.add(b.job_id));
          } else {
            console.error("Archive insert error:", insErr.message);
          }
        }
      }

      if (oldJobs.length < batchSize) break;
      offset += batchSize;
    }

    // 3. Get active jobs (1+ week, not finalized) for task distribution
    const { data: activeRows } = await supabase
      .from("holdprint_cache")
      .select("record_id, raw_data")
      .eq("endpoint", "jobs");

    const activeJobs = (activeRows || []).filter((row: any) => {
      const job = row.raw_data;
      const createdAt = job?.creationTime || job?.createdAt || "";
      const id = String(job?.id || row.record_id?.replace(/^(poa|sp)_/, ""));
      const isFinalized = job?.isFinalized === true;
      return createdAt >= twoWeeksAgo && !isFinalized && !archivedSet.has(id);
    });

    // 4. Create tasks for active jobs that don't have tasks yet
    const activeIds = activeJobs.map(r => String(r.raw_data?.id || r.record_id?.replace(/^(poa|sp)_/, "")));
    const { data: existingTasks } = await supabase
      .from("job_tasks")
      .select("job_id")
      .in("job_id", activeIds.length > 0 ? activeIds : ["__none__"]);
    const jobsWithTasks = new Set((existingTasks || []).map((t: any) => t.job_id));

    let tasksCreated = 0;
    const taskJobCodes: string[] = [];

    for (const row of activeJobs) {
      const job = row.raw_data;
      const jobId = String(job?.id || row.record_id?.replace(/^(poa|sp)_/, ""));
      if (jobsWithTasks.has(jobId)) continue;

      const team = getTeamFromStep(job?.currentProductionStepName || "");
      const title = (job?.title || "").substring(0, 100);
      const customer = (job?.customerName || "").substring(0, 100);
      const deliveryDate = job?.deliveryNeeded || job?.deliveryExpected;
      const isUrgent = deliveryDate && new Date(deliveryDate) < new Date(now + ONE_WEEK_MS);

      const tasks = [
        {
          job_id: jobId,
          titulo: `Verificar materiais — ${title}`,
          descricao: `Cliente: ${customer}. Conferir insumos.`,
          prioridade: "media",
          status: "pendente",
          template_origem: "auto_distribuicao",
        },
        {
          job_id: jobId,
          titulo: `Produção ${team} — ${title}`,
          descricao: `Executar etapa ${team}. Cliente: ${customer}.`,
          prioridade: isUrgent ? "alta" : "media",
          status: "pendente",
          template_origem: "auto_distribuicao",
        },
        {
          job_id: jobId,
          titulo: `QC e entrega — ${title}`,
          descricao: `Controle de qualidade e preparação para entrega. Cliente: ${customer}.`,
          prioridade: "media",
          status: "pendente",
          template_origem: "auto_distribuicao",
        },
      ];

      const { error: taskErr } = await supabase.from("job_tasks").insert(tasks as any);
      if (!taskErr) {
        tasksCreated += 3;
        taskJobCodes.push(`J${job?.code || "?"}`);
      }
    }

    // 5. Log
    await supabase.from("agent_actions_log").insert({
      tipo_rotina: "batch_archive_distribute",
      acao_tomada: `Arquivados ${archivedCount} jobs (>2 sem). ${tasksCreated} tarefas para ${taskJobCodes.length} jobs ativos.`,
      resultado: "ok",
    });

    return new Response(JSON.stringify({
      arquivados: archivedCount,
      jobs_ativos_mantidos: activeJobs.length,
      tarefas_criadas: tasksCreated,
      jobs_com_novas_tarefas: taskJobCodes,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("batch-archive-distribute error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
