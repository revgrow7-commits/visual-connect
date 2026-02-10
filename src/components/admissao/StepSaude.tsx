import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface Treinamento {
  tipo: string;
  dataRealizacao: Date | undefined;
  validadeMeses: string;
}

export interface SaudeData {
  exameStatus: string;
  exameData: Date | undefined;
  treinamentos: Treinamento[];
}

interface Props {
  data: SaudeData;
  onChange: (data: SaudeData) => void;
}

const nrs = ["NR1", "NR6", "NR10", "NR18", "NR35"];

const StepSaude = ({ data, onChange }: Props) => {
  const update = (field: keyof SaudeData, value: any) =>
    onChange({ ...data, [field]: value });

  const addTreinamento = () =>
    update("treinamentos", [...data.treinamentos, { tipo: "", dataRealizacao: undefined, validadeMeses: "" }]);

  const removeTreinamento = (i: number) =>
    update("treinamentos", data.treinamentos.filter((_, idx) => idx !== i));

  const updateTreinamento = (i: number, field: keyof Treinamento, value: any) => {
    const next = [...data.treinamentos];
    next[i] = { ...next[i], [field]: value };
    update("treinamentos", next);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Saúde Ocupacional e Treinamentos</h2>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-foreground">Exame Admissional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={data.exameStatus} onValueChange={(v) => update("exameStatus", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data do Exame</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.exameData && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.exameData ? format(data.exameData, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={data.exameData} onSelect={(d) => update("exameData", d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-foreground">Treinamentos de Segurança (NRs)</h3>

      {data.treinamentos.map((t, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Treinamento {i + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => removeTreinamento(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={t.tipo} onValueChange={(v) => updateTreinamento(i, "tipo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {nrs.map((nr) => <SelectItem key={nr} value={nr}>{nr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Realização</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !t.dataRealizacao && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {t.dataRealizacao ? format(t.dataRealizacao, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={t.dataRealizacao} onSelect={(d) => updateTreinamento(i, "dataRealizacao", d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Validade (meses)</Label>
              <Input type="number" value={t.validadeMeses} onChange={(e) => updateTreinamento(i, "validadeMeses", e.target.value)} placeholder="12" />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addTreinamento} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Adicionar Treinamento
      </Button>
    </div>
  );
};

export default StepSaude;
