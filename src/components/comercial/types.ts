export interface BudgetChecklist {
  question: string;
  answer: string;
}

export interface BudgetItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productionCost: number;
  totalProfit: number;
  profitPercentual: number;
  checklists: BudgetChecklist[];
}

export interface BudgetProposal {
  id: string;
  name: string;
  totalPrice: number;
  productionCost: number;
  sellingCost: number;
  totalProfitPercentual: number;
  items: BudgetItem[];
}

export interface Budget {
  id: string;
  publicId: string;
  budgetState: 1 | 2 | 3; // 1=Open, 2=Lost, 3=Won
  customerName: string;
  customerDocument: string;
  commercialResponsible: string;
  creationDate: string;
  wonDate?: string;
  lostDate?: string;
  lostReason?: string;
  notes: string | null;
  proposals: BudgetProposal[];
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Customer {
  id: number;
  name: string;
  document: string;
  contact_person: string;
  email: string;
  phone: string;
  address: CustomerAddress;
  active: boolean;
  notes: string | null;
}

export interface MonthlyData {
  month: string;
  created: number;
  won: number;
  lost: number;
  revenue: number;
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR");
};

export const getMarginColor = (margin: number) => {
  if (margin > 40) return "text-green-600";
  if (margin >= 30) return "text-blue-600";
  if (margin >= 20) return "text-amber-600";
  return "text-red-600";
};

export const getMarginBorderColor = (margin: number) => {
  if (margin > 40) return "border-l-green-500";
  if (margin >= 30) return "border-l-blue-500";
  if (margin >= 20) return "border-l-amber-500";
  return "border-l-red-500";
};
