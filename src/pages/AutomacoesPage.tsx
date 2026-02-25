import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Zap, Trash2, Settings2, Bot, Bell, ArrowRight } from "lucide-react";

interface AutomationRule {
  id: string;
  nome: string;
  gatilho: string;
  condicoes: Record<string, string>;
  acoes: Record<string, string>;
  ativo: boolean;
  criado_por: string | null;
  created_at: string;
}

const GATILHOS = [
  { value: "job_criado", label: "Job criado" },
  { value: "job_muda_etapa", label: "Job muda de etapa" },
  { value: "job_parado", label: "Job fica parado por X horas" },
  { value: "prazo_proximo", label: "Prazo faltam X horas" },
  { value: "progresso_atinge", label: "Progresso atinge X%" },
  { value: "colaborador_atribuido", label: "Colaborador atribuído" },
  { value: "checklist_completo", label: "Checklist 100% concluído" },
];

const CONDICOES = [
  { value: "tipo_job", label: "Tipo do job" },
  { value: "filial", label: "Filial" },
  { value: "prioridade", label: "Prioridade" },
  { value: "responsavel", label: "Responsável" },
  { value: "qualquer", label: "Sempre (sem condição)" },
];

const ACOES = [
  { value: "notificar_responsavel", label: "Notificar responsável" },
  { value: "notificar_gestor", label: "Notificar gestor" },
  { value: "notificar_time", label: "Notificar time" },
  { value: "criar_tarefa", label: "Criar tarefa com template" },
  { value: "registrar_historico", label: "Registrar no histórico" },
  { value: "acionar_agente", label: "Acionar Agente IA para analisar" },
  { value: "enviar_email", label: "Enviar email para cliente" },
];

const DEFAULT_RULES: Omit<AutomationRule, "id" | "created_at">[] = [
  { nome: "Analisar novo job", gatilho: "job_criado", condicoes: { tipo: "qualquer" }, acoes: { acao: "acionar_agente" }, ativo: true, criado_por: "Sistema" },
  { nome: "Alerta prazo crítico", gatilho: "prazo_proximo", condicoes: { horas: "24", progresso_max: "80" }, acoes: { acao: "notificar_responsavel", prioridade: "critico" }, ativo: true, criado_por: "Sistema" },
  { nome: "Impressão parada", gatilho: "job_parado", condicoes: { horas: "3", etapa: "Impressão" }, acoes: { acao: "notificar_time" }, ativo: true, criado_por: "Sistema" },
  { nome: "Projetos → Impressão", gatilho: "checklist_completo", condicoes: { etapa: "Projetos" }, acoes: { acao: "notificar_responsavel" }, ativo: true, criado_por: "Sistema" },
  { nome: "Notificar financeiro", gatilho: "job_muda_etapa", condicoes: { etapa_destino: "Faturamento" }, acoes: { acao: "notificar_time" }, ativo: true, criado_por: "Sistema" },
  { nome: "Sobrecarga equipe", gatilho: "colaborador_atribuido", condicoes: { max_jobs: "6" }, acoes: { acao: "acionar_agente" }, ativo: true, criado_por: "Sistema" },
  { nome: "Resumo atraso diário", gatilho: "job_parado", condicoes: { horas: "24" }, acoes: { acao: "notificar_gestor" }, ativo: true, criado_por: "Sistema" },
];

function useAutomationRules() {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_rules").select("*").order("created_at");
      if (error) throw error;
      return (data || []) as AutomationRule[];
    },
  });
}

const AutomacoesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useAutomationRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", gatilho: "", condicao: "qualquer", condicao_valor: "", acao: "" });

  const toggleRule = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Regra removida" });
    },
  });

  const createRule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("automation_rules").insert({
        nome: form.nome,
        gatilho: form.gatilho,
        condicoes: { tipo: form.condicao, valor: form.condicao_valor },
        acoes: { acao: form.acao },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      setDialogOpen(false);
      setForm({ nome: "", gatilho: "", condicao: "qualquer", condicao_valor: "", acao: "" });
      toast({ title: "Regra criada" });
    },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("automation_rules").insert(
        DEFAULT_RULES.map(r => ({ nome: r.nome, gatilho: r.gatilho, condicoes: r.condicoes, acoes: r.acoes, ativo: r.ativo, criado_por: r.criado_por }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Regras padrão criadas" });
    },
  });

  const gatilhoLabel = (v: string) => GATILHOS.find(g => g.value === v)?.label || v;
  const acaoLabel = (v: string) => ACOES.find(a => a.value === v)?.label || v;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6 text-amber-500" /> Automações PCP</h1>
          <p className="text-sm text-muted-foreground">Configure regras automáticas para monitoramento de produção</p>
        </div>
        <div className="flex gap-2">
          {rules.length === 0 && (
            <Button variant="outline" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending}>
              <Settings2 className="h-4 w-4 mr-1.5" /> Carregar Regras Padrão
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova Regra
          </Button>
        </div>
      </div>

      {/* Rule builder visual */}
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">Como funciona:</p>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="gap-1 py-1.5 px-3"><Zap className="h-3 w-3" /> QUANDO</Badge>
            <span className="text-muted-foreground">+</span>
            <Badge variant="outline" className="gap-1 py-1.5 px-3"><Settings2 className="h-3 w-3" /> SE</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="gap-1 py-1.5 px-3"><Bell className="h-3 w-3" /> FAÇA</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Rules list */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando regras...</p>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma regra configurada</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Carregar Regras Padrão" para começar</p>
            </CardContent>
          </Card>
        ) : rules.map(rule => (
          <Card key={rule.id} className={`transition-opacity ${!rule.ativo ? "opacity-50" : ""}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <Switch checked={rule.ativo} onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, ativo: v })} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{rule.nome}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    <Zap className="h-2.5 w-2.5 mr-0.5" /> {gatilhoLabel(rule.gatilho)}
                  </Badge>
                  {rule.condicoes && Object.keys(rule.condicoes).length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      <Settings2 className="h-2.5 w-2.5 mr-0.5" /> {Object.entries(rule.condicoes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </Badge>
                  )}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    <Bell className="h-2.5 w-2.5 mr-0.5" /> {acaoLabel((rule.acoes as Record<string, string>)?.acao || "")}
                  </Badge>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{rule.criado_por || "Usuário"}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive" onClick={() => deleteRule.mutate(rule.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra de Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome da regra</label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Alerta de atraso" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">QUANDO (gatilho)</label>
              <Select value={form.gatilho} onValueChange={v => setForm(p => ({ ...p, gatilho: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {GATILHOS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">SE (condição)</label>
              <Select value={form.condicao} onValueChange={v => setForm(p => ({ ...p, condicao: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDICOES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.condicao !== "qualquer" && (
                <Input className="mt-2" value={form.condicao_valor} onChange={e => setForm(p => ({ ...p, condicao_valor: e.target.value }))} placeholder="Valor da condição..." />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">FAÇA (ação)</label>
              <Select value={form.acao} onValueChange={v => setForm(p => ({ ...p, acao: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {ACOES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createRule.mutate()} disabled={!form.nome || !form.gatilho || !form.acao || createRule.isPending}>
              Criar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomacoesPage;
