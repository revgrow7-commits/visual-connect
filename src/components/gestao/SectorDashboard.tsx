import { useState, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";
import SectorCharts from "./SectorCharts";
import {
  Loader2, TrendingUp, TrendingDown, Users, Package, DollarSign,
  FileText, BarChart3, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight,
  Briefcase, Receipt, PieChart, MapPin
} from "lucide-react";

interface SectorDashboardProps {
  sector: string;
  sectorLabel: string;
}

const SECTOR_CONFIG: Record<string, {
  endpoints: string[];
  kpis: { key: string; label: string; icon: React.ElementType; color: string; extract: (items: any[]) => { value: string; detail: string } }[];
}> = {
  comercial: {
    endpoints: ["customers", "budgets"],
    kpis: [
      {
        key: "customers", label: "Clientes", icon: Users, color: "text-blue-600",
        extract: (items) => ({ value: String(items.length), detail: "cadastrados no sistema" }),
      },
      {
        key: "budgets", label: "Orçamentos", icon: FileText, color: "text-amber-600",
        extract: (items) => {
          const approved = items.filter((i: any) => (i.content_text || "").includes("Aprovado") || (i.content_text || "").includes("approved"));
          return { value: String(items.length), detail: `${approved.length} aprovados` };
        },
      },
      {
        key: "budgets", label: "Taxa de Conversão", icon: PieChart, color: "text-green-600",
        extract: (items) => {
          const approved = items.filter((i: any) => (i.content_text || "").includes("Aprovado") || (i.content_text || "").includes("approved"));
          const rate = items.length > 0 ? ((approved.length / items.length) * 100).toFixed(1) : "0";
          return { value: `${rate}%`, detail: `${approved.length}/${items.length} orçamentos` };
        },
      },
    ],
  },
  financeiro: {
    endpoints: ["expenses", "incomes"],
    kpis: [
      { key: "incomes", label: "Receitas", icon: TrendingUp, color: "text-green-600", extract: (items) => ({ value: String(items.length), detail: "lançamentos no período" }) },
      { key: "expenses", label: "Despesas", icon: TrendingDown, color: "text-red-600", extract: (items) => ({ value: String(items.length), detail: "lançamentos no período" }) },
    ],
  },
  operacao: {
    endpoints: ["jobs"],
    kpis: [
      { key: "jobs", label: "Jobs Total", icon: Briefcase, color: "text-blue-600", extract: (items) => { const done = items.filter((i: any) => (i.content_text || "").includes("Concluído") || (i.content_text || "").includes("completed")); return { value: String(items.length), detail: `${done.length} concluídos` }; } },
      { key: "jobs", label: "Concluídos", icon: Receipt, color: "text-green-600", extract: (items) => { const done = items.filter((i: any) => (i.content_text || "").includes("Concluído") || (i.content_text || "").includes("completed")); return { value: String(done.length), detail: `de ${items.length} no período` }; } },
    ],
  },
  compras: {
    endpoints: ["suppliers", "expenses"],
    kpis: [
      { key: "suppliers", label: "Fornecedores", icon: Package, color: "text-purple-600", extract: (items) => ({ value: String(items.length), detail: "cadastrados" }) },
      { key: "expenses", label: "Despesas", icon: TrendingDown, color: "text-red-600", extract: (items) => ({ value: String(items.length), detail: "lançamentos" }) },
    ],
  },
  contabil: {
    endpoints: ["expenses", "incomes"],
    kpis: [
      { key: "incomes", label: "Receitas Contábeis", icon: ArrowUpRight, color: "text-green-600", extract: (items) => ({ value: String(items.length), detail: "registros" }) },
      { key: "expenses", label: "Custos & Despesas", icon: ArrowDownRight, color: "text-red-600", extract: (items) => ({ value: String(items.length), detail: "registros" }) },
    ],
  },
  fiscal: {
    endpoints: ["expenses", "incomes"],
    kpis: [
      { key: "incomes", label: "Notas de Entrada", icon: ArrowUpRight, color: "text-green-600", extract: (items) => ({ value: String(items.length), detail: "no período" }) },
      { key: "expenses", label: "Notas de Saída", icon: ArrowDownRight, color: "text-red-600", extract: (items) => ({ value: String(items.length), detail: "no período" }) },
    ],
  },
  faturamento: {
    endpoints: ["incomes", "jobs"],
    kpis: [
      { key: "incomes", label: "Receitas", icon: DollarSign, color: "text-green-600", extract: (items) => ({ value: String(items.length), detail: "lançamentos" }) },
      { key: "jobs", label: "Jobs Concluídos", icon: Briefcase, color: "text-blue-600", extract: (items) => { const done = items.filter((i: any) => (i.content_text || "").includes("Concluído") || (i.content_text || "").includes("completed")); return { value: String(done.length), detail: `de ${items.length} total` }; } },
    ],
  },
  marketing: {
    endpoints: ["customers", "budgets"],
    kpis: [
      { key: "customers", label: "Base de Clientes", icon: Users, color: "text-blue-600", extract: (items) => ({ value: String(items.length), detail: "cadastrados" }) },
      { key: "budgets", label: "Propostas", icon: FileText, color: "text-amber-600", extract: (items) => ({ value: String(items.length), detail: "no período" }) },
    ],
  },
  cs: {
    endpoints: ["customers", "jobs"],
    kpis: [
      { key: "customers", label: "Clientes", icon: Users, color: "text-blue-600", extract: (items) => ({ value: String(items.length), detail: "na base" }) },
      { key: "jobs", label: "Jobs em Andamento", icon: Briefcase, color: "text-amber-600", extract: (items) => { const active = items.filter((i: any) => !(i.content_text || "").includes("Concluído") && !(i.content_text || "").includes("completed")); return { value: String(active.length), detail: `${items.length} total` }; } },
    ],
  },
  juridico: {
    endpoints: ["suppliers", "customers"],
    kpis: [
      { key: "customers", label: "Clientes (Contratos)", icon: Users, color: "text-blue-600", extract: (items) => ({ value: String(items.length), detail: "cadastrados" }) },
      { key: "suppliers", label: "Fornecedores (Contratos)", icon: Package, color: "text-purple-600", extract: (items) => ({ value: String(items.length), detail: "cadastrados" }) },
    ],
  },
};

const SectorDashboard = forwardRef<HTMLDivElement, SectorDashboardProps>(
  ({ sector, sectorLabel }, ref) => {
    const [unidade, setUnidade] = useState("todas");
    const config = SECTOR_CONFIG[sector] || SECTOR_CONFIG.comercial;

    const { data: rawData, isLoading, isError, refetch, isFetching } = useQuery({
      queryKey: ["sector-dashboard", sector, unidade],
      queryFn: async () => {
        const entries = await Promise.all(
          config.endpoints.map(async (ep) => {
            try {
              let query = supabase
                .from("holdprint_cache")
                .select("content_text, endpoint, record_id")
                .eq("endpoint", ep);

              if (unidade === "poa") {
                query = query.like("record_id", "poa_%");
              } else if (unidade === "sp") {
                query = query.like("record_id", "sp_%");
              }

              const { data, error } = await query
                .order("last_synced", { ascending: false })
                .limit(500);

              if (error) {
                console.warn(`Dashboard ${ep}:`, error.message);
                return [ep, []] as const;
              }
              return [ep, data || []] as const;
            } catch (e) {
              console.warn(`Dashboard ${ep} fetch failed:`, e);
              return [ep, []] as const;
            }
          })
        );
        return Object.fromEntries(entries) as Record<string, any[]>;
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    });

    const computedKpis = config.kpis.map((kpi) => {
      const items = rawData?.[kpi.key] || [];
      return { ...kpi, computed: kpi.extract(items) };
    });

    const hasData = rawData && Object.values(rawData).some((arr) => arr.length > 0);

    const handleSync = async () => {
      try {
        toast({ title: "Sincronizando...", description: "Buscando dados atualizados da Holdprint." });
        const res = await supabase.functions.invoke("holdprint-sync");
        if (res.error) throw res.error;
        toast({ title: "Sincronização concluída!", description: JSON.stringify(res.data?.synced) });
        refetch();
      } catch (e: any) {
        toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
      }
    };

    if (isLoading) {
      return (
        <div ref={ref} className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div ref={ref} className="space-y-6">
        {/* Sync bar + Unit filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {hasData ? "Dados sincronizados" : "Aguardando sincronização"}
            </Badge>
            {isError && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="h-3 w-3" /> Erro ao carregar
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={unidade}
              onValueChange={(v) => { if (v) setUnidade(v); }}
              size="sm"
              className="border rounded-lg p-0.5"
            >
              <ToggleGroupItem value="todas" className="text-xs px-3 gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <MapPin className="h-3 w-3" /> Todas
              </ToggleGroupItem>
              <ToggleGroupItem value="poa" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                POA
              </ToggleGroupItem>
              <ToggleGroupItem value="sp" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                SP
              </ToggleGroupItem>
            </ToggleGroup>

            <Button variant="outline" size="sm" onClick={handleSync} disabled={isFetching} className="gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={`grid gap-4 ${computedKpis.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
          {computedKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            const data = kpi.computed;
            return (
              <Card key={idx} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{data.value}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{data.detail}</p>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10" />
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <SectorCharts sector={sector} sectorLabel={sectorLabel} rawData={rawData} />

        {hasData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Últimos registros sincronizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {config.endpoints.map((ep) =>
                (rawData?.[ep] || []).slice(0, 5).map((item: any, i: number) => (
                  <div key={`${ep}-${i}`} className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-3 py-2">
                    <Badge variant="secondary" className="text-[10px] shrink-0">{ep}</Badge>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {(item.record_id || "").startsWith("poa_") ? "POA" : "SP"}
                    </Badge>
                    <span className="text-muted-foreground truncate">{item.content_text || "—"}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!hasData && !isError && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum dado sincronizado para <span className="font-medium">{sectorLabel}</span>.
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Clique em "Sincronizar" para popular o dashboard com dados reais.
              </p>
              <Button variant="outline" size="sm" onClick={handleSync} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Sincronizar agora
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

SectorDashboard.displayName = "SectorDashboard";

export default SectorDashboard;
