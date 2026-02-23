import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const INITIAL = {
  nome: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  sexo: "",
  estado_civil: "",
  email_pessoal: "",
  telefone_celular: "",
  cargo: "",
  setor: "",
  unidade: "",
  data_admissao: "",
  tipo_contratacao: "",
  salario_base: "",
  jornada: "",
  horario: "",
  escala: "",
  matricula: "",
  pis_pasep: "",
  ctps: "",
  cep: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  banco: "",
  agencia: "",
  conta: "",
  pix: "",
  escolaridade: "",
};

const NovoColaboradorDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload: Record<string, any> = { status: "pendente" };
    Object.entries(form).forEach(([k, v]) => {
      payload[k] = v.trim() === "" ? null : v.trim();
    });

    const { error } = await supabase.from("colaboradores").insert([payload as any]);
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao criar colaborador", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Colaborador criado com sucesso!" });
      setForm(INITIAL);
      onOpenChange(false);
      onSuccess();
    }
  };

  const Field = ({ label, field, type = "text", half = false }: { label: string; field: string; type?: string; half?: boolean }) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={(form as any)[field] || ""}
        onChange={(e) => set(field, e.target.value)}
        className="h-9 text-sm mt-1"
      />
    </div>
  );

  const SelectField = ({ label, field, options, half = false }: { label: string; field: string; options: { value: string; label: string }[]; half?: boolean }) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={(form as any)[field] || ""} onValueChange={(v) => set(field, v)}>
        <SelectTrigger className="h-9 text-sm mt-1">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Colaborador
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 max-h-[60vh]">
          <div className="space-y-5 pb-4">
            {/* Dados Pessoais */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 border-b pb-1">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome Completo *" field="nome" />
                <Field label="CPF" field="cpf" half />
                <Field label="RG" field="rg" half />
                <Field label="Data de Nascimento" field="data_nascimento" type="date" half />
                <SelectField label="Sexo" field="sexo" half options={[
                  { value: "M", label: "Masculino" },
                  { value: "F", label: "Feminino" },
                ]} />
                <SelectField label="Estado Civil" field="estado_civil" half options={[
                  { value: "Solteiro(a)", label: "Solteiro(a)" },
                  { value: "Casado(a)", label: "Casado(a)" },
                  { value: "Divorciado(a)", label: "Divorciado(a)" },
                  { value: "Viúvo(a)", label: "Viúvo(a)" },
                  { value: "União Estável", label: "União Estável" },
                ]} />
                <Field label="Escolaridade" field="escolaridade" half />
                <Field label="E-mail Pessoal" field="email_pessoal" half />
                <Field label="Telefone Celular" field="telefone_celular" half />
              </div>
            </section>

            {/* Dados Profissionais */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 border-b pb-1">Dados Profissionais</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Matrícula" field="matricula" half />
                <Field label="Cargo" field="cargo" half />
                <Field label="Setor" field="setor" half />
                <SelectField label="Unidade" field="unidade" half options={[
                  { value: "POA", label: "POA" },
                  { value: "SP", label: "SP" },
                  { value: "RS", label: "RS" },
                ]} />
                <Field label="Data de Admissão" field="data_admissao" type="date" half />
                <SelectField label="Tipo de Contratação" field="tipo_contratacao" half options={[
                  { value: "CLT", label: "CLT" },
                  { value: "PJ", label: "PJ" },
                  { value: "Estágio", label: "Estágio" },
                  { value: "Temporário", label: "Temporário" },
                ]} />
                <Field label="Salário Base" field="salario_base" half />
                <Field label="Jornada" field="jornada" half />
                <Field label="Horário" field="horario" half />
                <Field label="Escala" field="escala" half />
              </div>
            </section>

            {/* Documentos */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 border-b pb-1">Documentos</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="PIS/PASEP" field="pis_pasep" half />
                <Field label="CTPS" field="ctps" half />
              </div>
            </section>

            {/* Endereço */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 border-b pb-1">Endereço</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CEP" field="cep" half />
                <Field label="Endereço" field="endereco" />
                <Field label="Número" field="numero" half />
                <Field label="Bairro" field="bairro" half />
                <Field label="Cidade" field="cidade" half />
                <Field label="UF" field="estado" half />
              </div>
            </section>

            {/* Dados Bancários */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 border-b pb-1">Dados Bancários</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Banco" field="banco" half />
                <Field label="Agência" field="agencia" half />
                <Field label="Conta" field="conta" half />
                <Field label="PIX" field="pix" half />
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-bordo text-primary-foreground gap-2">
            <UserPlus className="h-4 w-4" />
            {saving ? "Salvando..." : "Criar Colaborador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NovoColaboradorDialog;
