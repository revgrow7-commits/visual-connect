import type { Delivery, Complaint, CSCustomer, CustomerHealthScore, ComplaintWithSLA, WarrantyRecord, TechnicalVisit, Touchpoint, Opportunity, CSAlert } from "./types";

// === CHART DATA ===
export const deliveryChartData = [
  { month: "Set/25", onTime: 15, late: 2, total: 17, percentage: 88.2 },
  { month: "Out/25", onTime: 18, late: 4, total: 22, percentage: 81.8 },
  { month: "Nov/25", onTime: 12, late: 3, total: 15, percentage: 80.0 },
  { month: "Dez/25", onTime: 10, late: 2, total: 12, percentage: 83.3 },
  { month: "Jan/26", onTime: 16, late: 3, total: 19, percentage: 84.2 },
  { month: "Fev/26", onTime: 14, late: 3, total: 17, percentage: 82.4 },
];

export const complaintCategoryData = [
  { name: "Atraso Entrega", value: 35, fill: "hsl(0 84% 60%)" },
  { name: "Defeito Produção", value: 25, fill: "hsl(45 93% 47%)" },
  { name: "Divergência Orçado", value: 20, fill: "hsl(217 91% 60%)" },
  { name: "Instalação", value: 12, fill: "hsl(25 95% 53%)" },
  { name: "Outros", value: 8, fill: "hsl(0 0% 64%)" },
];

export const npsData = [
  { month: "Set/25", promoters: 62, passives: 25, detractors: 13, nps: 49 },
  { month: "Out/25", promoters: 65, passives: 22, detractors: 13, nps: 52 },
  { month: "Nov/25", promoters: 60, passives: 28, detractors: 12, nps: 48 },
  { month: "Dez/25", promoters: 68, passives: 20, detractors: 12, nps: 56 },
  { month: "Jan/26", promoters: 72, passives: 18, detractors: 10, nps: 62 },
  { month: "Fev/26", promoters: 78, passives: 14, detractors: 8, nps: 72 },
];

export const npsEvolution = [
  { month: "Mar/25", nps: 42 }, { month: "Abr/25", nps: 45 },
  { month: "Mai/25", nps: 48 }, { month: "Jun/25", nps: 46 },
  { month: "Jul/25", nps: 52 }, { month: "Ago/25", nps: 55 },
  { month: "Set/25", nps: 49 }, { month: "Out/25", nps: 58 },
  { month: "Nov/25", nps: 56 }, { month: "Dez/25", nps: 62 },
  { month: "Jan/26", nps: 68 }, { month: "Fev/26", nps: 72 },
];

export const topComplaintClients = [
  { name: "Padaria Pão Quente", count: 3 },
  { name: "TechStore Eletrônicos", count: 2 },
  { name: "Lojas Renner SA", count: 2 },
  { name: "AutoMax Concessionária", count: 1 },
  { name: "Restaurante Sabor & Arte", count: 1 },
];

export const healthScoreDistribution = [
  { range: "90-100", label: "Excelente", count: 2, fill: "hsl(142 71% 35%)" },
  { range: "70-89", label: "Bom", count: 3, fill: "hsl(142 71% 55%)" },
  { range: "50-69", label: "Atenção", count: 2, fill: "hsl(45 93% 47%)" },
  { range: "30-49", label: "Crítico", count: 1, fill: "hsl(25 95% 53%)" },
  { range: "0-29", label: "Risco", count: 1, fill: "hsl(0 84% 60%)" },
];

export const satisfactionHeatmap = [
  { service: "Fachadas ACM", quality: 4.8, prazo: 3.2, atendimento: 4.5, preco: 3.8 },
  { service: "Sinalização", quality: 4.9, prazo: 4.5, atendimento: 4.7, preco: 4.2 },
  { service: "Plotagem Frota", quality: 4.7, prazo: 4.8, atendimento: 4.9, preco: 4.0 },
  { service: "Eventos/Banners", quality: 4.5, prazo: 4.6, atendimento: 4.8, preco: 4.5 },
  { service: "Painéis LED", quality: 4.9, prazo: 4.2, atendimento: 3.8, preco: 3.5 },
  { service: "Vitrines/Adesivos", quality: 4.2, prazo: 3.5, atendimento: 4.0, preco: 4.3 },
];

export const activeAlerts: CSAlert[] = [
  { type: "sla_breach", icon: "🚨", message: "SLA estourado: RCL-006 (Padaria Pão Quente) — 5 dias sem resolução", action: "Ver reclamação", priority: "critical" },
  { type: "warranty_expiring", icon: "⏰", message: "5 garantias expiram nos próximos 30 dias — oportunidade de contrato manutenção", action: "Ver garantias", priority: "medium" },
  { type: "churn_risk", icon: "⚠️", message: "3 clientes com Health Score abaixo de 50 — ação imediata necessária", action: "Ver clientes em risco", priority: "high" },
  { type: "nps_detractor", icon: "👎", message: "2 detratores no último NPS — follow-up pendente", action: "Ver detratores", priority: "high" },
];

