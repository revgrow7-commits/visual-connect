export interface PaginationParams {
  skip: number;
  take: number;
  order?: Record<string, "ASC" | "DESC">;
  filter?: Record<string, any>;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// From /api-key/jobs/data
export interface HoldprintProcess {
  id: string;
  code: number;
  title?: string;
  customerName?: string;
  currentProductionStepName?: string;
  productionStatus?: string;
  status?: string;
  isFinalized?: boolean;
  creationTime?: string;
  deliveryNeeded?: string;
  deliveryExpected?: string;
  finalizedTime?: string;
  progressPercentage?: number;
  paymentOption?: string;
  jobChargeStatus?: string;
  jobInvoiceStatus?: string;
  costs?: {
    budgetedTotalPrice?: number | null;
    budgetedProductionCost?: number | null;
    budgetedProfit?: number | null;
    realizedTotalPrice?: number | null;
    realizedProductionCost?: number | null;
  };
}

export interface ProcessFamily {
  _id: string;
  name: string;
}

// From /api-key/customers/data
export interface HoldprintCustomer {
  id: string;
  name: string;
  fullName?: string;
  active?: boolean;
  entityType?: number;
  mainEmail?: string;
  mainPhoneNumber?: string;
  site?: string;
  creationTime?: string;
  lastUpdateTime?: string;
  addresses?: Array<{
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    complement?: string;
  }>;
  contacts?: Array<{
    name?: string;
    email?: string;
    phoneNumber?: string;
    position?: string;
  }>;
  salesCreditLimit?: number;
}

// From /api-key/budgets/data
export interface HoldprintBudget {
  code: number;
  title?: string;
  customerName?: string;
  budgetState?: number;
  budgetStep?: string; // rascunho, emitido, enviado, negociacao, aceite_verbal
  budgetStepName?: string;
  commercialResponsible?: string;
  creationDate?: string;
  wonDate?: string;
  lostDate?: string;
  lostReason?: string;
  deliveryNeed?: string;
  lastInteractionDate?: string;
  followUpDate?: string;
  proposalLink?: string;
  proposalViewedAt?: string;
  proposes?: Array<{
    id?: string;
    name?: string;
    totalPrice?: number;
    productionCost?: number;
    sellingCost?: number;
    totalProfitPercentual?: number;
    paymentOption?: string;
    sentDate?: string;
    viewedDate?: string;
    proposeItems?: Array<{
      itemName?: string;
      totalPrice?: number;
      quantity?: number;
      unitPrice?: number;
      productionCost?: number;
    }>;
  }>;
}

export interface BudgetStepOrder {
  _id?: string;
  id?: string;
  name?: string;
  order?: number;
}
