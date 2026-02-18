import type { CSAlert, CSTask, Playbook, CSWorkspaceCustomer } from "./types";

export const mockAlerts: CSAlert[] = [
  { id: "a1", type: "sla_breach", severity: "critical", title: "SLA Estourado", description: "Reclamação RCL-006 sem resolução há 5 dias. Prazo era 24h.", customerName: "Padaria Pão Quente", timestamp: "2026-02-18T08:00:00Z", actionLabel: "Ver reclamação", actionTarget: "tickets", dismissed: false },
  { id: "a2", type: "health_drop", severity: "high", title: "Health Score Caiu", description: "Score caiu de 70 → 42 nos últimos 30 dias. Risco de churn.", customerName: "TechStore Eletrônicos", timestamp: "2026-02-18T06:00:00Z", actionLabel: "Ver cliente", actionTarget: "health", dismissed: false },
  { id: "a3", type: "warranty_expiring", severity: "medium", title: "5 Garantias Expirando", description: "Garantias vencem nos próximos 30 dias — oportunidade de contrato.", customerName: "Diversos", timestamp: "2026-02-17T07:00:00Z", actionLabel: "Ver garantias", actionTarget: "entregas", dismissed: false },
  { id: "a4", type: "nps_detractor", severity: "high", title: "2 Novos Detratores NPS", description: "Restaurante Sabor & Arte (NPS 4) e Padaria Pão Quente (NPS 2).", customerName: "2 clientes", timestamp: "2026-02-17T14:00:00Z", actionLabel: "Ver detratores", actionTarget: "clientes", dismissed: false },
];

export const mockTasks: CSTask[] = [
  { id: "t1", title: "Ligar para Patrícia Lima — follow-up recompra", type: "call", customerName: "Lojas Renner SA", dueTime: "09:00", priority: "high", completed: false, linkedTo: "OPP-002" },
  { id: "t2", title: "Enviar pesquisa NPS — Job #1236 entregue", type: "email", customerName: "TransLog Logística SA", dueTime: "10:00", priority: "medium", completed: false, linkedTo: "Job #1236" },
  { id: "t3", title: "Visita técnica — treinamento software LED", type: "visit", customerName: "AutoMax Concessionária", dueTime: "14:00", priority: "high", completed: false, linkedTo: "VT-001" },
  { id: "t4", title: "Revisar laudo visita CentroPark", type: "review", customerName: "Estacionamento CentroPark", dueTime: "16:00", priority: "low", completed: true, linkedTo: "VT-004" },
  { id: "t5", title: "Follow-up resolução reclamação bolhas", type: "followup", customerName: "Lojas Renner SA", dueTime: "17:00", priority: "medium", completed: false, linkedTo: "RCL-002" },
];

