import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  BarChart3, DollarSign, FileText, TrendingUp,
  Calculator, PieChart, ArrowRightLeft, ClipboardCheck,
  Activity, Receipt,
} from "lucide-react";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const categories: { label: string; emoji: string; cards: ReportCard[] }[] = [
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
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Hub de relatórios do Holdprint ERP</p>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat.label}>
          <h2 className="text-lg font-semibold mb-3">{cat.emoji} {cat.label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
}
