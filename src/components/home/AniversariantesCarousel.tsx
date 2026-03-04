import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Aniversariante {
  id: string;
  nome: string;
  cargo: string | null;
  foto_url: string | null;
  dia: number;
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
  const hoje = now.getDate();

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome, cargo, data_nascimento, foto_url, status")
    .not("data_nascimento", "is", null)
    .eq("status", "ativo");

  if (error || !data) return [];

  return data
    .map((c: any) => {
      const dn = new Date(c.data_nascimento + "T00:00:00");
      const dia = dn.getDate();
      const mes = dn.getMonth() + 1;
      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        foto_url: c.foto_url,
        dia,
        mes,
        hoje: mes === mesAtual && dia === hoje,
      };
    })
    .filter((a) => a.mes === mesAtual)
    .sort((a, b) => a.dia - b.dia);
}

const AniversariantesCarousel = () => {
  const mesAtual = new Date().getMonth() + 1;

  const { data: aniversariantes = [] } = useQuery({
    queryKey: ["aniversariantes-carousel", mesAtual],
    queryFn: fetchAniversariantes,
    staleTime: 10 * 60 * 1000,
  });

  if (aniversariantes.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Cake className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Aniversariantes de {MESES[mesAtual]}
        </h3>
        <span className="text-xs text-muted-foreground">
          ({aniversariantes.length})
        </span>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-2">
          {aniversariantes.map((person) => (
            <div
              key={person.id}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[80px] p-2 rounded-lg transition-colors",
                person.hoje ? "gradient-bordo-light" : "hover:bg-muted/40"
              )}
            >
              <div className="relative">
                <Avatar className={cn(
                  "h-14 w-14 border-2",
                  person.hoje ? "border-primary ring-2 ring-primary/30" : "border-muted"
                )}>
                  {person.foto_url && (
                    <AvatarImage src={person.foto_url} alt={person.nome} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(person.nome)}
                  </AvatarFallback>
                </Avatar>
                {person.hoje && (
                  <span className="absolute -top-1 -right-1 text-sm">🎂</span>
                )}
              </div>
              <p className="text-[11px] font-medium text-foreground text-center leading-tight max-w-[76px] truncate">
                {person.nome.split(" ")[0]}
              </p>
              <span className="text-[10px] text-muted-foreground font-medium">
                {String(person.dia).padStart(2, "0")}/{String(mesAtual).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AniversariantesCarousel;
