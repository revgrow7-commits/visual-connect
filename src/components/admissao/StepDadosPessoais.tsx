import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface DadosPessoaisData {
  nome: string;
  sobrenome: string;
  dataNascimento: Date | undefined;
  sexo: string;
  estadoCivil: string;
  nacionalidade: string;
  naturalidadeCidade: string;
  naturalidadeUf: string;
  nomeMae: string;
  nomePai: string;
}

interface Props {
  data: DadosPessoaisData;
  onChange: (data: DadosPessoaisData) => void;
}

const StepDadosPessoais = ({ data, onChange }: Props) => {
  const update = (field: keyof DadosPessoaisData, value: any) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Dados Pessoais</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={data.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sobrenome">Sobrenome *</Label>
          <Input id="sobrenome" value={data.sobrenome} onChange={(e) => update("sobrenome", e.target.value)} placeholder="Seu sobrenome" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.dataNascimento && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.dataNascimento ? format(data.dataNascimento, "dd/MM/yyyy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={data.dataNascimento} onSelect={(d) => update("dataNascimento", d)} disabled={(d) => d > new Date()} className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Sexo *</Label>
          <Select value={data.sexo} onValueChange={(v) => update("sexo", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
              <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado Civil *</Label>
          <Select value={data.estadoCivil} onValueChange={(v) => update("estadoCivil", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
              <SelectItem value="casado">Casado(a)</SelectItem>
              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
              <SelectItem value="uniao_estavel">União Estável</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nacionalidade">Nacionalidade *</Label>
          <Input id="nacionalidade" value={data.nacionalidade} onChange={(e) => update("nacionalidade", e.target.value)} placeholder="Brasileira" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="naturalidadeCidade">Naturalidade — Cidade *</Label>
          <Input id="naturalidadeCidade" value={data.naturalidadeCidade} onChange={(e) => update("naturalidadeCidade", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="naturalidadeUf">UF *</Label>
          <Input id="naturalidadeUf" value={data.naturalidadeUf} onChange={(e) => update("naturalidadeUf", e.target.value)} maxLength={2} placeholder="RS" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nomeMae">Nome da Mãe *</Label>
          <Input id="nomeMae" value={data.nomeMae} onChange={(e) => update("nomeMae", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nomePai">Nome do Pai</Label>
          <Input id="nomePai" value={data.nomePai} onChange={(e) => update("nomePai", e.target.value)} placeholder="Opcional" />
        </div>
      </div>
    </div>
  );
};

export default StepDadosPessoais;
