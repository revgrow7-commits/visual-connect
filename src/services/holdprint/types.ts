// ─── Pagination ───
export interface PaginationParams {
  skip: number;
  take: number;
  order?: Record<string, "ASC" | "DESC">;
  filter?: Record<string, unknown>;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ─── Processes ───
export interface HoldprintProcess {
  _id: string;
  name: string;
  family?: { _id: string; name: string } | null;
  cost?: number;
  estimatedTime?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ProcessFamily {
  _id: string;
  name: string;
}

// ─── Customers ───
export interface HoldprintCustomer {
  _id: string;
  fullName?: string;
  tradeName?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  segment?: string;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

// ─── Opportunities / CRM ───
export interface HoldprintFunnel {
  _id: string;
  name: string;
  steps?: FunnelStep[];
  [key: string]: unknown;
}

export interface FunnelStep {
  _id: string;
  name: string;
  order?: number;
  color?: string;
}

export interface HoldprintLead {
  _id: string;
  name?: string;
  customer?: { _id: string; fullName?: string } | null;
  value?: number;
  step?: string;
  stepName?: string;
  createdAt?: string;
  daysInStep?: number;
  [key: string]: unknown;
}

export interface HoldprintBudget {
  _id: string;
  code?: number;
  customer?: { _id: string; fullName?: string } | null;
  customerName?: string;
  totalPrice?: number;
  approvedTotalPrice?: number;
  budgetedTotalPrice?: number;
  step?: string;
  stepName?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface BudgetStepOrder {
  _id: string;
  name: string;
  order: number;
  color?: string;
}

// ─── Settings ───
export interface HoldprintSettings {
  token: string;
  accountId: string;
  userId: string;
}
