export interface JobCostPhase {
  TotalPrice: number;
  ProductionCost: number;
  SellingCost: number;
  Profit: number;
  ProfitPercentual: number;
}

export interface JobCosts {
  budgeted: JobCostPhase;
  approved: JobCostPhase;
  planned: JobCostPhase;
  realized: JobCostPhase;
}

export interface JobTask {
  publicId: number;
  name: string;
  productionStatus: 'NotStarted' | 'InProgress' | 'Paused' | 'Finalized' | 'Cancelled';
  duration: number;
  scheduleStartDate: string | null;
  finalizedDate: string | null;
}

export interface JobFeedstock {
  feedstockId: string;
  publicId: number;
  comercialId: number;
  options: Record<string, string>;
}

export interface JobProductionItem {
  tasks: JobTask[];
  feedstocks: JobFeedstock[];
}

export interface JobProduction {
  status: 'Started' | 'NotStarted';
  progressPercentage: number | null;
  startDate: string | null;
  endDate: string | null;
  items: JobProductionItem[];
}

export interface JobProduct {
  Name: string;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  TotalValue: number;
  ProductionCost: number;
}

export interface Job {
  id: string;
  code: number;
  title: string;
  customerName: string;
  responsibleName: string;
  commercialResponsibleName: string;
  creationTime: string;
  deliveryNeeded: string | null;
  deliveryExpected: string | null;
  totalPrice: number;
  paymentOption: string;
  jobChargeStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  jobInvoiceStatus: 'NotIssued' | 'Partial' | 'Issued' | 'Cancelled';
  isFinalized: boolean;
  costs: JobCosts;
  production: JobProduction;
  products: JobProduct[];
}

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
};

export const chargeStatusMap: Record<string, { label: string; color: string }> = {
  Pending: { label: '💳 Pendente', color: 'bg-amber-100 text-amber-800' },
  Partial: { label: '💳 Parcial', color: 'bg-blue-100 text-blue-800' },
  Paid: { label: '💳 Pago', color: 'bg-emerald-100 text-emerald-800' },
  Overdue: { label: '💳 Atrasado', color: 'bg-red-100 text-red-800' },
};

export const invoiceStatusMap: Record<string, { label: string; color: string }> = {
  NotIssued: { label: '📄 Sem NF', color: 'bg-gray-100 text-gray-600' },
  Partial: { label: '📄 Parcial', color: 'bg-blue-100 text-blue-800' },
  Issued: { label: '📄 Emitida', color: 'bg-emerald-100 text-emerald-800' },
  Cancelled: { label: '📄 Cancelada', color: 'bg-red-100 text-red-800' },
};

export const productionStatusMap: Record<string, { label: string; color: string; icon: string }> = {
  NotStarted: { label: 'Não Iniciado', color: 'bg-slate-100 text-slate-700', icon: '⬜' },
  InProgress: { label: 'Em Produção', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  Paused: { label: 'Pausado', color: 'bg-amber-100 text-amber-700', icon: '⏸️' },
  Finalized: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  Cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: '❌' },
};

export function getAllTasks(job: Job): JobTask[] {
  return job.production.items.flatMap(item => item.tasks);
}

export function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-emerald-500';
  if (pct > 60) return 'bg-blue-500';
  if (pct > 30) return 'bg-amber-500';
  return 'bg-red-500';
}
