import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CSCustomer, CSWorkspaceCustomer } from "@/components/cs/types";

export interface HoldprintCustomer {
  id: number;
  name: string;
  fantasyName?: string;
  cnpj?: string;
  document?: string;
  contactName?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  active?: boolean;
  _unidade?: string;
  _unit_key?: string;
  [key: string]: unknown;
}

export interface HoldprintJob {
  id: number | string;
  code?: number;
  title?: string;
  description?: string;
  productionStatus?: string;
  status?: string;
  currentProductionStepName?: string;
  progressPercentage?: number;
  totalPrice?: number;
  customer?: { id?: number; name?: string; fantasyName?: string };
  customerName?: string;
  deliveryNeeded?: string;
  deliveryDate?: string;
  deliveryExpected?: string;
  createdAt?: string;
  creationTime?: string;
  finalizedTime?: string;
  isFinalized?: boolean;
  costs?: { budgetedTotalPrice?: number; approvedTotalPrice?: number; realizedTotalPrice?: number };
  _unidade?: string;
  _unit_key?: string;
  [key: string]: unknown;
}

export interface HoldprintBudget {
  id: number;
  code?: number;
  budgetState?: string;
  state?: string;
  totalPrice?: number;
  customer?: { id?: number; name?: string; fantasyName?: string };
  createdAt?: string;
  _unidade?: string;
  _unit_key?: string;
  [key: string]: unknown;
}

export interface HoldprintIncome {
  id: number;
  amount?: number;
  value?: number;
  status?: string;
  dueDate?: string;
  paidDate?: string;
  customer?: { id?: number; name?: string };
  _unidade?: string;
  _unit_key?: string;
  [key: string]: unknown;
}

export interface CSHoldprintData {
  customers: HoldprintCustomer[];
  jobs: HoldprintJob[];
  budgets: HoldprintBudget[];
  incomes: HoldprintIncome[];
  lastSync: string | null;
  fetchedAt: string;
}