export const mockPlaybooks: Playbook[] = [
  {
    id: "pb-001", name: "🚨 Recuperação Cliente em Risco",
    trigger: "Health Score < 50 ou NPS ≤ 6", category: "recovery",
    estimatedTime: "45 min", stepsCount: 5, successMetric: "Health Score ≥ 60 em 30 dias",
    steps: [
      { order: 1, title: "Preparação", type: "checklist", content: "Antes de ligar, revise:", fields: [
        { label: "Revisei histórico de jobs", type: "select", options: ["Sim", "Não"], required: true },
        { label: "Revisei reclamações abertas", type: "select", options: ["Sim", "Não"], required: true },
        { label: "Revisei último NPS/feedback", type: "select", options: ["Sim", "Não"], required: true },
      ]},
      { order: 2, title: "Contato Inicial", type: "action", content: "Ligar para o contato principal. Objetivo: entender a insatisfação sem ser defensivo." },
      { order: 3, title: "Diagnóstico", type: "question", content: "Perguntar ao cliente:", fields: [
        { label: "Qual sua maior frustração?", type: "textarea", required: true },
        { label: "O que podemos fazer para melhorar?", type: "textarea", required: true },
        { label: "Nota 1-10, probabilidade de recomendar?", type: "rating", required: true },
      ]},
      { order: 4, title: "Plano de Ação", type: "note", content: "Definir plano:", fields: [
        { label: "Ação imediata (24h)", type: "textarea", required: true },
        { label: "Ação curto prazo (7d)", type: "textarea", required: false },
        { label: "Responsável", type: "text", required: true },
      ]},
      { order: 5, title: "Follow-up", type: "action", content: "Agendar follow-up em 7 dias." },
    ],
  },
  {
    id: "pb-002", name: "🔄 Renovação & Recompra",
    trigger: "60+ dias sem pedido ou garantia expirando", category: "retention",
    estimatedTime: "30 min", stepsCount: 4, successMetric: "Novo orçamento em 15 dias",
    steps: [
      { order: 1, title: "Contexto", type: "checklist", content: "Preparar:", fields: [
        { label: "Último job realizado", type: "text", required: false },
        { label: "Valor acumulado", type: "text", required: false },
        { label: "Oportunidades identificadas", type: "textarea", required: false },
      ]},
      { order: 2, title: "Abordagem", type: "action", content: "Ligar com tom de relacionamento. Perguntar como estão os materiais entregues." },
      { order: 3, title: "Identificar Necessidade", type: "question", content: "Explorar:", fields: [
        { label: "Planejam algum projeto?", type: "textarea", required: true },
        { label: "Material precisa manutenção?", type: "textarea", required: true },
        { label: "Interesse em contrato recorrente?", type: "select", options: ["Muito interesse", "Talvez", "Sem interesse"], required: true },
      ]},
      { order: 4, title: "Próximos Passos", type: "note", content: "Registrar:", fields: [
        { label: "Resultado", type: "select", options: ["Orçamento solicitado", "Agendar reunião", "Sem interesse", "Ligar em 30d"], required: true },
        { label: "Observações", type: "textarea", required: false },
      ]},
    ],
  },
  {
    id: "pb-003", name: "📦 Pós-Entrega (D+3)",
    trigger: "3 dias após entrega de job", category: "onboarding",
    estimatedTime: "15 min", stepsCount: 4, successMetric: "NPS coletado + satisfação ≥ 4/5",
    steps: [
      { order: 1, title: "Contato", type: "action", content: "Ligar para verificar satisfação da entrega." },
      { order: 2, title: "Checklist Qualidade", type: "question", content: "", fields: [
        { label: "Material conforme esperado?", type: "select", options: ["Sim, perfeito", "Com ressalvas", "Não"], required: true },
        { label: "Instalação OK?", type: "select", options: ["Sim", "Pendente", "Problemas", "N/A"], required: true },
        { label: "Nota geral (1-5)", type: "rating", required: true },
        { label: "Feedback aberto", type: "textarea", required: false },
      ]},
      { order: 3, title: "Enviar NPS", type: "action", content: "Enviar pesquisa NPS por email/WhatsApp." },
      { order: 4, title: "Registro", type: "note", content: "Documentar:", fields: [
        { label: "Satisfação geral", type: "select", options: ["Muito satisfeito", "Satisfeito", "Neutro", "Insatisfeito"], required: true },
        { label: "Necessita follow-up?", type: "select", options: ["Não", "Sim - visita", "Sim - material", "Sim - reclamação"], required: true },
      ]},
    ],
  },
  {
    id: "pb-004", name: "💎 Upsell & Cross-sell",
    trigger: "HS ≥ 80 + NPS ≥ 9 + último job < 30d", category: "growth",
    estimatedTime: "30 min", stepsCount: 3, successMetric: "Orçamento de upsell gerado",
    steps: [
      { order: 1, title: "Identificar Oportunidade", type: "checklist", content: "", fields: [
        { label: "Serviços já usados", type: "textarea", required: false },
        { label: "Serviços nunca usados (cross-sell)", type: "textarea", required: false },
        { label: "Upgrades possíveis (upsell)", type: "textarea", required: false },
      ]},
      { order: 2, title: "Abordagem de Valor", type: "action", content: "Apresentar oportunidade focando em resultados. Usar cases de sucesso." },
      { order: 3, title: "Registro", type: "note", content: "", fields: [
        { label: "Oportunidade apresentada", type: "textarea", required: true },
        { label: "Valor estimado", type: "text", required: true },
        { label: "Interesse", type: "select", options: ["Quer orçamento", "Interessado", "Não agora", "Sem interesse"], required: true },
      ]},
    ],
  },
];

