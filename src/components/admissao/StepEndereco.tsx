import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export interface EnderecoData {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefoneCelular: string;
  emailPessoal: string;
  telefoneFixo: string;
}

interface Props {
  data: EnderecoData;
  onChange: (data: EnderecoData) => void;
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
};

const StepEndereco = ({ data, onChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const update = (field: keyof EnderecoData, value: string) =>
    onChange({ ...data, [field]: value });

  const buscarCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (!json.erro) {
        onChange({
          ...data,
          cep: formatCEP(digits),
          endereco: json.logradouro || data.endereco,
          bairro: json.bairro || data.bairro,
          cidade: json.localidade || data.cidade,
          estado: json.uf || data.estado,
        });
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Endereço e Contato</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <Input
            id="cep"
            value={data.cep}
            onChange={(e) => update("cep", formatCEP(e.target.value))}
            onBlur={(e) => buscarCEP(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
          {loading && <p className="text-xs text-muted-foreground">Buscando...</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="endereco">Endereço *</Label>
          <Input id="endereco" value={data.endereco} onChange={(e) => update("endereco", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero">Número *</Label>
          <Input id="numero" value={data.numero} onChange={(e) => update("numero", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input id="complemento" value={data.complemento} onChange={(e) => update("complemento", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro *</Label>
          <Input id="bairro" value={data.bairro} onChange={(e) => update("bairro", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade *</Label>
          <Input id="cidade" value={data.cidade} onChange={(e) => update("cidade", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Input id="estado" value={data.estado} onChange={(e) => update("estado", e.target.value)} maxLength={2} />
        </div>
      </div>

      <h3 className="font-semibold text-foreground pt-2">Contato</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefoneCelular">Telefone Celular *</Label>
          <Input id="telefoneCelular" value={data.telefoneCelular} onChange={(e) => update("telefoneCelular", formatPhone(e.target.value))} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emailPessoal">E-mail Pessoal *</Label>
          <Input id="emailPessoal" type="email" value={data.emailPessoal} onChange={(e) => update("emailPessoal", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefoneFixo">Telefone Fixo</Label>
          <Input id="telefoneFixo" value={data.telefoneFixo} onChange={(e) => update("telefoneFixo", formatPhone(e.target.value))} placeholder="Opcional" />
        </div>
      </div>
    </div>
  );
};

export default StepEndereco;
