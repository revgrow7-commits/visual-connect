import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, ArrowLeft, Send, PartyPopper, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoIndustria from "@/assets/logo-industria-visual.png";

interface RecruitmentData {
  id: string;
  candidato_nome: string;
  candidato_email: string;
  cargo: string;
  unidade: string;
  setor?: string;
  tipo_contratacao?: string;
  data_admissao?: string;
  jornada?: string;
  horario?: string;
  escala?: string;
  salario_base?: string;
  adicionais?: string;
}

const FormularioCandidato = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<"loading" | "welcome" | "form" | "done" | "error">("loading");
  const [recruitmentData, setRecruitmentData] = useState<RecruitmentData | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [ndFields, setNdFields] = useState<Set<string>>(new Set());
  const [termos, setTermos] = useState({ lgpd: false, veracidade: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecruitmentLink();
  }, [token]);

  const loadRecruitmentLink = async () => {
    if (!token) { setStep("error"); return; }

    const { data, error } = await supabase
      .from("recruitment_links")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      setStep("error");
      return;
    }

    if (data.status === "preenchido") {
      setStep("done");
      return;
    }

    if (new Date(data.expira_em) < new Date()) {
      setStep("error");
      return;
    }

    setRecruitmentData(data as any);
    setStep("welcome");
  };

  const camposGenericos = [
    { id: "nome", label: "Nome Completo", tipo: "texto", obrigatorio: true },
    { id: "cpf", label: "CPF", tipo: "texto", obrigatorio: true },
    { id: "rg", label: "RG", tipo: "texto", obrigatorio: true },
    { id: "dataNascimento", label: "Data de Nascimento", tipo: "data", obrigatorio: true },
    { id: "email", label: "E-mail Pessoal", tipo: "texto", obrigatorio: true },
    { id: "telefone", label: "Telefone / WhatsApp", tipo: "texto", obrigatorio: true },
    { id: "cep", label: "CEP", tipo: "texto", obrigatorio: true },
    { id: "endereco", label: "Endereço Completo", tipo: "texto", obrigatorio: true },
    { id: "estadoCivil", label: "Estado Civil", tipo: "selecao", obrigatorio: true, opcoes: ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"] },
    { id: "escolaridade", label: "Escolaridade", tipo: "selecao", obrigatorio: true, opcoes: ["Ensino Fundamental", "Ensino Médio", "Superior Incompleto", "Superior Completo", "Pós-Graduação", "Mestrado", "Doutorado"] },
    { id: "banco", label: "Banco", tipo: "texto", obrigatorio: true },
    { id: "agencia", label: "Agência", tipo: "texto", obrigatorio: true },
    { id: "conta", label: "Conta", tipo: "texto", obrigatorio: true },
    { id: "pix", label: "Chave PIX", tipo: "texto", obrigatorio: true },
  ];

  const camposEspecificos = [
    { id: "cnhCategoria", label: "Categoria da CNH", tipo: "selecao", obrigatorio: false, opcoes: ["A", "B", "AB", "C", "D", "E"] },
    { id: "cnhValidade", label: "Validade da CNH", tipo: "data", obrigatorio: false },
    { id: "certificacoes", label: "Certificações Profissionais", tipo: "texto", obrigatorio: false },
    { id: "nrTreinamentos", label: "NRs que possui treinamento", tipo: "texto", obrigatorio: false },
    { id: "tamanhoUniforme", label: "Tamanho do Uniforme", tipo: "selecao", obrigatorio: false, opcoes: ["PP", "P", "M", "G", "GG", "XGG"] },
    { id: "tamanhoCalcado", label: "Tamanho do Calçado", tipo: "texto", obrigatorio: false },
  ];

  const sections = [
    { title: "Dados Pessoais", campos: camposGenericos.slice(0, 6) },
    { title: "Endereço e Contato", campos: camposGenericos.slice(6, 10) },
    { title: "Dados Bancários", campos: camposGenericos.slice(10) },
    { title: "Informações Complementares", campos: camposEspecificos },
  ];

  const totalSections = sections.length;
  const progress = ((currentSection + 1) / totalSections) * 100;

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setNdFields((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleNd = (id: string) => {
    setNdFields((prev) => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else {
        n.add(id);
        setFormData((prev) => { const d = { ...prev }; delete d[id]; return d; });
      }
      return n;
    });
  };

  const handleSubmit = async () => {
    if (!termos.lgpd || !termos.veracidade) {
      toast({ title: "Aceite obrigatório", description: "Aceite os termos para enviar.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    try {
      const complementarData: Record<string, string> = {};
      camposEspecificos.forEach((c) => {
        complementarData[c.id] = ndFields.has(c.id) ? "N/D" : (formData[c.id] || "");
      });

      const { error } = await supabase.from("colaboradores").insert({
        recruitment_link_id: recruitmentData?.id || null,
        nome: formData.nome || recruitmentData?.candidato_nome || "",
        cpf: formData.cpf,
        rg: formData.rg,
        data_nascimento: formData.dataNascimento || null,
        sexo: formData.estadoCivil,
        email_pessoal: formData.email || recruitmentData?.candidato_email,
        telefone_celular: formData.telefone,
        cep: formData.cep,
        endereco: formData.endereco,
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        pix: formData.pix,
        // Dados de contratação pré-preenchidos pelo RH
        cargo: recruitmentData?.cargo,
        setor: recruitmentData?.setor,
        unidade: recruitmentData?.unidade,
        tipo_contratacao: recruitmentData?.tipo_contratacao,
        data_admissao: recruitmentData?.data_admissao || null,
        jornada: recruitmentData?.jornada,
        horario: recruitmentData?.horario,
        escala: recruitmentData?.escala,
        salario_base: recruitmentData?.salario_base,
        adicionais: recruitmentData?.adicionais,
        saude: complementarData,
        compliance_aceito: true,
        compliance_ip: "",
        compliance_user_agent: navigator.userAgent,
        compliance_timestamp: new Date().toISOString(),
        status: "pendente",
      });

      if (error) {
        toast({ title: "Erro ao enviar", description: "Não foi possível salvar seus dados.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      if (recruitmentData?.id) {
        await supabase.from("recruitment_links").update({ status: "preenchido" }).eq("id", recruitmentData.id);
      }

      setStep("done");
      toast({ title: "Formulário enviado!", description: "Seus dados foram recebidos pelo RH." });
    } catch {
      toast({ title: "Erro inesperado", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (campo: typeof camposGenericos[0] & { opcoes?: string[] }) => {
    const isNd = ndFields.has(campo.id);
    return (
      <div key={campo.id} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            {campo.label} {campo.obrigatorio && <span className="text-destructive">*</span>}
          </Label>
          {!campo.obrigatorio && (
            <button onClick={() => toggleNd(campo.id)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${isNd ? "bg-muted text-muted-foreground border-border" : "border-transparent text-muted-foreground hover:bg-muted"}`}>
              N/D
            </button>
          )}
        </div>
        {isNd ? (
          <div className="h-10 flex items-center px-3 rounded-md bg-muted text-muted-foreground text-sm border">Não se aplica</div>
        ) : campo.tipo === "selecao" && campo.opcoes ? (
          <Select value={formData[campo.id] || ""} onValueChange={(v) => handleChange(campo.id, v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{campo.opcoes.map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
          </Select>
        ) : campo.tipo === "data" ? (
          <Input type="date" value={formData[campo.id] || ""} onChange={(e) => handleChange(campo.id, e.target.value)} />
        ) : (
          <Input value={formData[campo.id] || ""} onChange={(e) => handleChange(campo.id, e.target.value)} placeholder={campo.label} />
        )}
      </div>
    );
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardContent className="pt-10 pb-8 px-8 space-y-4">
            <img src={logoIndustria} alt="Indústria Visual" className="h-20 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Link Inválido ou Expirado</h1>
            <p className="text-muted-foreground text-sm">Este link de formulário não é válido ou já expirou. Entre em contato com o RH.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center shadow-xl">
          <CardContent className="pt-10 pb-8 px-8 space-y-6">
            <img src={logoIndustria} alt="Indústria Visual" className="h-28 mx-auto" />
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Parabéns, {recruitmentData?.candidato_nome?.split(" ")[0]}!</h1>
                <PartyPopper className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-semibold text-primary">
                Você foi selecionado(a) para {recruitmentData?.cargo} na unidade {recruitmentData?.unidade}!
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-5 text-left space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Nossa Cultura</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Na <strong className="text-foreground">Indústria Visual</strong>, acreditamos que grandes resultados nascem de pessoas comprometidas, criativas e apaixonadas pelo que fazem.
                Valorizamos a <strong className="text-foreground">colaboração</strong>, a <strong className="text-foreground">inovação</strong> e o <strong className="text-foreground">respeito</strong>.
              </p>
              <p className="text-sm font-medium text-primary">Bem-vindo(a) à família Indústria Visual! 🚀</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep("form")}>
              Preencher Formulário de Admissão <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardContent className="pt-10 pb-8 px-8 space-y-6">
            <img src={logoIndustria} alt="Indústria Visual" className="h-20 mx-auto" />
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Formulário Enviado!</h1>
            <p className="text-muted-foreground text-sm">Seus dados foram recebidos com sucesso pelo RH. Você receberá um e-mail de confirmação em breve.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FORM
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <img src={logoIndustria} alt="Indústria Visual" className="h-16 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Formulário de Admissão</h1>
          <p className="text-sm text-muted-foreground">Preencha seus dados para completar sua admissão — {recruitmentData?.cargo} ({recruitmentData?.unidade})</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-primary">{sections[currentSection].title}</span>
            <span className="text-muted-foreground">{currentSection + 1} de {totalSections}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">{sections[currentSection].title}</h2>
            {currentSection === totalSections - 1 && (
              <p className="text-xs text-muted-foreground">
                Campos complementares. Caso não se aplique, marque <Badge variant="outline" className="text-[10px] px-1.5 py-0 mx-1">N/D</Badge>.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections[currentSection].campos.map(renderField)}
            </div>

            {currentSection === totalSections - 1 && (
              <div className="border-t pt-4 space-y-3 mt-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="lgpd" checked={termos.lgpd} onCheckedChange={(v) => setTermos((p) => ({ ...p, lgpd: !!v }))} />
                  <Label htmlFor="lgpd" className="text-xs leading-relaxed font-normal">
                    Autorizo o tratamento dos meus dados pessoais para fins de admissão, conforme a LGPD.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="veracidade" checked={termos.veracidade} onCheckedChange={(v) => setTermos((p) => ({ ...p, veracidade: !!v }))} />
                  <Label htmlFor="veracidade" className="text-xs leading-relaxed font-normal">
                    Declaro que todas as informações são verdadeiras e estou ciente de que informações falsas podem acarretar rescisão contratual.
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentSection((s) => s - 1)} disabled={currentSection === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
          </Button>
          {currentSection < totalSections - 1 ? (
            <Button onClick={() => setCurrentSection((s) => s + 1)}>
              Próximo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!termos.lgpd || !termos.veracidade || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {submitting ? "Enviando..." : "Enviar Formulário"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormularioCandidato;
