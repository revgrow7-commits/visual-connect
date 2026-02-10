import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Eye, Monitor, Camera } from "lucide-react";

interface ComplianceData {
  lgpd: boolean;
  confidencialidade: boolean;
  monitoramento: boolean;
  imagem: boolean;
}

interface StepComplianceProps {
  data: ComplianceData;
  onChange: (data: ComplianceData) => void;
}

const terms = [
  {
    key: "lgpd" as const,
    icon: Shield,
    label: "LGPD — Obrigatório",
    required: true,
    text: "Declaro que li e concordo com o tratamento dos meus dados pessoais para fins de admissão e gestão do vínculo empregatício, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
  },
  {
    key: "confidencialidade" as const,
    icon: Eye,
    label: "Sigilo e Confidencialidade — Obrigatório",
    required: true,
    text: "Comprometo-me a manter absoluto sigilo e confidencialidade sobre todas as informações internas da empresa, incluindo dados de clientes, processos, estratégias, valores e quaisquer informações às quais terei acesso em razão do vínculo.",
  },
  {
    key: "monitoramento" as const,
    icon: Monitor,
    label: "Monitoramento — Obrigatório",
    required: true,
    text: "Estou ciente e concordo com as políticas de monitoramento e uso aceitável de sistemas, equipamentos e recursos corporativos da Indústria Visual.",
  },
  {
    key: "imagem" as const,
    icon: Camera,
    label: "Autorização de Uso de Imagem — Opcional",
    required: false,
    text: "Autorizo a Indústria Visual a utilizar minha imagem e voz em materiais de comunicação interna e externa, incluindo redes sociais e materiais institucionais.",
  },
];

const StepCompliance = ({ data, onChange }: StepComplianceProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-foreground">Termos de Compliance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Leia e aceite os termos obrigatórios antes de prosseguir.
        </p>
      </div>

      {terms.map((term) => {
        const Icon = term.icon;
        return (
          <div
            key={term.key}
            className="rounded-lg border bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                {term.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {term.text}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id={term.key}
                checked={data[term.key]}
                onCheckedChange={(checked) =>
                  onChange({ ...data, [term.key]: !!checked })
                }
              />
              <Label htmlFor={term.key} className="text-sm cursor-pointer">
                {term.required ? "Li e concordo" : "Autorizo o uso da minha imagem"}
              </Label>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepCompliance;