// Transform raw Holdprint customers into CS workspace format
export function transformToCSCustomers(data: CSHoldprintData): CSWorkspaceCustomer[] {
  const { customers, jobs, incomes } = data;

  return customers.map((c) => {
    const customerId = c.id;
    const customerName = c.fantasyName || c.name || "Sem nome";
    const customerJobs = jobs.filter(j => {
      const jobCustId = j.customer?.id;
      const jobCustName = j.customerName || j.customer?.name || j.customer?.fantasyName || "";
      return jobCustId === customerId || jobCustName.toLowerCase() === customerName.toLowerCase();
    });
    const customerIncomes = incomes.filter(i => i.customer?.id === customerId || i.customer?.name === customerName);

    const totalRevenue = customerIncomes.reduce((sum, i) => sum + (i.amount || i.value || 0), 0);
    const totalJobs = customerJobs.length;

    const sortedJobs = [...customerJobs].sort((a, b) => {
      const da = a.finalizedTime || a.deliveryDate || a.creationTime || a.createdAt || "";
      const db = b.finalizedTime || b.deliveryDate || b.creationTime || b.createdAt || "";
      return db.localeCompare(da);
    });
    const lastJobDate = sortedJobs[0]?.finalizedTime || sortedJobs[0]?.deliveryDate || sortedJobs[0]?.creationTime || sortedJobs[0]?.createdAt || "";

    // Basic health score calculation
    const daysSinceLastJob = lastJobDate
      ? Math.floor((Date.now() - new Date(lastJobDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let recencyScore = 15;
    if (daysSinceLastJob <= 30) recencyScore = 15;
    else if (daysSinceLastJob <= 90) recencyScore = 10;
    else if (daysSinceLastJob <= 180) recencyScore = 5;
    else recencyScore = 0;

    let frequencyScore = 20;
    if (totalJobs >= 6) frequencyScore = 20;
    else if (totalJobs >= 3) frequencyScore = 15;
    else if (totalJobs >= 2) frequencyScore = 10;
    else frequencyScore = 5;

    const healthScore = Math.min(100, Math.max(0, recencyScore + frequencyScore + 45)); // base 45 for simplicity

    let riskLevel: "none" | "low" | "medium" | "high" | "critical" = "none";
    if (healthScore < 30) riskLevel = "critical";
    else if (healthScore < 50) riskLevel = "high";
    else if (healthScore < 70) riskLevel = "medium";
    else if (healthScore < 80) riskLevel = "low";

    const trend: "up" | "down" | "stable" = daysSinceLastJob < 30 ? "up" : daysSinceLastJob > 180 ? "down" : "stable";

    return {
      id: customerId,
      name: customerName,
      document: c.cnpj || c.document || "",
      contact_person: c.contactName || c.contact_person || "",
      phone: c.phone || "",
      email: c.email || "",
      healthScore,
      previousScore: healthScore,
      trend,
      npsScore: null,
      npsCategory: null,
      totalJobs,
      totalRevenue,
      openComplaints: 0,
      lastJobDate: lastJobDate ? new Date(lastJobDate).toISOString().split("T")[0] : "",
      csmName: "Não atribuído",
      riskLevel,
      frequency: totalJobs >= 6 ? "mensal" : totalJobs >= 3 ? "trimestral" : totalJobs >= 2 ? "semestral" : "anual",
    };
  });
}

export function transformToCSCustomersList(data: CSHoldprintData): CSCustomer[] {
  const { customers, jobs, incomes } = data;

  return customers.map((c) => {
    const customerId = c.id;
    const customerName = c.fantasyName || c.name || "Sem nome";
    const customerJobs = jobs.filter(j => {
      const jobCustId = j.customer?.id;
      const jobCustName = j.customerName || j.customer?.name || j.customer?.fantasyName || "";
      return jobCustId === customerId || jobCustName.toLowerCase() === customerName.toLowerCase();
    });
    const customerIncomes = incomes.filter(i => i.customer?.id === customerId || i.customer?.name === customerName);
    const totalRevenue = customerIncomes.reduce((sum, i) => sum + (i.amount || i.value || 0), 0);

    const sortedJobs = [...customerJobs].sort((a, b) => {
      const da = a.finalizedTime || a.deliveryDate || a.creationTime || a.createdAt || "";
      const db = b.finalizedTime || b.deliveryDate || b.creationTime || b.createdAt || "";
      return db.localeCompare(da);
    });
    const lastJobDate = sortedJobs[0]?.finalizedTime || sortedJobs[0]?.deliveryDate || sortedJobs[0]?.creationTime || sortedJobs[0]?.createdAt || "";

    return {
      id: customerId,
      name: customerName,
      document: c.cnpj || c.document || "",
      contact_person: c.contactName || c.contact_person || "",
      email: c.email || "",
      phone: c.phone || "",
      city: c.city || "",
      state: c.state || "",
      total_jobs: customerJobs.length,
      last_job_date: lastJobDate ? new Date(lastJobDate).toISOString().split("T")[0] : "",
      nps_score: null,
      nps_category: null,
      avg_satisfaction: 0,
      complaint_count: 0,
      open_complaints: 0,
      total_revenue: totalRevenue,
    };
  });
}

export function useCSHoldprintData(endpoints?: string[]) {
  return useQuery<CSHoldprintData>({
    queryKey: ["cs-holdprint-data", endpoints],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("cs-holdprint-data", {
        body: {
          endpoints: endpoints || ["customers", "jobs", "budgets", "incomes"],
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch Holdprint data");

      return {
        customers: (data.data?.customers || []) as HoldprintCustomer[],
        jobs: (data.data?.jobs || []) as HoldprintJob[],
        budgets: (data.data?.budgets || []) as HoldprintBudget[],
        incomes: (data.data?.incomes || []) as HoldprintIncome[],
        lastSync: data.lastSync,
        fetchedAt: data.fetchedAt,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
