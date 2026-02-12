import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Users, Package, DollarSign, FileText, BarChart3 } from "lucide-react";

interface SectorDashboardProps {
  sector: string;
  sectorLabel: string;
}

const SECTOR_ENDPOINTS: Record<string, string[]> = {
  comercial: ["customers", "budgets"],
  financeiro: ["expenses", "incomes"],
  operacao: ["jobs"],
  compras: ["suppliers", "expenses"],
  contabil: ["expenses", "incomes"],
  fiscal: ["expenses", "incomes"],
  faturamento: ["incomes", "jobs"],
  marketing: ["customers", "budgets"],
  cs: ["customers", "jobs"],
  juridico: ["suppliers", "customers"],
};

const ENDPOINT_ICONS: Record<string, React.ElementType> = {
  customers: Users,
  suppliers: Package,
  budgets: FileText,
  jobs: BarChart3,
  expenses: TrendingDown,
  incomes: TrendingUp,
};

const ENDPOINT_LABELS: Record<string, string> = {
  customers: "Clientes",
  suppliers: "Fornecedores",
  budgets: "Orçamentos",
  jobs: "Jobs / Produção",
  expenses: "Despesas",
  incomes: "Receitas",
};

const SectorDashboard = ({ sector, sectorLabel }: SectorDashboardProps) => {
  const endpoints = SECTOR_ENDPOINTS[sector] || ["customers", "budgets", "jobs"];

  const { data: stats, isLoading } = useQuery({
    queryKey: ["sector-dashboard", sector],
    queryFn: async () => {
      const results: Record<string, { total: number; sample: any[] }> = {};

      for (const ep of endpoints) {
        const { data, count } = await supabase
          .from("holdprint_cache")
          .select("raw_data, content_text", { count: "exact" })
          .eq("endpoint", ep)
          .limit(5);

        results[ep] = { total: count || 0, sample: data || [] };
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = stats && Object.values(stats).some((s) => s.total > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {endpoints.map((ep) => {
          const Icon = ENDPOINT_ICONS[ep] || FileText;
          const total = stats?.[ep]?.total || 0;
          return (
            <Card key={ep} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ENDPOINT_LABELS[ep] || ep}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  registros sincronizados
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent data preview */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Últimos registros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {endpoints.map((ep) =>
              stats?.[ep]?.sample.map((item: any, i: number) => (
                <div
                  key={`${ep}-${i}`}
                  className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2"
                >
                  {item.content_text || JSON.stringify(item.raw_data).slice(0, 120)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {!hasData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum dado sincronizado ainda para {sectorLabel}.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Execute a sincronização Holdprint para popular o dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SectorDashboard;