// === DELIVERIES ===
export const mockDeliveries: Delivery[] = [
  {
    job: { id: "6983a5c88c3f7152c87b98cb", code: 1236, title: "Plotagem frota 12 veículos TransLog", customerName: "TransLog Logística SA", customerDocument: "33.444.555/0001-22", customerEmail: "ricardo@translog.com.br", customerPhone: "(51) 3111-6666", customerContact: "Ricardo Mendes", responsibleName: "Carlos Almeida", totalPrice: 32000.0, deliveryNeeded: "2026-02-15", deliveryDate: "2026-02-14", products: [{ name: "Envelopamento parcial veículos", description: "Vinil 3M IJ180 + laminação 8519", quantity: 12, totalValue: 32000 }] },
    deliveryStatus: "on_time", daysVariance: -1,
    warranty: { type: "Vinil veicular 3M — 3 anos outdoor", startDate: "2026-02-14", endDate: "2029-02-14", status: "active", daysRemaining: 1096, coverage: "Desbotamento, descolamento, bolhas, trincas do vinil", exclusions: "Danos mecânicos, lavagem com solvente, uso indevido" },
    satisfaction: { overall: 5, quality: 5, deadline: 5, service: 5, feedback: "Excelente trabalho, ficou melhor que o esperado!", npsScore: 10, npsCategory: "promoter", surveyDate: "2026-02-16" },
    complaints: [],
    history: [{ date: "2026-02-14", event: "Job finalizado e entregue ao cliente" }, { date: "2026-02-15", event: "Pesquisa de satisfação NPS enviada" }, { date: "2026-02-16", event: "NPS respondido: Promotor (nota 10)" }],
  },
  {
    job: { id: "68dc338d9556f3500c1ad304", code: 1237, title: "Banner + Backdrop Evento Corporativo Banco XP", customerName: "Banco XP Eventos", customerDocument: "66.777.888/0001-44", customerEmail: "eventos@xp.com.br", customerPhone: "(11) 5555-9999", customerContact: "Camila Rodrigues", responsibleName: "João Silva", totalPrice: 12300.0, deliveryNeeded: "2026-02-12", deliveryDate: "2026-02-11", products: [{ name: "Backdrop evento 5x3m", description: "Lona blackout + box truss", quantity: 1, totalValue: 6500 }, { name: "Banners roll-up 0.8x2m", description: "Eco-solvente + estrutura retrátil", quantity: 8, totalValue: 5800 }] },
    deliveryStatus: "on_time", daysVariance: -1,
    warranty: { type: "Evento — sem garantia padrão", startDate: "2026-02-11", endDate: "2026-02-11", status: "none", daysRemaining: 0, coverage: "N/A — material para uso único em evento", exclusions: "N/A" },
    satisfaction: { overall: 5, quality: 5, deadline: 5, service: 5, feedback: "Perfeito! Montagem impecável.", npsScore: 10, npsCategory: "promoter", surveyDate: "2026-02-13" },
    complaints: [], history: [{ date: "2026-02-11", event: "Entrega e montagem no local do evento" }, { date: "2026-02-12", event: "Evento realizado com sucesso" }, { date: "2026-02-13", event: "NPS respondido: Promotor (nota 10)" }],
  },
  {
    job: { id: "prev-job-001", code: 1220, title: "Fachada completa Loja TechStore Shopping Bourbon", customerName: "TechStore Eletrônicos LTDA", customerDocument: "22.333.444/0001-55", customerEmail: "expansao@techstore.com.br", customerPhone: "(51) 3444-5555", customerContact: "Fernando Azevedo", responsibleName: "Maria Santos", totalPrice: 38500.0, deliveryNeeded: "2026-01-20", deliveryDate: "2026-01-25", products: [{ name: "Revestimento ACM fachada", description: "ACM 4mm preto + instalação", quantity: 1, totalValue: 22000 }, { name: "Letras-caixa iluminadas", description: "Acrílico + LED interno", quantity: 12, totalValue: 16500 }] },
    deliveryStatus: "late", daysVariance: 5,
    warranty: { type: "Fachada ACM + LED — 5 anos", startDate: "2026-01-25", endDate: "2031-01-25", status: "active", daysRemaining: 1806, coverage: "Desplacamento ACM, falha LED, desbotamento, infiltração", exclusions: "Danos por impacto, vandalismo, força maior" },
    satisfaction: { overall: 3, quality: 4, deadline: 1, service: 3, feedback: "Qualidade boa, mas atraso de 5 dias nos prejudicou.", npsScore: 5, npsCategory: "passive", surveyDate: "2026-01-28" },
    complaints: [{ id: "cmp-001", date: "2026-01-22", customerName: "TechStore Eletrônicos LTDA", customerDocument: "22.333.444/0001-55", jobCode: 1220, jobTitle: "Fachada completa Loja TechStore Shopping Bourbon", category: "delivery_delay", priority: "high", description: "Fachada não ficou pronta no prazo combinado.", status: "resolved", responsibleName: "Maria Santos", resolvedDate: "2026-01-26", resolution: "Equipe trabalhou fim de semana. Oferecido 10% desconto.", attachments: [] }],
    history: [{ date: "2026-01-20", event: "Prazo original — entrega não realizada" }, { date: "2026-01-22", event: "Reclamação registrada" }, { date: "2026-01-25", event: "Job finalizado (5 dias atraso)" }, { date: "2026-01-26", event: "Reclamação resolvida" }, { date: "2026-01-28", event: "NPS respondido: Passivo (nota 5)" }],
  },
  {
    job: { id: "prev-job-002", code: 1225, title: "Sinalização interna Hospital São Lucas", customerName: "Hospital São Lucas PUCRS", customerDocument: "88.999.000/0001-11", customerEmail: "infra@saolucas.pucrs.br", customerPhone: "(51) 3320-3000", customerContact: "Dr. André Campos", responsibleName: "Carlos Almeida", totalPrice: 28900.0, deliveryNeeded: "2026-01-30", deliveryDate: "2026-01-29", products: [{ name: "Placas sinalização hospitalar", description: "ACM com impressão UV + braile", quantity: 85, totalValue: 17000 }, { name: "Totens de pavimento", description: "Aço inox escovado + ACM", quantity: 4, totalValue: 8800 }, { name: "Faixas de piso", description: "Vinil antiderrapante impresso", quantity: 1, totalValue: 3100 }] },
    deliveryStatus: "on_time", daysVariance: -1,
    warranty: { type: "Sinalização interna — 2 anos", startDate: "2026-01-29", endDate: "2028-01-29", status: "active", daysRemaining: 715, coverage: "Desbotamento, descolamento, legibilidade braile", exclusions: "Danos por limpeza com produtos abrasivos" },
    satisfaction: { overall: 5, quality: 5, deadline: 5, service: 5, feedback: "Trabalho excepcional. Sinalização em braile perfeita.", npsScore: 10, npsCategory: "promoter", surveyDate: "2026-02-01" },
    complaints: [], history: [{ date: "2026-01-29", event: "Entrega e instalação concluída" }, { date: "2026-01-30", event: "Vistoria de aceite aprovada" }, { date: "2026-02-01", event: "NPS respondido: Promotor (nota 10)" }],
  },
  {
    job: { id: "prev-job-003", code: 1228, title: "Adesivagem vitrine campanha Natal - Renner (5 lojas)", customerName: "Lojas Renner SA", customerDocument: "44.555.666/0001-88", customerEmail: "trade-marketing@lojasrenner.com.br", customerPhone: "(51) 3666-1111", customerContact: "Patrícia Lima", responsibleName: "João Silva", totalPrice: 18500.0, deliveryNeeded: "2025-12-01", deliveryDate: "2025-12-03", products: [{ name: "Adesivo vitrine recorte eletrônico", description: "Vinil jateado + cores", quantity: 5, totalValue: 18500 }] },
    deliveryStatus: "slight_delay", daysVariance: 2,
    warranty: { type: "Adesivo vitrine — campanha sazonal", startDate: "2025-12-03", endDate: "2026-03-03", status: "expiring", daysRemaining: 18, coverage: "Descolamento, bolhas — remoção sem resíduos inclusa", exclusions: "Danos por limpeza com espátula metálica" },
    satisfaction: { overall: 3, quality: 4, deadline: 2, service: 3, feedback: "Qualidade boa, mas atraso complicou Black Friday.", npsScore: 6, npsCategory: "passive", surveyDate: "2025-12-10" },
    complaints: [{ id: "cmp-002", date: "2025-12-15", customerName: "Lojas Renner SA", customerDocument: "44.555.666/0001-88", jobCode: 1228, jobTitle: "Adesivagem vitrine campanha Natal", category: "production_defect", priority: "medium", description: "Bolhas na vitrine da loja Bourbon Wallig após 12 dias.", status: "resolved", responsibleName: "João Silva", resolvedDate: "2025-12-18", resolution: "Reaplicação gratuita. Procedimento: não aplicar <15°C.", attachments: [] }],
    history: [{ date: "2025-12-01", event: "3 lojas entregues, 2 pendentes" }, { date: "2025-12-03", event: "Todas as 5 lojas concluídas (2 dias atraso)" }, { date: "2025-12-10", event: "NPS respondido: Passivo (nota 6)" }, { date: "2025-12-15", event: "Reclamação: bolhas na loja Bourbon Wallig" }, { date: "2025-12-18", event: "Reaplicação gratuita realizada" }],
  },
  {
    job: { id: "prev-job-004", code: 1232, title: "Painel LED outdoor P10 - Concessionária AutoMax", customerName: "AutoMax Concessionária", customerDocument: "11.222.333/0001-99", customerEmail: "marketing@automax.com.br", customerPhone: "(51) 3222-8888", customerContact: "Gustavo Pereira", responsibleName: "Maria Santos", totalPrice: 52000.0, deliveryNeeded: "2026-02-10", deliveryDate: "2026-02-10", products: [{ name: "Painel LED P10 outdoor 6x3m", description: "Full color + software de gestão", quantity: 1, totalValue: 42000 }, { name: "Instalação + aterramento", description: "Estrutura metálica + elétrica", quantity: 1, totalValue: 10000 }] },
    deliveryStatus: "on_time", daysVariance: 0,
    warranty: { type: "Painel LED — 2 anos módulos + 5 anos estrutura", startDate: "2026-02-10", endDate: "2028-02-10", status: "active", daysRemaining: 727, coverage: "Módulos LED defeituosos, fonte, controladora", exclusions: "Surto elétrico sem DPS, vandalismo" },
    satisfaction: { overall: 4, quality: 5, deadline: 5, service: 4, feedback: "Painel incrível, faltou treinamento do software.", npsScore: 8, npsCategory: "passive", surveyDate: "2026-02-13" },
    complaints: [{ id: "cmp-003", date: "2026-02-12", customerName: "AutoMax Concessionária", customerDocument: "11.222.333/0001-99", jobCode: 1232, jobTitle: "Painel LED outdoor P10", category: "other", priority: "medium", description: "Software complexo, solicita treinamento.", status: "in_progress", responsibleName: "Maria Santos", resolvedDate: null, resolution: null, attachments: [] }],
    history: [{ date: "2026-02-10", event: "Instalação finalizada no prazo" }, { date: "2026-02-12", event: "Reclamação: pedido de treinamento" }, { date: "2026-02-13", event: "NPS respondido: Passivo (nota 8)" }, { date: "2026-02-14", event: "Treinamento agendado para 17/02" }],
  },
];

