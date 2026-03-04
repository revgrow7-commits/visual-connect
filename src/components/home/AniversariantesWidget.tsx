import { Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Aniversariante {
  id: string;
  nome: string;
  cargo: string | null;
  unidade: string | null;
  dia: number;
  mes: number;
  hoje: boolean;
}

const MESES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const getInitials = (nome: string) => {
  const parts = nome.split(" ").filter(Boolean);
  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
};

async function fetchAniversariantes(): Promise<Aniversariante[]> {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome, cargo, unidade, data_nascimento, status")
    .not("data_nascimento", "is", null)
    .eq("status", "ativo");

  if (error || !data) return [];

  const hoje = now.getDate();

  return data
    .map((c: any) => {
      const dn = new Date(c.data_nascimento + "T00:00:00");
      const dia = dn.getDate();
      const mes = dn.getMonth() + 1;
      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        unidade: c.unidade,
        dia,
        mes,
        hoje: mes === mesAtual && dia === hoje,
      };
    })
    .filter((a) => a.mes === mesAtual)
    .sort((a, b) => a.dia - b.dia);
}

const AniversariantesWidget = () => {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;

  const { data: aniversariantes = [], isLoading } = useQuery({
    queryKey: ["aniversariantes", mesAtual],
    queryFn: fetchAniversariantes,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="bg-card rounded-lg p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Cake className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Aniversariantes</h2>
        <span className="text-xs text-muted-foreground">{MESES[mesAtual]}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : aniversariantes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum aniversariante neste mês.
        </p>
      ) : (
        <div className="space-y-3">
          {aniversariantes.map((person) => (
            <div
              key={person.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                person.hoje ? "gradient-bordo-light" : "hover:bg-muted/50"
              )}
            >
              <Avatar className={cn(
                "h-9 w-9 shrink-0 border-2",
                person.hoje ? "border-primary" : "border-muted"
              )}>
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(person.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{person.nome}</p>
                  {person.hoje && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Hoje! 🎂
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {person.cargo || "—"} · {person.unidade || "—"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                {String(person.dia).padStart(2, "0")}/{String(person.mes).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AniversariantesWidget;
