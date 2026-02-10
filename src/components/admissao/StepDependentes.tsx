import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface Dependente {
  nome: string;
  parentesco: string;
  dataNascimento: Date | undefined;
  cpf: string;
}

interface Props {
  data: Dependente[];
  onChange: (data: Dependente[]) => void;
}

const emptyDep: Dependente = { nome: "", parentesco: "", dataNascimento: undefined, cpf: "" };

const StepDependentes = ({ data, onChange }: Props) => {
  const add = () => onChange([...data, { ...emptyDep }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Dependente, value: any) => {
    const next = [...data];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Dependentes</h2>
      <p className="text-sm text-muted-foreground text-center">Adicione seus dependentes, se houver.</p>

      {data.map((dep, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">Dependente {i + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={dep.nome} onChange={(e) => update(i, "nome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Select value={dep.parentesco} onValueChange={(v) => update(i, "parentesco", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="filho">Filho(a)</SelectItem>
                  <SelectItem value="conjuge">Cônjuge</SelectItem>
                  <SelectItem value="pai_mae">Pai/Mãe</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dep.dataNascimento && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dep.dataNascimento ? format(dep.dataNascimento, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dep.dataNascimento} onSelect={(d) => update(i, "dataNascimento", d)} disabled={(d) => d > new Date()} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={dep.cpf} onChange={(e) => update(i, "cpf", e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Adicionar Dependente
      </Button>
    </div>
  );
};

export default StepDependentes;
