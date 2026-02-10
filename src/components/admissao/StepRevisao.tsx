import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { DadosPessoaisData } from "./StepDadosPessoais";
import type { DocumentosData } from "./StepDocumentos";
import type { EnderecoData } from "./StepEndereco";
import type { DadosProfissionaisData } from "./StepDadosProfissionais";
import type { DadosBancariosData } from "./StepDadosBancarios";
import type { Dependente } from "./StepDependentes";
import type { SaudeData } from "./StepSaude";
import type { SalarioBeneficiosData } from "./StepSalarioBeneficios";
import { format } from "date-fns";

interface ComplianceData {
  lgpd: boolean;
  confidencialidade: boolean;
  monitoramento: boolean;
  imagem: boolean;
}

interface RevisaoConfirmacao {
  dadosVerdadeiros: boolean;
  termosAceitos: boolean;
  assinaturaNome: string;
}

interface Props {
  compliance: ComplianceData;
  dadosPessoais: DadosPessoaisData;
  documentos: DocumentosData;
  endereco: EnderecoData;
  profissionais: DadosProfissionaisData;
  bancarios: DadosBancariosData;
  salarioBeneficios: SalarioBeneficiosData;
  dependentes: Dependente[];
  saude: SaudeData;
  confirmacao: RevisaoConfirmacao;
  onConfirmacaoChange: (data: RevisaoConfirmacao) => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-foreground text-sm border-b pb-1">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="flex gap-2">
    <span className="text-muted-foreground">{label}:</span>
    <span className="text-foreground font-medium">{value || "—"}</span>
  </div>
);

const fmt = (d: Date | undefined) => d ? format(d, "dd/MM/yyyy") : "—";

