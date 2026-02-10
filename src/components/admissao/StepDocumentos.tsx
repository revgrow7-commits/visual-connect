import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DocumentosData {
  cpf: string;
  rg: string;
  rgOrgao: string;
  rgUf: string;
  rgDataEmissao: Date | undefined;
  pisPasep: string;
  tituloEleitor: string;
  ctpsNumero: string;
  ctpsSerie: string;
  ctpsUf: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhValidade: Date | undefined;
}

interface Props {
  data: DocumentosData;
  onChange: (data: DocumentosData) => void;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const StepDocumentos = ({ data, onChange }: Props) => {
  const update = (field: keyof DocumentosData, value: any) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Documentos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input id="cpf" value={data.cpf} onChange={(e) => update("cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pisPasep">PIS/PASEP/NIS *</Label>
          <Input id="pisPasep" value={data.pisPasep} onChange={(e) => update("pisPasep", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rg">RG *</Label>
          <Input id="rg" value={data.rg} onChange={(e) => update("rg", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rgOrgao">Órgão Emissor *</Label>
          <Input id="rgOrgao" value={data.rgOrgao} onChange={(e) => update("rgOrgao", e.target.value)} placeholder="SSP" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rgUf">UF *</Label>
          <Input id="rgUf" value={data.rgUf} onChange={(e) => update("rgUf", e.target.value)} maxLength={2} placeholder="RS" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Emissão RG</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.rgDataEmissao && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.rgDataEmissao ? format(data.rgDataEmissao, "dd/MM/yyyy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={data.rgDataEmissao} onSelect={(d) => update("rgDataEmissao", d)} disabled={(d) => d > new Date()} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tituloEleitor">Título de Eleitor *</Label>
          <Input id="tituloEleitor" value={data.tituloEleitor} onChange={(e) => update("tituloEleitor", e.target.value)} />
        </div>
      </div>

      <h3 className="font-semibold text-foreground pt-2">CTPS</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ctpsNumero">Número</Label>
          <Input id="ctpsNumero" value={data.ctpsNumero} onChange={(e) => update("ctpsNumero", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctpsSerie">Série</Label>
          <Input id="ctpsSerie" value={data.ctpsSerie} onChange={(e) => update("ctpsSerie", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctpsUf">UF</Label>
          <Input id="ctpsUf" value={data.ctpsUf} onChange={(e) => update("ctpsUf", e.target.value)} maxLength={2} />
        </div>
      </div>

      <h3 className="font-semibold text-foreground pt-2">CNH</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnhNumero">Número</Label>
          <Input id="cnhNumero" value={data.cnhNumero} onChange={(e) => update("cnhNumero", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={data.cnhCategoria} onValueChange={(v) => update("cnhCategoria", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {["A", "B", "AB", "C", "D", "E"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Validade</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.cnhValidade && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.cnhValidade ? format(data.cnhValidade, "dd/MM/yyyy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={data.cnhValidade} onSelect={(d) => update("cnhValidade", d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default StepDocumentos;