export const mockWSCustomers: CSWorkspaceCustomer[] = [
  { id: 791, name: "TransLog Logística SA", document: "33.444.555/0001-22", contact_person: "Ricardo Mendes", phone: "(51) 3111-6666", email: "ricardo@translog.com.br", healthScore: 96, previousScore: 94, trend: "up", npsScore: 10, npsCategory: "promoter", totalJobs: 8, totalRevenue: 185000, openComplaints: 0, lastJobDate: "2026-02-14", csmName: "Carlos Almeida", riskLevel: "none", frequency: "mensal" },
  { id: 794, name: "Banco XP Eventos", document: "66.777.888/0001-44", contact_person: "Camila Rodrigues", phone: "(11) 5555-9999", email: "eventos@xp.com.br", healthScore: 92, previousScore: 90, trend: "up", npsScore: 10, npsCategory: "promoter", totalJobs: 4, totalRevenue: 52800, openComplaints: 0, lastJobDate: "2026-02-11", csmName: "Roberto Lima", riskLevel: "none", frequency: "trimestral" },
  { id: 800, name: "Hospital São Lucas PUCRS", document: "88.999.000/0001-11", contact_person: "Dr. André Campos", phone: "(51) 3320-3000", email: "infra@saolucas.pucrs.br", healthScore: 85, previousScore: 85, trend: "stable", npsScore: 10, npsCategory: "promoter", totalJobs: 3, totalRevenue: 68500, openComplaints: 0, lastJobDate: "2026-01-29", csmName: "Carlos Almeida", riskLevel: "none", frequency: "semestral" },
  { id: 789, name: "Premium Varejo LTDA", document: "12.345.678/0001-99", contact_person: "Marcos Oliveira", phone: "(51) 3333-4444", email: "marcos@premiumvarejo.com.br", healthScore: 78, previousScore: 75, trend: "up", npsScore: 8, npsCategory: "passive", totalJobs: 5, totalRevenue: 142000, openComplaints: 0, lastJobDate: "2026-02-05", csmName: "Ana Paula Ferreira", riskLevel: "low", frequency: "trimestral" },
  { id: 810, name: "Café Aroma", document: "55.666.777/0001-33", contact_person: "Marina Costa", phone: "(51) 3444-2222", email: "contato@cafearoma.com.br", healthScore: 75, previousScore: 73, trend: "up", npsScore: 9, npsCategory: "promoter", totalJobs: 2, totalRevenue: 28000, openComplaints: 0, lastJobDate: "2026-01-20", csmName: "Roberto Lima", riskLevel: "none", frequency: "anual" },
  { id: 811, name: "Estacionamento CentroPark", document: "44.555.666/0001-22", contact_person: "Jorge Nascimento", phone: "(51) 3555-3333", email: "adm@centropark.com.br", healthScore: 72, previousScore: 70, trend: "up", npsScore: 8, npsCategory: "passive", totalJobs: 2, totalRevenue: 22000, openComplaints: 0, lastJobDate: "2025-10-15", csmName: "João Silva", riskLevel: "low", frequency: "anual" },
  { id: 812, name: "Imobiliária Morada", document: "33.444.555/0001-44", contact_person: "Fernanda Alves", phone: "(51) 3666-4444", email: "marketing@morada.com.br", healthScore: 70, previousScore: 70, trend: "stable", npsScore: 7, npsCategory: "passive", totalJobs: 2, totalRevenue: 35000, openComplaints: 0, lastJobDate: "2025-06-10", csmName: "Ana Paula Ferreira", riskLevel: "low", frequency: "anual" },
  { id: 801, name: "AutoMax Concessionária", document: "11.222.333/0001-99", contact_person: "Gustavo Pereira", phone: "(51) 3222-8888", email: "marketing@automax.com.br", healthScore: 62, previousScore: 70, trend: "down", npsScore: 8, npsCategory: "passive", totalJobs: 2, totalRevenue: 72000, openComplaints: 1, lastJobDate: "2026-02-10", csmName: "Maria Santos", riskLevel: "medium", frequency: "semestral" },
  { id: 795, name: "Lojas Renner SA", document: "44.555.666/0001-88", contact_person: "Patrícia Lima", phone: "(51) 3666-1111", email: "trade-marketing@lojasrenner.com.br", healthScore: 55, previousScore: 60, trend: "down", npsScore: 6, npsCategory: "detractor", totalJobs: 6, totalRevenue: 98000, openComplaints: 0, lastJobDate: "2025-12-03", csmName: "Ana Paula Ferreira", riskLevel: "medium", frequency: "trimestral" },
  { id: 802, name: "TechStore Eletrônicos LTDA", document: "22.333.444/0001-55", contact_person: "Fernando Azevedo", phone: "(51) 3444-5555", email: "expansao@techstore.com.br", healthScore: 42, previousScore: 45, trend: "down", npsScore: 5, npsCategory: "detractor", totalJobs: 1, totalRevenue: 38500, openComplaints: 0, lastJobDate: "2026-01-25", csmName: "João Silva", riskLevel: "high", frequency: "anual" },
  { id: 803, name: "Restaurante Sabor & Arte", document: "77.888.999/0001-44", contact_person: "Chef Alexandre", phone: "(51) 3555-7777", email: "contato@saborarte.com.br", healthScore: 28, previousScore: 35, trend: "down", npsScore: 4, npsCategory: "detractor", totalJobs: 1, totalRevenue: 15200, openComplaints: 1, lastJobDate: "2026-02-05", csmName: "Carlos Almeida", riskLevel: "critical", frequency: "unico" },
  { id: 804, name: "Padaria Pão Quente", document: "33.444.555/0001-66", contact_person: "Sr. Antônio", phone: "(51) 3666-8888", email: "contato@paoquente.com.br", healthScore: 15, previousScore: 20, trend: "down", npsScore: 2, npsCategory: "detractor", totalJobs: 1, totalRevenue: 12800, openComplaints: 1, lastJobDate: "2026-02-06", csmName: "Maria Santos", riskLevel: "critical", frequency: "unico" },
];

export const revenueMonthlyData = [
  { month: "Mar/25", revenue: 85000, forecast: null },
  { month: "Abr/25", revenue: 92000, forecast: null },
  { month: "Mai/25", revenue: 78000, forecast: null },
  { month: "Jun/25", revenue: 105000, forecast: null },
  { month: "Jul/25", revenue: 118000, forecast: null },
  { month: "Ago/25", revenue: 95000, forecast: null },
  { month: "Set/25", revenue: 98500, forecast: null },
  { month: "Out/25", revenue: 125300, forecast: null },
  { month: "Nov/25", revenue: 82100, forecast: null },
  { month: "Dez/25", revenue: 67800, forecast: null },
  { month: "Jan/26", revenue: 142000, forecast: null },
  { month: "Fev/26", revenue: 168500, forecast: null },
  { month: "Mar/26", revenue: null, forecast: 155000 },
  { month: "Abr/26", revenue: null, forecast: 162000 },
  { month: "Mai/26", revenue: null, forecast: 148000 },
];
