import { Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardsProps {
  total: number;
  totalSaldo: number;
  positivos: number;
  negativos: number;
  loading: boolean;
}

const formatHoras = (h: number) => {
  const sign = h < 0 ? "-" : "+";
  return `${sign}${Math.abs(h).toFixed(1)}h`;
};

const BancoHorasSummaryCards = ({ total, totalSaldo, positivos, negativos, loading }: SummaryCardsProps) => (
  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><Users className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="text-[11px] text-muted-foreground leading-none mb-1">Funcionários</p>
          <p className="text-xl font-bold leading-none">{loading ? "—" : total}</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><TrendingUp className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="text-[11px] text-muted-foreground leading-none mb-1">Saldo Total</p>
          <p className={`text-xl font-bold leading-none ${totalSaldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {loading ? "—" : formatHoras(totalSaldo)}
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
        <div>
          <p className="text-[11px] text-muted-foreground leading-none mb-1">Saldo Positivo</p>
          <p className="text-xl font-bold leading-none text-emerald-600">{loading ? "—" : positivos}</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-destructive/10 p-2"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
        <div>
          <p className="text-[11px] text-muted-foreground leading-none mb-1">Saldo Negativo</p>
          <p className="text-xl font-bold leading-none text-destructive">{loading ? "—" : negativos}</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default BancoHorasSummaryCards;
