import { UserPlus } from "lucide-react";

interface NovoColaborador {
  id: string;
  nome: string;
  cargo: string;
  unidade: string;
  dataAdmissao: string;
}

const mockNovos: NovoColaborador[] = [
  { id: "1", nome: "Fernanda Oliveira", cargo: "Analista de RH", unidade: "POA", dataAdmissao: "03 Fev 2026" },
  { id: "2", nome: "Gabriel Santos", cargo: "Técnico de Instalação", unidade: "SP", dataAdmissao: "01 Fev 2026" },
  { id: "3", nome: "Helena Costa", cargo: "Designer Gráfico", unidade: "POA", dataAdmissao: "27 Jan 2026" },
];

const NovosColaboradores = () => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-success" />
        <h2 className="text-lg font-bold text-foreground">Novos no Time</h2>
      </div>
      <div className="space-y-3">
        {mockNovos.map((person) => (
          <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{person.nome}</p>
              <p className="text-[11px] text-muted-foreground">{person.cargo} · {person.unidade}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{person.dataAdmissao}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NovosColaboradores;
