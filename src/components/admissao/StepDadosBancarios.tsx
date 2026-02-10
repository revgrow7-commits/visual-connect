import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DadosBancariosData {
  banco: string;
  agencia: string;
  conta: string;
  contaTipo: string;
  pix: string;
}

interface Props {
  data: DadosBancariosData;
  onChange: (data: DadosBancariosData) => void;
}

const bancos = [
  "Banco do Brasil", "Bradesco", "Caixa Econômica", "Itaú", "Santander",
  "Nubank", "Inter", "Sicredi", "Banrisul", "Safra", "Outro",
];

const StepDadosBancarios = ({ data, onChange }: Props) => {
  const update = (field: keyof DadosBancariosData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Dados Bancários</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Banco *</Label>
          <Select value={data.banco} onValueChange={(v) => update("banco", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
            <SelectContent>
              {bancos.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Conta *</Label>
          <Select value={data.contaTipo} onValueChange={(v) => update("contaTipo", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corrente">Corrente</SelectItem>
              <SelectItem value="poupanca">Poupança</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agencia">Agência *</Label>
          <Input id="agencia" value={data.agencia} onChange={(e) => update("agencia", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conta">Conta *</Label>
          <Input id="conta" value={data.conta} onChange={(e) => update("conta", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pix">Chave PIX (opcional)</Label>
        <Input id="pix" value={data.pix} onChange={(e) => update("pix", e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
      </div>
    </div>
  );
};

export default StepDadosBancarios;