// === COMPLAINTS ===
export const mockComplaints: Complaint[] = [
  { id: "RCL-001", date: "2026-01-22", customerName: "TechStore Eletrônicos LTDA", customerDocument: "22.333.444/0001-55", jobCode: 1220, jobTitle: "Fachada completa Loja TechStore Shopping Bourbon", category: "delivery_delay", priority: "high", description: "Fachada não ficou pronta no prazo de 20/01.", status: "resolved", responsibleName: "Maria Santos", resolvedDate: "2026-01-26", resolution: "Equipe trabalhou fim de semana. Oferecido 10% desconto.", attachments: [] },
  { id: "RCL-002", date: "2025-12-15", customerName: "Lojas Renner SA", customerDocument: "44.555.666/0001-88", jobCode: 1228, jobTitle: "Adesivagem vitrine campanha Natal - Renner (5 lojas)", category: "production_defect", priority: "medium", description: "Bolhas na vitrine da loja Bourbon Wallig após 12 dias.", status: "resolved", responsibleName: "João Silva", resolvedDate: "2025-12-18", resolution: "Reaplicação gratuita sob garantia.", attachments: [] },
  { id: "RCL-003", date: "2026-02-12", customerName: "AutoMax Concessionária", customerDocument: "11.222.333/0001-99", jobCode: 1232, jobTitle: "Painel LED outdoor P10 - AutoMax", category: "other", priority: "medium", description: "Software complexo. Solicita treinamento adicional.", status: "in_progress", responsibleName: "Maria Santos", resolvedDate: null, resolution: null, attachments: [] },
  { id: "RCL-004", date: "2026-02-11", customerName: "Restaurante Sabor & Arte", customerDocument: "77.888.999/0001-44", jobCode: 1215, jobTitle: "Letreiro luminoso fachada Restaurante Sabor & Arte", category: "installation", priority: "high", description: "LED com defeito em 3 módulos após chuva forte.", status: "open", responsibleName: "Carlos Almeida", resolvedDate: null, resolution: null, attachments: [] },
  { id: "RCL-005", date: "2026-02-13", customerName: "Clínica Odontológica SorrirMais", customerDocument: "55.666.777/0001-22", jobCode: 1230, jobTitle: "Sinalização interna Clínica SorrirMais", category: "budget_divergence", priority: "low", description: "Entregues 18 placas ao invés de 20.", status: "open", responsibleName: "João Silva", resolvedDate: null, resolution: null, attachments: [] },
  { id: "RCL-006", date: "2026-02-08", customerName: "Padaria Pão Quente", customerDocument: "33.444.555/0001-66", jobCode: 1218, jobTitle: "Fachada e comunicação visual Padaria Pão Quente", category: "production_defect", priority: "critical", description: "Cores da fachada completamente erradas. Inauguração em 3 dias.", status: "in_progress", responsibleName: "Maria Santos", resolvedDate: null, resolution: null, attachments: [] },
];

