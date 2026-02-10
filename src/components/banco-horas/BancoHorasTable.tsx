import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BancoHorasRow {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  unidade: string;
  pis: string;
  normais: string;
  faltas: string;
  ex60: string;
  ex80: string;
  ex100: string;
  bSaldo: string;
  bTotal: string;
  bCred: string;
  bDeb: string;
  carga: string;
  saldoDecimal: number;
}

interface TableProps {
  data: BancoHorasRow[];
  loading: boolean;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const BancoHorasTable = ({ data, loading }: TableProps) => (
  <Card>
    <CardHeader className="pb-2 px-4 pt-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {loading ? "Carregando..." : `${data.length} funcionário${data.length !== 1 ? "s" : ""}`}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="text-xs">Colaborador</TableHead>
              <TableHead className="text-xs">Setor</TableHead>
              <TableHead className="text-right text-xs">Normais</TableHead>
              <TableHead className="text-right text-xs">Carga</TableHead>
              <TableHead className="text-right text-xs">Faltas</TableHead>
              <TableHead className="text-right text-xs">Ex 60%</TableHead>
              <TableHead className="text-right text-xs">Ex 100%</TableHead>
              <TableHead className="text-right text-xs">Crédito</TableHead>
              <TableHead className="text-right text-xs">Débito</TableHead>
              <TableHead className="text-right text-xs">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-14" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground text-sm">
                  Nenhum dado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => (
                <TableRow key={c.id} className={c.saldoDecimal < -5 ? "bg-destructive/5" : ""}>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{getInitials(c.nome)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-xs whitespace-nowrap truncate max-w-[160px]">{c.nome}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{c.cargo}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.departamento}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs py-2">{c.normais}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground py-2">{c.carga}</TableCell>
                  <TableCell className={`text-right font-mono text-xs py-2 ${c.faltas !== "00:00" ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                    {c.faltas}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs py-2 ${c.ex60 !== "00:00" ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                    {c.ex60}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs py-2 ${c.ex100 !== "00:00" ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                    {c.ex100}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-emerald-600 py-2">{c.bCred}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-destructive py-2">{c.bDeb}</TableCell>
                  <TableCell className={`text-right font-mono text-xs font-bold py-2 ${c.saldoDecimal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {c.bSaldo}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

export default BancoHorasTable;