const StepRevisao = ({ compliance, dadosPessoais, documentos, endereco, profissionais, bancarios, salarioBeneficios, dependentes, saude, confirmacao, onConfirmacaoChange }: Props) => {
  const CompBadge = ({ ok }: { ok: boolean }) => ok
    ? <Badge variant="default" className="text-xs"><Check className="h-3 w-3 mr-1" />Aceito</Badge>
    : <Badge variant="destructive" className="text-xs"><X className="h-3 w-3 mr-1" />Pendente</Badge>;

  const beneficiosList = [
    salarioBeneficios.vt && "VT",
    salarioBeneficios.vrVa && "VR/VA",
    salarioBeneficios.planoSaude && "Plano de Saúde",
    salarioBeneficios.wellhub && "Wellhub",
    salarioBeneficios.outros,
  ].filter(Boolean).join(", ") || "—";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Revisão e Envio</h2>
      <p className="text-sm text-muted-foreground text-center">Confira todos os dados antes de enviar.</p>

      <Section title="Compliance">
        <div className="flex items-center gap-2">LGPD <CompBadge ok={compliance.lgpd} /></div>
        <div className="flex items-center gap-2">Sigilo <CompBadge ok={compliance.confidencialidade} /></div>
        <div className="flex items-center gap-2">Monitoramento <CompBadge ok={compliance.monitoramento} /></div>
        <div className="flex items-center gap-2">Imagem <CompBadge ok={compliance.imagem} /></div>
      </Section>

      <Section title="Dados Pessoais">
        <Field label="Nome" value={`${dadosPessoais.nome} ${dadosPessoais.sobrenome}`} />
        <Field label="Nascimento" value={fmt(dadosPessoais.dataNascimento)} />
        <Field label="Sexo" value={dadosPessoais.sexo} />
        <Field label="Estado Civil" value={dadosPessoais.estadoCivil} />
        <Field label="Nacionalidade" value={dadosPessoais.nacionalidade} />
        <Field label="Naturalidade" value={`${dadosPessoais.naturalidadeCidade}/${dadosPessoais.naturalidadeUf}`} />
        <Field label="Mãe" value={dadosPessoais.nomeMae} />
        <Field label="Pai" value={dadosPessoais.nomePai} />
      </Section>

      <Section title="Documentos">
        <Field label="CPF" value={documentos.cpf} />
        <Field label="RG" value={`${documentos.rg} ${documentos.rgOrgao}/${documentos.rgUf}`} />
        <Field label="PIS" value={documentos.pisPasep} />
        <Field label="Título de Eleitor" value={documentos.tituloEleitor} />
        <Field label="CTPS" value={documentos.ctpsNumero ? `${documentos.ctpsNumero} / ${documentos.ctpsSerie}` : undefined} />
        <Field label="CNH" value={documentos.cnhNumero || undefined} />
        {documentos.avsecCredencial && <Field label="AVSEC" value={`${documentos.avsecCredencial} — val. ${fmt(documentos.avsecValidade)}`} />}
        {documentos.antecedentesStatus && <Field label="Antecedentes" value={documentos.antecedentesStatus} />}
      </Section>

      <Section title="Endereço e Contato">
        <Field label="Endereço" value={`${endereco.endereco}, ${endereco.numero} - ${endereco.bairro}`} />
        <Field label="Cidade" value={`${endereco.cidade}/${endereco.estado}`} />
        <Field label="CEP" value={endereco.cep} />
        <Field label="Celular" value={endereco.telefoneCelular} />
        <Field label="E-mail" value={endereco.emailPessoal} />
      </Section>

      <Section title="Dados Profissionais">
        <Field label="Cargo" value={profissionais.cargo} />
        <Field label="Setor" value={profissionais.setor} />
        <Field label="Unidade" value={profissionais.unidade} />
        <Field label="Contratação" value={profissionais.tipoContratacao} />
        <Field label="Admissão" value={fmt(profissionais.dataAdmissao)} />
        <Field label="Jornada" value={profissionais.jornada} />
        {profissionais.escala && <Field label="Escala" value={profissionais.escala} />}
      </Section>

      <Section title="Salário e Benefícios">
        <Field label="Salário Base" value={salarioBeneficios.salarioBase} />
        <Field label="Adicionais" value={salarioBeneficios.adicionais || undefined} />
        <Field label="Benefícios" value={beneficiosList} />
      </Section>

      <Section title="Dados Bancários">
        <Field label="Banco" value={bancarios.banco} />
        <Field label="Agência" value={bancarios.agencia} />
        <Field label="Conta" value={`${bancarios.conta} (${bancarios.contaTipo})`} />
        <Field label="PIX" value={bancarios.pix || undefined} />
      </Section>

      {dependentes.length > 0 && (
        <Section title={`Dependentes (${dependentes.length})`}>
          {dependentes.map((d, i) => (
            <Field key={i} label={d.parentesco || `Dep. ${i + 1}`} value={`${d.nome} — ${fmt(d.dataNascimento)}`} />
          ))}
        </Section>
      )}

      <Section title="Saúde Ocupacional">
        <Field label="Exame" value={`${saude.exameStatus || "—"} — ${fmt(saude.exameData)}`} />
        {saude.treinamentos.map((t, i) => (
          <Field key={i} label={t.tipo || `Treinamento ${i + 1}`} value={`${fmt(t.dataRealizacao)} (${t.validadeMeses || "—"} meses)`} />
        ))}
      </Section>

      <div className="rounded-lg border bg-card p-5 space-y-4 mt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="dadosVerdadeiros"
            checked={confirmacao.dadosVerdadeiros}
            onCheckedChange={(c) => onConfirmacaoChange({ ...confirmacao, dadosVerdadeiros: !!c })}
          />
          <Label htmlFor="dadosVerdadeiros" className="text-sm cursor-pointer">
            Confirmo que todas as informações são verdadeiras
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="termosAceitos"
            checked={confirmacao.termosAceitos}
            onCheckedChange={(c) => onConfirmacaoChange({ ...confirmacao, termosAceitos: !!c })}
          />
          <Label htmlFor="termosAceitos" className="text-sm cursor-pointer">
            Confirmo que li e aceito os termos de compliance
          </Label>
        </div>

        <div className="border-t pt-4 space-y-2">
          <Label htmlFor="assinaturaNome" className="text-sm font-semibold">
            Assinatura Eletrônica — Digite seu nome completo *
          </Label>
          <Input
            id="assinaturaNome"
            value={confirmacao.assinaturaNome}
            onChange={(e) => onConfirmacaoChange({ ...confirmacao, assinaturaNome: e.target.value })}
            placeholder="Seu nome completo como assinatura"
            className="font-serif italic text-base"
          />
          <p className="text-xs text-muted-foreground">
            Data/hora: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepRevisao;