// === CS CUSTOMERS ===
export const mockCSCustomers: CSCustomer[] = [
  { id: 791, name: "TransLog Logística SA", document: "33.444.555/0001-22", contact_person: "Ricardo Mendes", email: "ricardo@translog.com.br", phone: "(51) 3111-6666", city: "Canoas", state: "RS", total_jobs: 8, last_job_date: "2026-02-14", nps_score: 10, nps_category: "promoter", avg_satisfaction: 4.9, complaint_count: 0, open_complaints: 0, total_revenue: 185000 },
  { id: 794, name: "Banco XP Eventos", document: "66.777.888/0001-44", contact_person: "Camila Rodrigues", email: "eventos@xp.com.br", phone: "(11) 5555-9999", city: "São Paulo", state: "SP", total_jobs: 4, last_job_date: "2026-02-11", nps_score: 10, nps_category: "promoter", avg_satisfaction: 5.0, complaint_count: 0, open_complaints: 0, total_revenue: 52800 },
  { id: 800, name: "Hospital São Lucas PUCRS", document: "88.999.000/0001-11", contact_person: "Dr. André Campos", email: "infra@saolucas.pucrs.br", phone: "(51) 3320-3000", city: "Porto Alegre", state: "RS", total_jobs: 3, last_job_date: "2026-01-29", nps_score: 10, nps_category: "promoter", avg_satisfaction: 5.0, complaint_count: 0, open_complaints: 0, total_revenue: 68500 },
  { id: 801, name: "AutoMax Concessionária", document: "11.222.333/0001-99", contact_person: "Gustavo Pereira", email: "marketing@automax.com.br", phone: "(51) 3222-8888", city: "Porto Alegre", state: "RS", total_jobs: 2, last_job_date: "2026-02-10", nps_score: 8, nps_category: "passive", avg_satisfaction: 4.0, complaint_count: 1, open_complaints: 1, total_revenue: 72000 },
  { id: 795, name: "Lojas Renner SA", document: "44.555.666/0001-88", contact_person: "Patrícia Lima", email: "trade-marketing@lojasrenner.com.br", phone: "(51) 3666-1111", city: "Porto Alegre", state: "RS", total_jobs: 6, last_job_date: "2025-12-03", nps_score: 6, nps_category: "passive", avg_satisfaction: 3.5, complaint_count: 2, open_complaints: 0, total_revenue: 98000 },
  { id: 802, name: "TechStore Eletrônicos LTDA", document: "22.333.444/0001-55", contact_person: "Fernando Azevedo", email: "expansao@techstore.com.br", phone: "(51) 3444-5555", city: "Porto Alegre", state: "RS", total_jobs: 1, last_job_date: "2026-01-25", nps_score: 5, nps_category: "passive", avg_satisfaction: 3.0, complaint_count: 1, open_complaints: 0, total_revenue: 38500 },
  { id: 803, name: "Restaurante Sabor & Arte", document: "77.888.999/0001-44", contact_person: "Chef Alexandre", email: "contato@saborarte.com.br", phone: "(51) 3555-7777", city: "Porto Alegre", state: "RS", total_jobs: 1, last_job_date: "2026-02-05", nps_score: 4, nps_category: "detractor", avg_satisfaction: 2.5, complaint_count: 1, open_complaints: 1, total_revenue: 15200 },
  { id: 804, name: "Padaria Pão Quente", document: "33.444.555/0001-66", contact_person: "Sr. Antônio", email: "contato@paoquente.com.br", phone: "(51) 3666-8888", city: "Porto Alegre", state: "RS", total_jobs: 1, last_job_date: "2026-02-06", nps_score: 2, nps_category: "detractor", avg_satisfaction: 1.5, complaint_count: 1, open_complaints: 1, total_revenue: 12800 },
];

