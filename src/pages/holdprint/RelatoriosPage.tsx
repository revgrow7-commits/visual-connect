import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import BudgetAgentChat from "@/components/holdprint/BudgetAgentChat";
import {
  BarChart3, DollarSign, FileText, TrendingUp,
  Calculator, PieChart, ArrowRightLeft, ClipboardCheck,
  Activity, Receipt, RefreshCw,
} from "lucide-react";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const categories: { label: string; emoji: string; cards: ReportCard[] }[] = [
  {
    label: "Produção",
    emoji: "🏭",
    cards: [
      { title: "Relatório de Jobs", description: "Jobs aprovados POA e SP com status financeiro", icon: FileText, path: "/holdprint/relatorios/jobs-aprovados" },
    ],
  },
  {
    label: "Financeiro",
    emoji: "💰",
    cards: [
      { title: "Fluxo de Caixa", description: "Entradas e saídas financeiras", icon: DollarSign, path: "/holdprint/relatorios/fluxo-caixa" },
      { title: "Notas Fiscais", description: "Emissão e controle de NFs", icon: FileText, path: "/holdprint/relatorios/notas-fiscais" },
      { title: "Controle de Comissões", description: "Comissões por vendedor", icon: Receipt, path: "/holdprint/relatorios/comissoes" },
    ],
  },
  {
    label: "Vendas",
    emoji: "📈",
    cards: [
      { title: "Vendas por Período", description: "Análise temporal de vendas", icon: TrendingUp, path: "/holdprint/relatorios/vendas-periodo" },
      { title: "Análise e Estatística", description: "Dados estatísticos de vendas", icon: BarChart3, path: "/holdprint/relatorios/vendas-analise" },
      { title: "Lucratividade por Produto", description: "Margem por item produzido", icon: PieChart, path: "/holdprint/relatorios/lucratividade" },
    ],
  },
  {
    label: "Gerencial",
    emoji: "📊",
    cards: [
      { title: "Ponto de Equilíbrio", description: "Break-even e projeções", icon: Activity, path: "/holdprint/relatorios/ponto-equilibrio" },
      { title: "Check-UP", description: "Diagnóstico da operação", icon: ClipboardCheck, path: "/holdprint/relatorios/checkup" },
      { title: "Pagos x Recebidos", description: "Comparativo financeiro", icon: ArrowRightLeft, path: "/holdprint/relatorios/pagos-recebidos" },
      { title: "DRE", description: "Demonstrativo de resultados", icon: Calculator, path: "/holdprint/relatorios/dre" },
    ],
  },
];

export default function HoldprintRelatoriosPage() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("holdprint-sync", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      toast({
        title: "Sincronização iniciada",
        description: data?.message || "Os dados estão sendo importados da Holdprint.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro na sincronização",
        description: (err as Error).message || "Não foi possível sincronizar.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Hub de relatórios do Holdprint ERP</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Importando..." : "Importar da Holdprint"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report cards - left 2 cols */}
        <div className="lg:col-span-2 space-y-8">
          {categories.map((cat) => (
            <div key={cat.label}>
              <h2 className="text-lg font-semibold mb-3">{cat.emoji} {cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.cards.map((c) => (
                  <Link key={c.path} to={c.path}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                          <c.icon className="h-5 w-5 text-primary" />
                          {c.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{c.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Agent - fixed right col */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <BudgetAgentChat embedded />
          </div>
        </div>
      </div>
    </div>
  );
}
