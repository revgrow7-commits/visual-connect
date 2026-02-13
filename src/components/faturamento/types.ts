export interface Supplier {
  id: number;
  name: string;
  document: string;
}

export interface Customer {
  id: number;
  name: string;
  document: string;
}

export type ExpenseStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type ExpenseCategory = 'paper_supplies' | 'ink_supplies' | 'equipment_rental' | 'equipment_maintenance' | 'utilities' | 'labor' | 'services' | 'other';
export type CostCenter = 'production' | 'administration' | 'sales' | 'logistics';

export type IncomeStatus = 'pending' | 'received' | 'overdue' | 'cancelled';
export type RevenueCenter = 'sales' | 'services' | 'recurring' | 'other';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: ExpenseStatus;
  supplier: Supplier;
  category: ExpenseCategory;
  cost_center: CostCenter;
  payment_method: string | null;
  invoice_number: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Income {
  id: number;
  description: string;
  amount: number;
  expected_date: string;
  received_date: string | null;
  status: IncomeStatus;
  customer: Customer;
  revenue_center: RevenueCenter;
  payment_method: string | null;
  invoice_number: string;
  job_id: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export const EXPENSE_STATUS_MAP: Record<ExpenseStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  overdue: { label: 'Vencido', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'secondary' },
};

export const INCOME_STATUS_MAP: Record<IncomeStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  received: { label: 'Recebido', variant: 'success' },
  overdue: { label: 'Vencido', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'secondary' },
};

export const CATEGORY_MAP: Record<ExpenseCategory, string> = {
  paper_supplies: 'Papel e Substratos',
  ink_supplies: 'Tintas e Consumíveis',
  equipment_rental: 'Aluguel Equipamentos',
  equipment_maintenance: 'Manutenção Equipamentos',
  utilities: 'Utilidades (Luz/Água/Internet)',
  labor: 'Mão de Obra',
  services: 'Serviços Terceirizados',
  other: 'Outros',
};

export const COST_CENTER_MAP: Record<CostCenter, string> = {
  production: 'Produção',
  administration: 'Administração',
  sales: 'Vendas',
  logistics: 'Logística',
};

export const REVENUE_CENTER_MAP: Record<RevenueCenter, string> = {
  sales: 'Vendas',
  services: 'Serviços',
  recurring: 'Recorrente',
  other: 'Outros',
};