// === HEALTH SCORES ===
export const mockHealthScores: CustomerHealthScore[] = [
  { id: 791, name: "TransLog Logística SA", document: "33.444.555/0001-22", contact_person: "Ricardo Mendes", phone: "(51) 3111-6666", email: "ricardo@translog.com.br", healthScore: 96, previousScore: 94, trend: "up", components: { nps: { score: 100, raw: 10 }, delivery: { score: 100, raw: "8/8 no prazo" }, frequency: { score: 100, raw: "mensal" }, complaints: { score: 100, raw: 0 }, recency: { score: 100, raw: 1 } }, totalJobs: 8, totalRevenue: 185000, complaintCount: 0, openComplaints: 0, lastJobDate: "2026-02-14", riskLevel: "none", suggestedAction: null },
  { id: 794, name: "Banco XP Eventos", document: "66.777.888/0001-44", contact_person: "Camila Rodrigues", phone: "(11) 5555-9999", email: "eventos@xp.com.br", healthScore: 92, previousScore: 90, trend: "up", components: { nps: { score: 100, raw: 10 }, delivery: { score: 100, raw: "4/4 no prazo" }, frequency: { score: 75, raw: "trimestral" }, complaints: { score: 100, raw: 0 }, recency: { score: 100, raw: 2 } }, totalJobs: 4, totalRevenue: 52800, complaintCount: 0, openComplaints: 0, lastJobDate: "2026-02-11", riskLevel: "none", suggestedAction: null },
  { id: 800, name: "Hospital São Lucas PUCRS", document: "88.999.000/0001-11", contact_person: "Dr. André Campos", phone: "(51) 3320-3000", email: "infra@saolucas.pucrs.br", healthScore: 85, previousScore: 85, trend: "stable", components: { nps: { score: 100, raw: 10 }, delivery: { score: 100, raw: "3/3 no prazo" }, frequency: { score: 50, raw: "semestral" }, complaints: { score: 100, raw: 0 }, recency: { score: 75, raw: 15 } }, totalJobs: 3, totalRevenue: 68500, complaintCount: 0, openComplaints: 0, lastJobDate: "2026-01-29", riskLevel: "none", suggestedAction: "Agendar visita de relacionamento — potencial sinalização novo bloco" },
  { id: 789, name: "Premium Varejo LTDA", document: "12.345.678/0001-99", contact_person: "Marcos Oliveira", phone: "(51) 3333-4444", email: "marcos@premiumvarejo.com.br", healthScore: 78, previousScore: 75, trend: "up", components: { nps: { score: 80, raw: 8 }, delivery: { score: 80, raw: "4/5 no prazo" }, frequency: { score: 75, raw: "trimestral" }, complaints: { score: 60, raw: 2 }, recency: { score: 100, raw: 8 } }, totalJobs: 5, totalRevenue: 142000, complaintCount: 2, openComplaints: 0, lastJobDate: "2026-02-05", riskLevel: "low", suggestedAction: "Follow-up sobre reclamação resolvida" },
  { id: 801, name: "AutoMax Concessionária", document: "11.222.333/0001-99", contact_person: "Gustavo Pereira", phone: "(51) 3222-8888", email: "marketing@automax.com.br", healthScore: 62, previousScore: 70, trend: "down", components: { nps: { score: 60, raw: 8 }, delivery: { score: 100, raw: "2/2 no prazo" }, frequency: { score: 50, raw: "semestral" }, complaints: { score: 60, raw: 1 }, recency: { score: 100, raw: 3 } }, totalJobs: 2, totalRevenue: 72000, complaintCount: 1, openComplaints: 1, lastJobDate: "2026-02-10", riskLevel: "medium", suggestedAction: "URGENTE: Resolver reclamação de treinamento do software LED" },
  { id: 795, name: "Lojas Renner SA", document: "44.555.666/0001-88", contact_person: "Patrícia Lima", phone: "(51) 3666-1111", email: "trade-marketing@lojasrenner.com.br", healthScore: 55, previousScore: 60, trend: "down", components: { nps: { score: 40, raw: 6 }, delivery: { score: 60, raw: "3/5 no prazo" }, frequency: { score: 75, raw: "trimestral" }, complaints: { score: 40, raw: 2 }, recency: { score: 50, raw: 72 } }, totalJobs: 6, totalRevenue: 98000, complaintCount: 2, openComplaints: 0, lastJobDate: "2025-12-03", riskLevel: "medium", suggestedAction: "Ligar para Patrícia — 72 dias sem novo pedido. Score caindo." },
  { id: 802, name: "TechStore Eletrônicos LTDA", document: "22.333.444/0001-55", contact_person: "Fernando Azevedo", phone: "(51) 3444-5555", email: "expansao@techstore.com.br", healthScore: 42, previousScore: 45, trend: "down", components: { nps: { score: 30, raw: 5 }, delivery: { score: 0, raw: "0/1 no prazo" }, frequency: { score: 25, raw: "anual" }, complaints: { score: 60, raw: 1 }, recency: { score: 75, raw: 19 } }, totalJobs: 1, totalRevenue: 38500, complaintCount: 1, openComplaints: 0, lastJobDate: "2026-01-25", riskLevel: "high", suggestedAction: "ATENÇÃO: Cliente insatisfeito com atraso. Visita presencial para recuperação." },
  { id: 803, name: "Restaurante Sabor & Arte", document: "77.888.999/0001-44", contact_person: "Chef Alexandre", phone: "(51) 3555-7777", email: "contato@saborarte.com.br", healthScore: 28, previousScore: 35, trend: "down", components: { nps: { score: 20, raw: 4 }, delivery: { score: 60, raw: "na data" }, frequency: { score: 0, raw: "único" }, complaints: { score: 0, raw: 1 }, recency: { score: 75, raw: 8 } }, totalJobs: 1, totalRevenue: 15200, complaintCount: 1, openComplaints: 1, lastJobDate: "2026-02-05", riskLevel: "critical", suggestedAction: "CRÍTICO: Reclamação aberta sobre LED. Resolução imediata necessária." },
  { id: 804, name: "Padaria Pão Quente", document: "33.444.555/0001-66", contact_person: "Sr. Antônio", phone: "(51) 3666-8888", email: "contato@paoquente.com.br", healthScore: 15, previousScore: 20, trend: "down", components: { nps: { score: 0, raw: 2 }, delivery: { score: 40, raw: "em andamento" }, frequency: { score: 0, raw: "único" }, complaints: { score: 0, raw: 1 }, recency: { score: 50, raw: 7 } }, totalJobs: 1, totalRevenue: 12800, complaintCount: 1, openComplaints: 1, lastJobDate: "2026-02-06", riskLevel: "critical", suggestedAction: "EMERGÊNCIA: Cor da fachada errada, inauguração em 3 dias. Escalonar para diretoria." },
];

