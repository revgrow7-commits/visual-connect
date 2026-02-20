import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

const titles: Record<string, string> = {
  "fluxo-caixa": "Fluxo de Caixa",
  "notas-fiscais": "Notas Fiscais",
  comissoes: "Controle de Comissões",
  "vendas-periodo": "Vendas por Período",
  "vendas-analise": "Análise e Estatística",
  lucratividade: "Lucratividade por Produto",
  "ponto-equilibrio": "Ponto de Equilíbrio",
  checkup: "Check-UP",
  "pagos-recebidos": "Pagos x Recebidos",
  dre: "DRE",
};

export default function HoldprintRelatorioDetalhe() {
  const { slug } = useParams();
  const title = titles[slug || ""] || "Relatório";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">Conectando dados...</p>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
