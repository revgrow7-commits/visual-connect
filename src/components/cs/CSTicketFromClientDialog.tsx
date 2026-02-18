import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { useCreateCSTicket } from "@/hooks/useCSData";
import { toast } from "sonner";

// PCP workflow departments/stages based on the company's production flow
const PCP_DEPARTMENTS = [
  { key: "comercial", label: "Comercial", icon: "💼", description: "Análise comercial, orçamento e negociação" },
  { key: "financeiro", label: "Financeiro", icon: "💰", description: "Aprovação financeira e faturamento" },
  { key: "arte", label: "Arte / Criação", icon: "🎨", description: "Criação de layout, arte final e aprovação" },
  { key: "pre_impressao", label: "Pré-Impressão", icon: "📐", description: "Conferência de arquivos e provas" },
  { key: "producao", label: "Produção / PCP", icon: "🏭", description: "Planejamento e controle de produção" },
  { key: "impressao", label: "Impressão", icon: "🖨️", description: "Impressão digital, offset e grande formato" },
  { key: "acabamento", label: "Acabamento", icon: "✂️", description: "Corte, laminação, montagem e finalização" },
  { key: "qualidade", label: "Qualidade", icon: "✅", description: "Inspeção e controle de qualidade" },
  { key: "expedicao", label: "Expedição", icon: "📦", description: "Embalagem, logística e entrega" },
  { key: "instalacao", label: "Instalação", icon: "🔧", description: "Instalação no local do cliente" },
];

const PCP_STATUS_MAP: Record<string, string[]> = {
  comercial: ["Aguardando Orçamento", "Orçamento Enviado", "Em Negociação", "Aprovado", "Reprovado"],
  financeiro: ["Aguardando Aprovação", "Aprovado", "Pendente Pagamento", "Faturado"],
  arte: ["Aguardando Briefing", "Em Criação", "Aguardando Aprovação Cliente", "Arte Aprovada", "Revisão Solicitada"],
  pre_impressao: ["Aguardando Arquivo", "Conferência de Arquivo", "Prova Digital Enviada", "Aprovado para Produção"],
  producao: ["Na Fila", "Programado", "Em Produção", "Pausado", "Concluído"],
  impressao: ["Aguardando Material", "Em Impressão", "Secagem", "Concluído"],
  acabamento: ["Na Fila", "Em Acabamento", "Laminação", "Corte", "Montagem", "Concluído"],
  qualidade: ["Aguardando Inspeção", "Em Inspeção", "Aprovado", "Reprovado - Refazer"],
  expedicao: ["Aguardando Embalagem", "Embalado", "Aguardando Coleta", "Em Trânsito", "Entregue"],
  instalacao: ["Agendada", "Em Andamento", "Concluída", "Pendência no Local"],
};

interface CSTicketFromClientDialogProps {
  customerName: string;
  customerId?: number | string;
  trigger?: React.ReactNode;
}

const CSTicketFromClientDialog: React.FC<CSTicketFromClientDialogProps> = ({ customerName, customerId, trigger }) => {
  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    job_code: "",
    job_title: "",
    category: "other" as string,
    priority: "medium" as string,
    description: "",
    responsible_name: "",
  });

  const createTicket = useCreateCSTicket();

  const statuses = department ? PCP_STATUS_MAP[department] || [] : [];
  const selectedDept = PCP_DEPARTMENTS.find(d => d.key === department);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setStatus("");
  };

  const handleCreate = async () => {
    if (!department) {
      toast.error("Selecione o departamento");
      return;
    }
    if (!form.description) {
      toast.error("Preencha a descrição");
      return;
    }
    try {
      const deptLabel = selectedDept?.label || department;
      const descriptionWithContext = `[${deptLabel}${status ? ` → ${status}` : ""}] ${form.description}`;

      await createTicket.mutateAsync({
        customer_name: customerName,
        customer_id: customerId ? Number(customerId) : undefined,
        job_code: form.job_code ? parseInt(form.job_code) : undefined,
        job_title: form.job_title,
        category: form.category,
        priority: form.priority,
        description: descriptionWithContext,
        responsible_name: form.responsible_name || "Não atribuído",
      });

      // Register complaint/ticket in RAG for AI agents
      const ragContent = `[TICKET CS] Cliente: ${customerName} | Departamento: ${deptLabel} | Status: ${status || "Novo"} | Categoria: ${form.category} | Prioridade: ${form.priority} | Job: ${form.job_title || form.job_code || "N/A"} | Descrição: ${form.description}`;
      const ragFilename = `cs_ticket_${customerName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`;
      
      supabase.from("rag_documents").insert({
        content: ragContent,
        sector: "cs",
        source_type: "ticket",
        original_filename: ragFilename,
        metadata: { 
          type: "cs_ticket", 
          customer_name: customerName, 
          department: deptLabel, 
          category: form.category, 
          priority: form.priority,
          created_at: new Date().toISOString() 
        },
      }).then(({ error }) => {
        if (error) console.error("RAG insert error:", error.message);
        else console.log("Ticket registrado no RAG");
      });

      toast.success("Ticket criado com sucesso!");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao criar ticket");
    }
  };

  const resetForm = () => {
    setDepartment("");
    setStatus("");
    setForm({ job_code: "", job_title: "", category: "other", priority: "medium", description: "", responsible_name: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <AlertCircle className="h-4 w-4" /> Abrir Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> Abrir Ticket — {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Department Selection */}
          <div>
            <Label className="text-sm font-semibold">Departamento (Fluxo PCP) *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PCP_DEPARTMENTS.map(dept => (
                <button
                  key={dept.key}
                  onClick={() => handleDepartmentChange(dept.key)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                    department === dept.key
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="text-lg">{dept.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{dept.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Department Status */}
          {department && statuses.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">
                Status no {selectedDept?.label}
              </Label>
              <p className="text-xs text-muted-foreground mb-2">{selectedDept?.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {statuses.map(s => (
                  <Badge
                    key={s}
                    variant={status === s ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setStatus(s)}
                  >
                    {status === s && <ChevronRight className="h-3 w-3 mr-0.5" />}
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {department && (
            <>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Code</Label>
                  <Input value={form.job_code} onChange={e => setForm(f => ({ ...f, job_code: e.target.value }))} placeholder="Ex: 1234" />
                </div>
                <div>
                  <Label>Job Título</Label>
                  <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="Título do job" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery_delay">Atraso</SelectItem>
                      <SelectItem value="production_defect">Defeito</SelectItem>
                      <SelectItem value="budget_divergence">Divergência</SelectItem>
                      <SelectItem value="installation">Instalação</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">🔴 Crítica</SelectItem>
                      <SelectItem value="high">🟠 Alta</SelectItem>
                      <SelectItem value="medium">🟡 Média</SelectItem>
                      <SelectItem value="low">⚪ Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Responsável</Label>
                <Input value={form.responsible_name} onChange={e => setForm(f => ({ ...f, responsible_name: e.target.value }))} placeholder="Nome do responsável" />
              </div>

              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o problema ou solicitação..."
                  rows={3}
                />
              </div>

              <Button onClick={handleCreate} disabled={createTicket.isPending} className="w-full">
                {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Ticket
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSTicketFromClientDialog;