// === COMPLAINTS WITH SLA ===
export const mockComplaintsWithSLA: ComplaintWithSLA[] = [
  { id: "RCL-006", date: "2026-02-08T10:00:00Z", customerName: "Padaria Pão Quente", jobCode: 1218, jobTitle: "Fachada e comunicação visual Padaria Pão Quente", category: "production_defect", priority: "critical", description: "Cores da fachada completamente erradas. Vermelho saiu como laranja. Inauguração em 3 dias.", status: "in_progress", responsibleName: "Maria Santos", resolvedDate: null, resolution: null, sla: { responseDeadline: "2026-02-08T12:00:00Z", responseActual: "2026-02-08T11:30:00Z", responseBreached: false, resolutionDeadline: "2026-02-09T10:00:00Z", resolutionActual: null, resolutionBreached: true }, escalationLevel: "N3", escalationHistory: [{ level: "N1", person: "João Silva", date: "2026-02-08T10:00:00Z", reason: "Reclamação recebida" }, { level: "N2", person: "Maria Santos", date: "2026-02-08T11:30:00Z", reason: "Prioridade crítica — escalonado" }, { level: "N3", person: "Carlos Almeida (gerente)", date: "2026-02-09T10:00:00Z", reason: "SLA resolução estourado" }] },
  { id: "RCL-004", date: "2026-02-11T09:00:00Z", customerName: "Restaurante Sabor & Arte", jobCode: 1215, jobTitle: "Letreiro luminoso fachada Restaurante Sabor & Arte", category: "installation", priority: "high", description: "LED com defeito em 3 módulos após chuva forte. Água na caixa de conexão.", status: "open", responsibleName: "Carlos Almeida", resolvedDate: null, resolution: null, sla: { responseDeadline: "2026-02-11T13:00:00Z", responseActual: "2026-02-11T11:00:00Z", responseBreached: false, resolutionDeadline: "2026-02-13T09:00:00Z", resolutionActual: null, resolutionBreached: false }, escalationLevel: "N1", escalationHistory: [{ level: "N1", person: "Carlos Almeida", date: "2026-02-11T09:00:00Z", reason: "Reclamação recebida — visita agendada" }] },
  { id: "RCL-005", date: "2026-02-13T08:00:00Z", customerName: "Clínica Odontológica SorrirMais", jobCode: 1230, jobTitle: "Sinalização interna Clínica SorrirMais", category: "budget_divergence", priority: "low", description: "Entregues 18 placas ao invés de 20. Faltam 2 placas de banheiro.", status: "open", responsibleName: "João Silva", resolvedDate: null, resolution: null, sla: { responseDeadline: "2026-02-14T08:00:00Z", responseActual: null, responseBreached: false, resolutionDeadline: "2026-02-23T08:00:00Z", resolutionActual: null, resolutionBreached: false }, escalationLevel: "N1", escalationHistory: [{ level: "N1", person: "João Silva", date: "2026-02-13T08:00:00Z", reason: "Reclamação recebida" }] },
  { id: "RCL-003", date: "2026-02-12T14:00:00Z", customerName: "AutoMax Concessionária", jobCode: 1232, jobTitle: "Painel LED outdoor P10 - AutoMax", category: "other", priority: "medium", description: "Software de gestão do painel complexo. Solicita treinamento presencial.", status: "in_progress", responsibleName: "Maria Santos", resolvedDate: null, resolution: null, sla: { responseDeadline: "2026-02-12T22:00:00Z", responseActual: "2026-02-12T16:00:00Z", responseBreached: false, resolutionDeadline: "2026-02-17T14:00:00Z", resolutionActual: null, resolutionBreached: false }, escalationLevel: "N1", escalationHistory: [{ level: "N1", person: "Maria Santos", date: "2026-02-12T14:00:00Z", reason: "Reclamação recebida — treinamento agendado 17/02" }] },
];

