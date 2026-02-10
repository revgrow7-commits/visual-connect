import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign } from "lucide-react";

export interface SalarioBeneficiosData {
  salarioBase: string;
  adicionais: string;
  vt: boolean;
  vrVa: boolean;
  planoSaude: boolean;
  wellhub: boolean;
  outros: string;
}

interface Props {
  data: SalarioBeneficiosData;
  onChange: (data: SalarioBeneficiosData) => void;
}

const formatCurrency = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const beneficios = [
  { key: "vt" as const, label: "Vale Transporte (VT)" },
  { key: "vrVa" as const, label: "Vale Refeição / Alimentação (VR/VA)" },
  { key: "planoSaude" as const, label: "Plano de Saúde" },
  { key: "wellhub" as const, label: "Wellhub (Gympass)" },
];

const StepSalarioBeneficios = ({ data, onChange }: Props) => {
  const update = (field: keyof SalarioBeneficiosData, value: any) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Dados Salariais e Benefícios</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informe os dados salariais e selecione os benefícios aplicáveis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salarioBase">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Salário Base *
          </Label>
          <Input
            id="salarioBase"
            value={data.salarioBase}
            onChange={(e) => update("salarioBase", formatCurrency(e.target.value))}
            placeholder="R$ 0,00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adicionais">Adicionais</Label>
          <Input
            id="adicionais"
            value={data.adicionais}
            onChange={(e) => update("adicionais", e.target.value)}
            placeholder="Insalubridade, periculosidade, etc."
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">Benefícios</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {beneficios.map((b) => (
            <div key={b.key} className="flex items-center gap-2">
              <Checkbox
                id={b.key}
                checked={data[b.key]}
                onCheckedChange={(checked) => update(b.key, !!checked)}
              />
              <Label htmlFor={b.key} className="text-sm cursor-pointer">
                {b.label}
              </Label>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <Label htmlFor="outros">Outros benefícios</Label>
          <Input
            id="outros"
            value={data.outros}
            onChange={(e) => update("outros", e.target.value)}
            placeholder="Descreva outros benefícios, se houver"
          />
        </div>
      </div>
    </div>
  );
};

export default StepSalarioBeneficios;
