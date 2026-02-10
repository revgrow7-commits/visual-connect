import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
  // Conditional AVSEC
  avsecCredencial: string;
  avsecValidade: Date | undefined;
  // Conditional Antecedentes
  antecedentesStatus: string;
  antecedentesDataEmissao: Date | undefined;
}

interface Props {
  data: DocumentosData;
  onChange: (data: DocumentosData) => void;
  tipoContratacao?: string;
  cargo?: string;
  unidade?: string;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const validateCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
};

const ExpiryWarning = ({ date }: { date: Date | undefined }) => {
  if (!date) return null;
  const days = differenceInDays(date, new Date());
  if (days < 0) return <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Vencido</span>;
  if (days <= 60) return <span className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Vence em {days} dias</span>;
  return null;
};

const StepDocumentos = ({ data, onChange, tipoContratacao, cargo, unidade }: Props) => {
  const update = (field: keyof DocumentosData, value: any) =>
    onChange({ ...data, [field]: value });

  const cpfDigits = data.cpf.replace(/\D/g, "");
  const cpfValid = cpfDigits.length === 11 ? validateCPF(data.cpf) : true;

  const isCLT = tipoContratacao === "clt";
  const needsCNH = cargo?.toLowerCase().includes("motorista") || cargo?.toLowerCase().includes("direção");
  const needsAVSEC = unidade?.toLowerCase().includes("aeroporto") || cargo?.toLowerCase().includes("aeroporto");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Documentos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={data.cpf}
            onChange={(e) => update("cpf", formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className={cn(!cpfValid && "border-destructive")}
          />
          {!cpfValid && <p className="text-xs text-destructive">CPF inválido</p>}
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

      <h3 className="font-semibold text-foreground pt-2">
        CTPS {isCLT && <span className="text-destructive text-xs ml-1">(Obrigatório para CLT)</span>}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ctpsNumero">Número {isCLT && "*"}</Label>
          <Input id="ctpsNumero" value={data.ctpsNumero} onChange={(e) => update("ctpsNumero", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctpsSerie">Série {isCLT && "*"}</Label>
          <Input id="ctpsSerie" value={data.ctpsSerie} onChange={(e) => update("ctpsSerie", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctpsUf">UF {isCLT && "*"}</Label>
          <Input id="ctpsUf" value={data.ctpsUf} onChange={(e) => update("ctpsUf", e.target.value)} maxLength={2} />
        </div>
      </div>

      <h3 className="font-semibold text-foreground pt-2">
        CNH {needsCNH && <span className="text-destructive text-xs ml-1">(Obrigatório para este cargo)</span>}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnhNumero">Número {needsCNH && "*"}</Label>
          <Input id="cnhNumero" value={data.cnhNumero} onChange={(e) => update("cnhNumero", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Categoria {needsCNH && "*"}</Label>
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
          <Label>Validade {needsCNH && "*"}</Label>
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
          <ExpiryWarning date={data.cnhValidade} />
        </div>
      </div>

      {needsAVSEC && (
        <>
          <h3 className="font-semibold text-foreground pt-2">
            AVSEC <span className="text-destructive text-xs ml-1">(Obrigatório para este cargo/unidade)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avsecCredencial">Credencial AVSEC *</Label>
              <Input id="avsecCredencial" value={data.avsecCredencial} onChange={(e) => update("avsecCredencial", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Validade AVSEC *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.avsecValidade && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.avsecValidade ? format(data.avsecValidade, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data.avsecValidade} onSelect={(d) => update("avsecValidade", d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <ExpiryWarning date={data.avsecValidade} />
            </div>
          </div>
        </>
      )}

      <h3 className="font-semibold text-foreground pt-2">Antecedentes Criminais</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={data.antecedentesStatus} onValueChange={(v) => update("antecedentesStatus", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nao_enviado">Não enviado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data de Emissão</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.antecedentesDataEmissao && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.antecedentesDataEmissao ? format(data.antecedentesDataEmissao, "dd/MM/yyyy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={data.antecedentesDataEmissao} onSelect={(d) => update("antecedentesDataEmissao", d)} disabled={(d) => d > new Date()} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default StepDocumentos;
