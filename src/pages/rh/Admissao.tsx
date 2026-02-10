import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import StepCompliance from "@/components/admissao/StepCompliance";
import StepDadosPessoais, { type DadosPessoaisData } from "@/components/admissao/StepDadosPessoais";
import StepDocumentos, { type DocumentosData } from "@/components/admissao/StepDocumentos";
import StepEndereco, { type EnderecoData } from "@/components/admissao/StepEndereco";
import StepDadosProfissionais, { type DadosProfissionaisData } from "@/components/admissao/StepDadosProfissionais";
import StepDadosBancarios, { type DadosBancariosData } from "@/components/admissao/StepDadosBancarios";
import StepDependentes, { type Dependente } from "@/components/admissao/StepDependentes";
import StepSaude, { type SaudeData } from "@/components/admissao/StepSaude";
import StepRevisao from "@/components/admissao/StepRevisao";

const steps = [
  "Compliance",
  "Dados Pessoais",
  "Documentos",
  "Endereço",
  "Profissional",
  "Bancário",
  "Dependentes",
  "Saúde",
  "Revisão",
];

const RhAdmissaoPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [compliance, setCompliance] = useState({
    lgpd: false, confidencialidade: false, monitoramento: false, imagem: false,
  });

  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoaisData>({
    nome: "", sobrenome: "", dataNascimento: undefined, sexo: "", estadoCivil: "",
    nacionalidade: "", naturalidadeCidade: "", naturalidadeUf: "", nomeMae: "", nomePai: "",
  });

  const [documentos, setDocumentos] = useState<DocumentosData>({
    cpf: "", rg: "", rgOrgao: "", rgUf: "", rgDataEmissao: undefined, pisPasep: "",
    tituloEleitor: "", ctpsNumero: "", ctpsSerie: "", ctpsUf: "",
    cnhNumero: "", cnhCategoria: "", cnhValidade: undefined,
  });

  const [endereco, setEndereco] = useState<EnderecoData>({
    cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
    telefoneCelular: "", emailPessoal: "", telefoneFixo: "",
  });

  const [profissionais, setProfissionais] = useState<DadosProfissionaisData>({
    cargo: "", setor: "", unidade: "", tipoContratacao: "", dataAdmissao: undefined, jornada: "", horario: "",
  });

  const [bancarios, setBancarios] = useState<DadosBancariosData>({
    banco: "", agencia: "", conta: "", contaTipo: "", pix: "",
  });

  const [dependentes, setDependentes] = useState<Dependente[]>([]);

  const [saude, setSaude] = useState<SaudeData>({
    exameStatus: "", exameData: undefined, treinamentos: [],
  });

  const [confirmacao, setConfirmacao] = useState({
    dadosVerdadeiros: false, termosAceitos: false,
  });

  const canAdvanceFromCompliance = compliance.lgpd && compliance.confidencialidade && compliance.monitoramento;

  const canSubmit = confirmacao.dadosVerdadeiros && confirmacao.termosAceitos;

  const next = () => {
    if (currentStep === 0 && !canAdvanceFromCompliance) {
      toast({ title: "Termos obrigatórios", description: "Aceite todos os termos obrigatórios para continuar.", variant: "destructive" });
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  };

  const prev = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  const submit = () => {
    if (!canSubmit) {
      toast({ title: "Confirmação necessária", description: "Marque as confirmações para enviar.", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Formulário enviado!", description: "Seus dados foram enviados ao RH com sucesso." });
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Formulário Enviado!</h1>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          Seus dados foram enviados com sucesso para o RH. Você receberá um e-mail de confirmação em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formulário de Pré-Admissão</h1>
          <p className="text-sm text-muted-foreground mt-1">Preencha todas as etapas para concluir sua admissão.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/rh/gerar-link")}>
          <Link2 className="h-4 w-4 mr-2" /> Gerar Link de Formulário
        </Button>
      </div>

      {/* Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-primary">
            Etapa {currentStep + 1} de {steps.length}: {steps[currentStep]}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => {
                if (i === 0 || (i > 0 && canAdvanceFromCompliance)) setCurrentStep(i);
              }}
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : i < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && <StepCompliance data={compliance} onChange={setCompliance} />}
          {currentStep === 1 && <StepDadosPessoais data={dadosPessoais} onChange={setDadosPessoais} />}
          {currentStep === 2 && <StepDocumentos data={documentos} onChange={setDocumentos} />}
          {currentStep === 3 && <StepEndereco data={endereco} onChange={setEndereco} />}
          {currentStep === 4 && <StepDadosProfissionais data={profissionais} onChange={setProfissionais} />}
          {currentStep === 5 && <StepDadosBancarios data={bancarios} onChange={setBancarios} />}
          {currentStep === 6 && <StepDependentes data={dependentes} onChange={setDependentes} />}
          {currentStep === 7 && <StepSaude data={saude} onChange={setSaude} />}
          {currentStep === 8 && (
            <StepRevisao
              compliance={compliance}
              dadosPessoais={dadosPessoais}
              documentos={documentos}
              endereco={endereco}
              profissionais={profissionais}
              bancarios={bancarios}
              dependentes={dependentes}
              saude={saude}
              confirmacao={confirmacao}
              onConfirmacaoChange={setConfirmacao}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={next}>
            Próximo <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={!canSubmit} className="gradient-bordo text-primary-foreground">
            <Send className="h-4 w-4 mr-2" /> Enviar para o RH
          </Button>
        )}
      </div>
    </div>
  );
};

export default RhAdmissaoPage;
