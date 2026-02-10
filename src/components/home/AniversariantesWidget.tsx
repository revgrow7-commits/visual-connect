import { Cake } from "lucide-react";
import { cn } from "@/lib/utils";

interface Aniversariante {
  id: string;
  nome: string;
  cargo: string;
  unidade: string;
  dia: number;
  mes: number;
  hoje: boolean;
}

const mockAniversariantes: Aniversariante[] = [
  { id: "1", nome: "Ana Rodrigues", cargo: "Designer", unidade: "POA", dia: 10, mes: 2, hoje: true },
  { id: "2", nome: "Bruno Costa", cargo: "Instalador", unidade: "SP", dia: 12, mes: 2, hoje: false },
  { id: "3", nome: "Carla Mendes", cargo: "Comercial", unidade: "POA", dia: 15, mes: 2, hoje: false },
  { id: "4", nome: "Diego Lima", cargo: "Projetista", unidade: "SP", dia: 18, mes: 2, hoje: false },
  { id: "5", nome: "Elisa Ferreira", cargo: "Financeiro", unidade: "POA", dia: 22, mes: 2, hoje: false },
];

const AniversariantesWidget = () => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Cake className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Aniversariantes</h2>
        <span className="text-xs text-muted-foreground">Fevereiro</span>
      </div>
      <div className="space-y-3">
        {mockAniversariantes.map((person) => (
          <div
            key={person.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors",
              person.hoje ? "gradient-bordo-light" : "hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              person.hoje ? "gradient-bordo text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {person.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{person.nome}</p>
                {person.hoje && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    Hoje! 🎂
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{person.cargo} · {person.unidade}</p>
            </div>
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              {String(person.dia).padStart(2, "0")}/{String(person.mes).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AniversariantesWidget;