// === WARRANTIES ===
export const mockWarranties: WarrantyRecord[] = [
  { jobCode: 1236, customerName: "TransLog Logística SA", product: "Envelopamento frota 12 veículos", type: "Vinil veicular 3M — 3 anos", startDate: "2026-02-14", endDate: "2029-02-14", daysRemaining: 1096, status: "active", coverage: "Desbotamento, descolamento, bolhas, trincas", serviceCalls: 0 },
  { jobCode: 1220, customerName: "TechStore Eletrônicos LTDA", product: "Fachada ACM + LED", type: "Fachada ACM + LED — 5 anos", startDate: "2026-01-25", endDate: "2031-01-25", daysRemaining: 1806, status: "active", coverage: "Desplacamento ACM, falha LED, desbotamento, infiltração", serviceCalls: 0 },
  { jobCode: 1232, customerName: "AutoMax Concessionária", product: "Painel LED P10 outdoor 6x3m", type: "LED — 2 anos módulos + 5 anos estrutura", startDate: "2026-02-10", endDate: "2028-02-10", daysRemaining: 727, status: "active", coverage: "Módulos LED, fonte, controladora, estrutura", serviceCalls: 1 },
  { jobCode: 1225, customerName: "Hospital São Lucas PUCRS", product: "Sinalização interna hospitalar", type: "Sinalização interna — 2 anos", startDate: "2026-01-29", endDate: "2028-01-29", daysRemaining: 715, status: "active", coverage: "Desbotamento, descolamento, legibilidade braile", serviceCalls: 0 },
  { jobCode: 1228, customerName: "Lojas Renner SA", product: "Adesivagem vitrines campanha Natal", type: "Adesivo campanha sazonal — 3 meses", startDate: "2025-12-03", endDate: "2026-03-03", daysRemaining: 18, status: "expiring_30", coverage: "Descolamento, bolhas, remoção sem resíduos", serviceCalls: 1 },
  { jobCode: 1210, customerName: "Café Aroma", product: "Letreiro luminoso fachada", type: "LED + estrutura — 2 anos", startDate: "2025-08-15", endDate: "2027-08-15", daysRemaining: 548, status: "active", coverage: "Módulos LED, conexões elétricas, estrutura metálica", serviceCalls: 0 },
  { jobCode: 1198, customerName: "Imobiliária Morada", product: "Placas de venda (50un)", type: "Impressão outdoor — 1 ano", startDate: "2025-06-10", endDate: "2026-06-10", daysRemaining: 117, status: "expiring_90", coverage: "Desbotamento e descolamento por UV", serviceCalls: 0 },
  { jobCode: 1185, customerName: "Estacionamento CentroPark", product: "Sinalização de trânsito interna", type: "Sinalização viária — 5 anos", startDate: "2025-04-20", endDate: "2030-04-20", daysRemaining: 1526, status: "active", coverage: "Refletividade, durabilidade, fixação", serviceCalls: 0 },
];

// === TECHNICAL VISITS ===
export const mockVisits: TechnicalVisit[] = [
  { id: "VT-001", scheduled_date: "2026-02-14T09:00:00Z", customerName: "AutoMax Concessionária", customerAddress: "Av. Ipiranga, 8000 — POA", type: "warranty_repair", description: "Treinamento do software de gestão do painel LED P10.", technicianName: "Lucas Ferreira", jobCode: 1232, complaintId: "RCL-003", status: "scheduled", report_status: null, report_notes: null, duration_minutes: null },
  { id: "VT-002", scheduled_date: "2026-02-15T14:00:00Z", customerName: "Restaurante Sabor & Arte", customerAddress: "Rua dos Andradas, 500 — POA", type: "warranty_repair", description: "Reparar 3 módulos LED com defeito + verificar vedação.", technicianName: "Carlos Almeida", jobCode: 1215, complaintId: "RCL-004", status: "scheduled", report_status: null, report_notes: null, duration_minutes: null },
  { id: "VT-003", scheduled_date: "2026-02-17T10:00:00Z", customerName: "Hospital São Lucas PUCRS", customerAddress: "Av. Ipiranga, 6681 — POA", type: "relationship", description: "Visita de relacionamento. Verificar sinalização jan/26. Apresentar projeto novo bloco.", technicianName: "Maria Santos", jobCode: null, complaintId: null, status: "scheduled", report_status: null, report_notes: null, duration_minutes: null },
  { id: "VT-004", scheduled_date: "2026-02-10T08:00:00Z", customerName: "Estacionamento CentroPark", customerAddress: "Rua Gen. Câmara, 200 — POA", type: "preventive_maintenance", description: "Manutenção preventiva semestral da sinalização de trânsito interna.", technicianName: "Lucas Ferreira", jobCode: 1185, complaintId: null, status: "completed", report_status: "submitted", report_notes: "Placas em bom estado. 3 adesivos de piso com desgaste — recomendada troca em 60 dias.", duration_minutes: 90 },
  { id: "VT-005", scheduled_date: "2026-02-07T15:00:00Z", customerName: "Padaria Pão Quente", customerAddress: "Av. Protásio Alves, 1500 — POA", type: "acceptance_inspection", description: "Vistoria de aceite da fachada refeita (cor corrigida).", technicianName: "Maria Santos", jobCode: 1218, complaintId: "RCL-006", status: "completed", report_status: "pending", report_notes: null, duration_minutes: 45 },
];

