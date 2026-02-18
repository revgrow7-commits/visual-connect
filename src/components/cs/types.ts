// === DELIVERY TYPES ===
export interface DeliveryProduct {
  name: string;
  description: string;
  quantity: number;
  totalValue: number;
}

export interface DeliveryJob {
  id: string;
  code: number;
  title: string;
  customerName: string;
  customerDocument: string;
  customerEmail: string;
  customerPhone: string;
  customerContact: string;
  responsibleName: string;
  totalPrice: number;
  deliveryNeeded: string;
  deliveryDate: string | null;
  products: DeliveryProduct[];
}

export interface Warranty {
  type: string;
  startDate: string;
  endDate: string;
  status: "active" | "expiring" | "expiring_30" | "expiring_90" | "expired" | "none";
  daysRemaining: number;
  coverage: string;
  exclusions: string;
}

export interface Satisfaction {
  overall: number;
  quality: number;
  deadline: number;
  service: number;
  feedback: string | null;
  npsScore: number | null;
  npsCategory: "promoter" | "passive" | "detractor" | null;
  surveyDate: string | null;
}

export interface Complaint {
  id: string;
  date: string;
  customerName: string;
  customerDocument: string;
  jobCode: number;
  jobTitle: string;
  category: "delivery_delay" | "production_defect" | "budget_divergence" | "installation" | "other";
  priority: "critical" | "high" | "medium" | "low";
  description: string;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  responsibleName: string;
  resolvedDate: string | null;
  resolution: string | null;
  attachments: string[];
}

export interface HistoryEvent {
  date: string;
  event: string;
}

export interface Delivery {
  job: DeliveryJob;
  deliveryStatus: "on_time" | "slight_delay" | "late" | "awaiting_acceptance";
  daysVariance: number;
  warranty: Warranty;
  satisfaction: Satisfaction;
  complaints: Complaint[];
  history: HistoryEvent[];
}

export interface CSCustomer {
  id: number | string;
  name: string;
  document: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  total_jobs: number;
  last_job_date: string;
  nps_score: number | null;
  nps_category: "promoter" | "passive" | "detractor" | null;
  avg_satisfaction: number;
  complaint_count: number;
  open_complaints: number;
  total_revenue: number;
}

// === HEALTH SCORE ===
export interface HealthScoreComponent {
  score: number;
  raw: number | string;
}

export interface CustomerHealthScore {
  id: number;
  name: string;
  document: string;
  contact_person: string;
  phone: string;
  email: string;
  healthScore: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
  components: {
    nps: HealthScoreComponent;
    delivery: HealthScoreComponent;
    frequency: HealthScoreComponent;
    complaints: HealthScoreComponent;
    recency: HealthScoreComponent;
  };
  totalJobs: number;
  totalRevenue: number;
  complaintCount: number;
  openComplaints: number;
  lastJobDate: string;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
  suggestedAction: string | null;
}

// === COMPLAINTS WITH SLA ===
export interface ComplaintSLA {
  responseDeadline: string;
  responseActual: string | null;
  responseBreached: boolean;
  resolutionDeadline: string;
  resolutionActual: string | null;
  resolutionBreached: boolean;
}

export interface EscalationEntry {
  level: "N1" | "N2" | "N3" | "diretoria";
  person: string;
  date: string;
  reason: string;
}

export interface ComplaintWithSLA {
  id: string;
  date: string;
  customerName: string;
  jobCode: number;
  jobTitle: string;
  category: "delivery_delay" | "production_defect" | "budget_divergence" | "installation" | "other";
  priority: "critical" | "high" | "medium" | "low";
  description: string;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  responsibleName: string;
  resolvedDate: string | null;
  resolution: string | null;
  sla: ComplaintSLA;
  escalationLevel: "N1" | "N2" | "N3" | "diretoria";
  escalationHistory: EscalationEntry[];
}

export interface WarrantyRecord {
  jobCode: number;
  customerName: string;
  product: string;
  type: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: "active" | "expiring_30" | "expiring_90" | "expired";
  coverage: string;
  serviceCalls: number;
}

export interface TechnicalVisit {
  id: string;
  scheduled_date: string;
  customerName: string;
  customerAddress: string;
  type: "preventive_maintenance" | "warranty_repair" | "acceptance_inspection" | "relationship";
  description: string;
  technicianName: string;
  jobCode: number | null;
  complaintId: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  report_status: "pending" | "submitted" | null;
  report_notes: string | null;
  duration_minutes: number | null;
}

export interface Touchpoint {
  id: string;
  date: string;
  customerName: string;
  type: "nps_survey" | "post_delivery_follow" | "warranty_reminder" | "reorder_nudge" | "churn_alert" | "anniversary" | "seasonal_campaign" | "complaint_resolved_check";
  channel: "email" | "phone" | "whatsapp" | "visit";
  trigger: string;
  status: "pending" | "completed" | "postponed" | "skipped";
  responsibleName: string;
  notes: string | null;
}

export type OpportunityType = "upsell" | "cross_sell" | "reorder" | "maintenance_contract" | "warranty_renewal" | "referral";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  customerName: string;
  healthScore: number;
  estimatedValue: number;
  description: string;
  context: string;
  nextStep: string;
  timing: string;
  status: "active" | "converted" | "postponed" | "discarded";
  createdDate: string;
  responsibleName: string;
  relatedJobCode: number | null;
}

// === WORKSPACE TYPES ===
export interface CSAlert {
  id: string;
  type: "health_drop" | "sla_breach" | "warranty_expiring" | "churn_risk" | "nps_detractor" | "overdue_task" | "new_complaint";
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  description: string;
  customerName: string;
  timestamp: string;
  actionLabel: string;
  actionTarget: string;
  dismissed: boolean;
}

export interface CSTask {
  id: string;
  title: string;
  type: "call" | "email" | "visit" | "review" | "followup";
  customerName: string;
  dueTime: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  linkedTo: string;
}

export interface PlaybookField {
  label: string;
  type: "text" | "textarea" | "select" | "rating";
  options?: string[];
  required: boolean;
}

export interface PlaybookStep {
  order: number;
  title: string;
  type: "checklist" | "action" | "question" | "note";
  content: string;
  fields?: PlaybookField[];
}

export interface Playbook {
  id: string;
  name: string;
  trigger: string;
  category: "recovery" | "retention" | "onboarding" | "growth";
  estimatedTime: string;
  stepsCount: number;
  successMetric: string;
  steps: PlaybookStep[];
}

export interface CSWorkspaceCustomer {
  id: number | string;
  name: string;
  document: string;
  contact_person: string;
  phone: string;
  email: string;
  healthScore: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
  npsScore: number | null;
  npsCategory: "promoter" | "passive" | "detractor" | null;
  totalJobs: number;
  totalRevenue: number;
  openComplaints: number;
  lastJobDate: string;
  csmName: string;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
  frequency: string;
}

export type CSSectionId = "resumo" | "clientes" | "health" | "entregas" | "receita" | "tickets" | "visitas" | "regua" | "upsell" | "playbooks" | "relatorios" | "agente";
