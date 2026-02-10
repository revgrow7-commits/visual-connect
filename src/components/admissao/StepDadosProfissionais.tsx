import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DadosProfissionaisData {
  cargo: string;
  setor: string;
  unidade: string;
  tipoContratacao: string;
  dataAdmissao: Date | undefined;
  jornada: string;
  horario: string;
  escala: string;
}

interface Props {
  data: DadosProfissionaisData;
  onChange: (data: DadosProfissionaisData) => void;
}

const StepDadosProfissionais = ({ data, onChange }: Props) => {
  const update = (field: keyof DadosProfissionaisData, value: any) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Dados Profissionais</h2>
      <p className="text-sm text-muted-foreground text-center">Confirme os dados pré-preenchidos pelo RH.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo / Função *</Label>
          <Input id="cargo" value={data.cargo} onChange={(e) => update("cargo", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setor">Setor / Departamento *</Label>
          <Input id="setor" value={data.setor} onChange={(e) => update("setor", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unidade *</Label>
          <Select value={data.unidade} onValueChange={(v) => update("unidade", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="poa">Porto Alegre</SelectItem>
              <SelectItem value="sp">São Paulo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Contratação *</Label>
          <Select value={data.tipoContratacao} onValueChange={(v) => update("tipoContratacao", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clt">CLT</SelectItem>
              <SelectItem value="pj">PJ</SelectItem>
              <SelectItem value="estagio">Estágio</SelectItem>
              <SelectItem value="temporario">Temporário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Admissão *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.dataAdmissao && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.dataAdmissao ? format(data.dataAdmissao, "dd/MM/yyyy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={data.dataAdmissao} onSelect={(d) => update("dataAdmissao", d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="jornada">Jornada *</Label>
          <Input id="jornada" value={data.jornada} onChange={(e) => update("jornada", e.target.value)} placeholder="44h semanais" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="horario">Horário *</Label>
          <Input id="horario" value={data.horario} onChange={(e) => update("horario", e.target.value)} placeholder="08:00 às 17:48" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="escala">Escala</Label>
          <Input id="escala" value={data.escala} onChange={(e) => update("escala", e.target.value)} placeholder="Se houver, ex: 12x36" />
        </div>
      </div>
    </div>
  );
};

export default StepDadosProfissionais;