// === TOUCHPOINTS ===
export const mockTouchpoints: Touchpoint[] = [
  { id: "TP-001", date: "2026-02-13", customerName: "Padaria Pão Quente", type: "nps_survey", channel: "email", trigger: "D+7 após entrega Job #1218", status: "pending", responsibleName: "João Silva", notes: null },
  { id: "TP-002", date: "2026-02-13", customerName: "Lojas Renner SA", type: "reorder_nudge", channel: "phone", trigger: "72 dias sem novo pedido", status: "pending", responsibleName: "Ana Paula Ferreira", notes: null },
  { id: "TP-003", date: "2026-02-14", customerName: "TransLog Logística SA", type: "anniversary", channel: "email", trigger: "1 ano como cliente ativo", status: "pending", responsibleName: "Carlos Almeida", notes: null },
  { id: "TP-004", date: "2026-02-14", customerName: "AutoMax Concessionária", type: "complaint_resolved_check", channel: "phone", trigger: "D+2 após treinamento LED (VT-001)", status: "pending", responsibleName: "Maria Santos", notes: null },
  { id: "TP-005", date: "2026-02-17", customerName: "Hospital São Lucas PUCRS", type: "seasonal_campaign", channel: "email", trigger: "Apresentar projetos novo bloco", status: "pending", responsibleName: "Roberto Lima", notes: null },
  { id: "TP-006", date: "2026-02-28", customerName: "Lojas Renner SA", type: "warranty_reminder", channel: "email", trigger: "Garantia vitrines expira 03/03", status: "pending", responsibleName: "João Silva", notes: null },
  { id: "TP-007", date: "2026-02-10", customerName: "Banco XP Eventos", type: "post_delivery_follow", channel: "phone", trigger: "D+7 após evento Job #1237", status: "completed", responsibleName: "Roberto Lima", notes: "Ligação realizada. Cliente muito satisfeito." },
  { id: "TP-008", date: "2026-02-17", customerName: "TransLog Logística SA", type: "post_delivery_follow", channel: "phone", trigger: "D+3 após frota Job #1236", status: "completed", responsibleName: "Carlos Almeida", notes: "Ricardo confirmou que frota está perfeita." },
];

// === OPPORTUNITIES ===
export const mockOpportunities: Opportunity[] = [
  { id: "OPP-001", type: "upsell", customerName: "AutoMax Concessionária", healthScore: 62, estimatedValue: 35000, description: "Painel LED para showroom interno + gestão de conteúdo digital", context: "Comprou painel LED externo P10 (R$52k). Qualidade nota 5/5. Após resolver treinamento, apresentar solução interna.", nextStep: "Resolver RCL-003 → agendar visita comercial em 1 semana", timing: "Após resolução da reclamação", status: "active", createdDate: "2026-02-12", responsibleName: "Ana Paula Ferreira", relatedJobCode: 1232 },
  { id: "OPP-002", type: "reorder", customerName: "Lojas Renner SA", healthScore: 55, estimatedValue: 67500, description: "Campanha Outono/Inverno 2026 — adesivagem vitrines 15 lojas RS", context: "Cliente sazonal. Última campanha teve 2 problemas. Orçamento já enviado (Orç #2024-092). Precisa recuperar confiança.", nextStep: "Ligar para Patrícia Lima → reforçar melhorias → fechar campanha", timing: "URGENTE — campanha começa em março", status: "active", createdDate: "2026-02-10", responsibleName: "Ana Paula Ferreira", relatedJobCode: null },
  { id: "OPP-003", type: "maintenance_contract", customerName: "Lojas Renner SA", healthScore: 55, estimatedValue: 4500, description: "Contrato de manutenção mensal das vitrines", context: "Garantia vitrines expira 03/03. Oferecer contrato recorrente para manutenção sazonal.", nextStep: "Incluir na reunião da campanha Outono/Inverno", timing: "Antes de 03/03 (vencimento garantia)", status: "active", createdDate: "2026-02-08", responsibleName: "Roberto Lima", relatedJobCode: 1228 },
  { id: "OPP-004", type: "cross_sell", customerName: "TransLog Logística SA", healthScore: 96, estimatedValue: 8500, description: "Sinalização do novo galpão logístico em Cachoeirinha", context: "Cliente fidelíssimo (NPS 10, 8 jobs, HS 96). Mencionou novo galpão em construção.", nextStep: "Agendar visita técnica no novo galpão para medição", timing: "Março/2026 — obra prevista para abril", status: "active", createdDate: "2026-02-14", responsibleName: "Carlos Almeida", relatedJobCode: null },
  { id: "OPP-005", type: "referral", customerName: "Hospital São Lucas PUCRS", healthScore: 85, estimatedValue: 45000, description: "Indicação para Hospital Moinhos de Vento — sinalização acessível", context: "Dr. André (NPS 10) indicou que Moinhos planeja renovação. Projeto grande: ~200 placas + totens + braile.", nextStep: "Pedir contato do responsável no Moinhos", timing: "Fevereiro — aproveitar relação quente", status: "active", createdDate: "2026-02-01", responsibleName: "Ana Paula Ferreira", relatedJobCode: 1225 },
  { id: "OPP-006", type: "warranty_renewal", customerName: "Imobiliária Morada", healthScore: 70, estimatedValue: 2800, description: "Renovação garantia placas de venda + substituição desgastadas", context: "Garantia 1 ano expira jun/2026. 50 placas outdoor. Provável que algumas precisem troca.", nextStep: "Enviar proposta de renovação + vistoria", timing: "Abril/2026 — 60 dias antes do vencimento", status: "active", createdDate: "2026-02-05", responsibleName: "Roberto Lima", relatedJobCode: 1198 },
  { id: "OPP-007", type: "upsell", customerName: "Banco XP Eventos", healthScore: 92, estimatedValue: 18000, description: "Contrato trimestral de eventos corporativos (4 eventos/ano)", context: "4 eventos pontuais com NPS 10. Propor contrato anual com 15% desconto e material em estoque.", nextStep: "Enviar proposta de contrato para Camila Rodrigues", timing: "Fevereiro — próximo evento previsto para abril", status: "active", createdDate: "2026-02-13", responsibleName: "Roberto Lima", relatedJobCode: 1237 },
];
