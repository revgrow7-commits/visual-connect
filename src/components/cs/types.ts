export interface BudgetChecklist {
  question: string;
  answer: string;
}

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
  status: "active" | "expiring" | "expired" | "none";
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
  id: number;
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
