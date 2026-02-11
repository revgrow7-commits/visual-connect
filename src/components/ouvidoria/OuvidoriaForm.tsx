import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, Upload } from "lucide-react";

const SETORES = [
  "Comercial", "Marketing", "PCP / Planejamento", "Impressão",
  "Acabamentos", "Instalação", "Logística", "RH & DP",
  "Financeiro", "Diretoria", "Outro",
];

const CATEGORIAS = [
  {
    id: "critico",
    emoji: "🔴",
    label: "Incidente Crítico",
    desc: "Risco à segurança, acidente, assédio, risco jurídico, impacto cliente estratégico",
    color: "border-destructive bg-destructive/5 data-[active=true]:bg-destructive/15 data-[active=true]:ring-2 data-[active=true]:ring-destructive",
  },
  {
    id: "operacional",
    emoji: "🟠",
    label: "Incidente Operacional Relevante",
    desc: "Retrabalho, erro orçamento, checklist, atraso evento, fornecedor",
    color: "border-warning bg-warning/5 data-[active=true]:bg-warning/15 data-[active=true]:ring-2 data-[active=true]:ring-warning",
  },
  {
    id: "estrategico",
    emoji: "🔵",
    label: "Sugestão Estratégica",
    desc: "Melhoria processo, redução custo, inovação Smart Signage",
    color: "border-info bg-info/5 data-[active=true]:bg-info/15 data-[active=true]:ring-2 data-[active=true]:ring-info",
  },
  {
    id: "clima",
    emoji: "🟢",
    label: "Clima / Cultura",
    desc: "Liderança, ambiente, sobrecarga, conflitos",
    color: "border-success bg-success/5 data-[active=true]:bg-success/15 data-[active=true]:ring-2 data-[active=true]:ring-success",
  },
];

const URGENCIAS = [
  { id: "baixa", label: "Baixa", cls: "bg-muted text-foreground data-[active=true]:bg-success data-[active=true]:text-success-foreground" },
  { id: "media", label: "Média", cls: "bg-muted text-foreground data-[active=true]:bg-info data-[active=true]:text-info-foreground" },
  { id: "alta", label: "Alta", cls: "bg-muted text-foreground data-[active=true]:bg-warning data-[active=true]:text-warning-foreground" },
  { id: "critica", label: "Crítica", cls: "bg-muted text-foreground data-[active=true]:bg-destructive data-[active=true]:text-destructive-foreground" },
];

const MIN_DESC = 200;

const OuvidoriaForm = () => {
  const [step, setStep] = useState(0);
  const [unidade, setUnidade] = useState("");
  const [setor, setSetor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [anonimo, setAnonimo] = useState(true);
  const [nome, setNome] = useState("");
  const [setorId, setSetorId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [emailId, setEmailId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [urgencia, setUrgencia] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 7;
  const canNext = () => {
    switch (step) {
      case 0: return !!unidade;
      case 1: return !!setor;
      case 2: return !!categoria;
      case 3: return anonimo || (!!nome && !!emailId);
      case 4: return descricao.length >= MIN_DESC;
      case 5: return !!urgencia;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = () => setSubmitted(true);

  if (submitted) {
    return (
      <Card className="border-success">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          <h3 className="text-2xl font-bold text-foreground">Manifestação Enviada</h3>
          <div className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
            <p>✔ Protocolo gerado: <span className="font-mono font-bold text-foreground">OUV-{Date.now().toString(36).toUpperCase()}</span></p>
            <p>✔ Prazo estimado: {categoria === "critico" ? "24–48h" : "5–7 dias úteis"}</p>
            <p>✔ Sua manifestação será triada e encaminhada de acordo com o fluxo interno da Ouvidoria Estratégica.</p>
          </div>
          <Button variant="outline" onClick={() => { setSubmitted(false); setStep(0); setDescricao(""); setCategoria(""); setUrgencia(""); }}>
            Nova Manifestação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registrar Manifestação</CardTitle>
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Etapa {step + 1} de {totalSteps}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0 - Unidade */}
          {step === 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Unidade</Label>
              <RadioGroup value={unidade} onValueChange={setUnidade} className="flex flex-col gap-2">
                {["Porto Alegre (POA)", "São Paulo (SP)", "Ambos"].map((u) => (
                  <div key={u} className="flex items-center gap-2">
                    <RadioGroupItem value={u} id={u} />
                    <Label htmlFor={u} className="cursor-pointer">{u}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 1 - Setor */}
          {step === 1 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Setor</Label>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {SETORES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2 - Tipo */}
          {step === 2 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tipo de Manifestação</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.id}
                    data-active={categoria === cat.id}
                    onClick={() => setCategoria(cat.id)}
                    className={cn(
                      "rounded-lg border-2 p-4 text-left transition-all",
                      cat.color
                    )}
                  >
                    <p className="font-semibold text-sm">{cat.emoji} {cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 - Identificação */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Identificação</Label>
              <div className="flex items-center gap-3">
                <Switch checked={!anonimo} onCheckedChange={(v) => setAnonimo(!v)} />
                <span className="text-sm">{anonimo ? "Enviar de forma anônima" : "Quero me identificar"}</span>
              </div>
              {!anonimo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Setor</Label>
                    <Input value={setorId} onChange={(e) => setSetorId(e.target.value)} placeholder="Seu setor" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Unidade</Label>
                    <Input value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} placeholder="Sua unidade" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email interno</Label>
                    <Input type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} placeholder="seu@email.com" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4 - Descrição */}
          {step === 4 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Descrição</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a situação com o máximo de detalhes possível..."
                className="min-h-[160px]"
              />
              <div className="flex justify-between text-xs">
                <span className={descricao.length < MIN_DESC ? "text-destructive" : "text-success"}>
                  {descricao.length < MIN_DESC
                    ? `Mínimo ${MIN_DESC} caracteres (faltam ${MIN_DESC - descricao.length})`
                    : "✓ Quantidade mínima atingida"}
                </span>
                <span className="text-muted-foreground">{descricao.length} caracteres</span>
              </div>
            </div>
          )}

          {/* Step 5 - Urgência */}
          {step === 5 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Grau de Urgência</Label>
              <div className="flex flex-wrap gap-2">
                {URGENCIAS.map((u) => (
                  <button
                    key={u.id}
                    data-active={urgencia === u.id}
                    onClick={() => setUrgencia(u.id)}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-medium transition-all",
                      u.cls
                    )}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6 - Anexos */}
          {step === 6 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Anexos (opcional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">Imagens, PDF ou Vídeo</p>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Voltar
            </Button>
            {step < totalSteps - 1 ? (
              <Button disabled={!canNext()} onClick={() => setStep(step + 1)}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2">
                Enviar para Ouvidoria Estratégica
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default OuvidoriaForm;
