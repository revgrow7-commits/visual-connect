import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Plus, Loader2, MessageCircle, Send } from "lucide-react";
import { useCSTouchpoints, useCreateCSTouchpoint, useUpdateCSTouchpoint } from "@/hooks/useCSData";
import { mockTouchpoints } from "./mockData";
import { whatsappTemplates, applyTemplate } from "./ReguaWhatsAppTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const typeCfg: Record<string, { label: string; icon: string; className: string }> = {
  nps_survey: { label: "Pesquisa NPS", icon: "⭐", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  post_delivery_follow: { label: "Follow-up", icon: "📞", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  warranty_reminder: { label: "Lembrete Garantia", icon: "🛡️", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  reorder_nudge: { label: "Recompra", icon: "🔄", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  churn_alert: { label: "Alerta Churn", icon: "🚨", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  anniversary: { label: "Aniversário", icon: "🎂", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  seasonal_campaign: { label: "Campanha", icon: "📣", className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100" },
  complaint_resolved_check: { label: "Check Resolução", icon: "✅", className: "bg-green-100 text-green-800 hover:bg-green-100" },
};

const channelIcon: Record<string, string> = { email: "📧", phone: "📞", whatsapp: "💬", visit: "🏠" };
const statusCfg: Record<string, { label: string; className: string }> = {
  pending: { label: "⬜ Pendente", className: "bg-muted text-muted-foreground hover:bg-muted" },
  completed: { label: "✅ Realizado", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  postponed: { label: "⏭️ Adiado", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  skipped: { label: "⏭️ Pulado", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const ReguaRelacionamentoTab = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; sending: boolean }>({ current: 0, total: 0, sending: false });
  const [form, setForm] = useState({
    date: "", customer_name: "", type: "post_delivery_follow", channel: "phone",
    trigger_reason: "", responsible_name: "", notes: "", whatsapp_message: "",
  });

  const { data: dbTouchpoints, isLoading, refetch } = useCSTouchpoints();
  const createTp = useCreateCSTouchpoint();
  const updateTp = useUpdateCSTouchpoint();

  // Fetch colaboradores for responsible select
  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome, sobrenome, cargo, setor")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const touchpoints = dbTouchpoints && dbTouchpoints.length > 0 ? dbTouchpoints.map(t => ({
    id: t.id,
    date: t.date,
    customerName: t.customer_name,
    customerId: t.customer_id,
    type: t.type,
    channel: t.channel,
    trigger: t.trigger_reason || "",
    status: t.status,
    responsibleName: t.responsible_name,
    notes: t.notes,
    _isDb: true,
  })) : mockTouchpoints;

  const isRealData = dbTouchpoints && dbTouchpoints.length > 0;

  const filtered = touchpoints.filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pending = touchpoints.filter((t: any) => t.status === "pending").length;
  const completed = touchpoints.filter((t: any) => t.status === "completed").length;
  const pendingWhatsApp = touchpoints.filter((t: any) => t.status === "pending" && t.channel === "whatsapp" && new Date(t.date) <= new Date()).length;

  // Update whatsapp message template when type or channel changes in form
  const handleFormChange = (key: string, value: string) => {
    setForm(f => {
      const next = { ...f, [key]: value };
      if ((key === "type" || key === "channel") && (key === "channel" ? value : next.channel) === "whatsapp") {
        const tplType = key === "type" ? value : next.type;
        next.whatsapp_message = applyTemplate(whatsappTemplates[tplType] || "", next.customer_name || "[cliente]");
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!form.customer_name || !form.date) { toast.error("Preencha cliente e data"); return; }
    try {
      await createTp.mutateAsync({
        date: new Date(form.date).toISOString(),
        customer_name: form.customer_name,
        type: form.type,
        channel: form.channel,
        trigger_reason: form.trigger_reason,
        responsible_name: form.responsible_name || "Não atribuído",
        notes: form.channel === "whatsapp" ? form.whatsapp_message : form.notes,
      });
      toast.success("Touchpoint criado!");
      setCreateOpen(false);
      setForm({ date: "", customer_name: "", type: "post_delivery_follow", channel: "phone", trigger_reason: "", responsible_name: "", notes: "", whatsapp_message: "" });
    } catch { toast.error("Erro ao criar touchpoint"); }
  };

  const handleAction = async (id: string, status: string, isDb: boolean) => {
    if (!isDb) { toast.info("Não é possível alterar dados mock"); return; }
    try {
      await updateTp.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch { toast.error("Erro ao atualizar"); }
  };

  const handleSendWhatsApp = async (tp: any) => {
    if (!tp._isDb) { toast.info("Não é possível disparar dados mock"); return; }

    // Try to find customer phone from holdprint_cache or use a placeholder
    let phone = "";
    try {
      const { data } = await supabase
        .from("holdprint_cache")
        .select("raw_data")
        .eq("endpoint", "customers")
        .limit(500);
      if (data) {
          const match = data.find((c: any) => {
          const rd = c.raw_data as Record<string, any> | null;
          const name = rd?.name || rd?.fantasyName || "";
          return name.toLowerCase().includes(tp.customerName.toLowerCase()) || tp.customerName.toLowerCase().includes(name.toLowerCase());
        });
        if (match) {
          const rd = match.raw_data as Record<string, any> | null;
          phone = rd?.phone || rd?.cellPhone || "";
        }
      }
    } catch { /* ignore */ }

    if (!phone) {
      toast.error(`Telefone não encontrado para ${tp.customerName}. Cadastre o número no sistema.`);
      return;
    }

    const template = whatsappTemplates[tp.type] || whatsappTemplates.post_delivery_follow;
    const message = applyTemplate(template, tp.customerName, tp.trigger || undefined);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          phone,
          message,
          origin: "regua",
          origin_id: tp.id,
          client_id: tp.customerId || null,
          client_name: tp.customerName,
        },
      });

      if (error) throw error;

      await updateTp.mutateAsync({ id: tp.id, status: "completed", notes: `[WhatsApp] ${message.substring(0, 100)}...` });
      toast.success(`Mensagem enviada para ${tp.customerName}! ✅`);
    } catch (err) {
      toast.error(`Erro ao enviar WhatsApp para ${tp.customerName}`);
    }
  };

  const handleBatchSend = async () => {
    const pendingWA = touchpoints.filter((t: any) =>
      t.status === "pending" && t.channel === "whatsapp" && t._isDb && new Date(t.date) <= new Date()
    );

    if (pendingWA.length === 0) { toast.info("Nenhum touchpoint WhatsApp pendente para hoje."); return; }

    setBatchProgress({ current: 0, total: pendingWA.length, sending: true });

    let success = 0;
    for (let i = 0; i < pendingWA.length; i++) {
      setBatchProgress(p => ({ ...p, current: i + 1 }));
      try {
        await handleSendWhatsApp(pendingWA[i]);
        success++;
      } catch { /* continue */ }
      // Wait 3s between sends to avoid blocking
      if (i < pendingWA.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setBatchProgress({ current: 0, total: 0, sending: false });
    setBatchOpen(false);
    toast.success(`✅ ${success} mensagens enviadas com sucesso!`);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? "🟢 Dados reais" : "🟡 Dados mock (demo)"}
        </Badge>
        <div className="flex gap-2">
          {/* Batch WhatsApp button */}
          {pendingWhatsApp > 0 && (
            <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-300 hover:bg-green-50">
                  <MessageCircle className="h-4 w-4" /> Disparar Pendentes ({pendingWhatsApp})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Disparo em Lote — WhatsApp</DialogTitle></DialogHeader>
                {batchProgress.sending ? (
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-center">Enviando {batchProgress.current} de {batchProgress.total}...</p>
                    <Progress value={(batchProgress.current / batchProgress.total) * 100} />
                    <p className="text-xs text-muted-foreground text-center">Intervalo de 3s entre cada envio</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <p className="text-sm">
                      Você está prestes a enviar <strong>{pendingWhatsApp}</strong> mensagens via WhatsApp para touchpoints pendentes com data até hoje.
                    </p>
                    <p className="text-xs text-muted-foreground">As mensagens serão enviadas com intervalo de 3 segundos entre cada uma.</p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancelar</Button>
                      <Button onClick={handleBatchSend} className="gap-1 bg-green-600 hover:bg-green-700">
                        <Send className="h-4 w-4" /> Confirmar Envio
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* New Touchpoint button */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo Touchpoint</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Touchpoint</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={e => handleFormChange("customer_name", e.target.value)} /></div>
                  <div><Label>Data *</Label><Input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo</Label>
                    <Select value={form.type} onValueChange={v => handleFormChange("type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nps_survey">Pesquisa NPS</SelectItem>
                        <SelectItem value="post_delivery_follow">Follow-up</SelectItem>
                        <SelectItem value="warranty_reminder">Lembrete Garantia</SelectItem>
                        <SelectItem value="reorder_nudge">Recompra</SelectItem>
                        <SelectItem value="churn_alert">Alerta Churn</SelectItem>
                        <SelectItem value="anniversary">Aniversário</SelectItem>
                        <SelectItem value="complaint_resolved_check">Check Resolução</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Canal</Label>
                    <Select value={form.channel} onValueChange={v => handleFormChange("channel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">📞 Telefone</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                        <SelectItem value="visit">🏠 Visita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Responsável</Label>
                  <Select value={form.responsible_name} onValueChange={v => setForm(f => ({ ...f, responsible_name: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                    <SelectContent>
                      {(colaboradores || []).map(c => {
                        const fullName = `${c.nome}${c.sobrenome ? ` ${c.sobrenome}` : ""}`;
                        return (
                          <SelectItem key={c.id} value={fullName}>
                            <div className="flex flex-col">
                              <span>{fullName}</span>
                              {c.cargo && <span className="text-[10px] text-muted-foreground">{c.cargo}{c.setor ? ` — ${c.setor}` : ""}</span>}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Motivo/Trigger</Label><Input value={form.trigger_reason} onChange={e => setForm(f => ({ ...f, trigger_reason: e.target.value }))} /></div>

                {form.channel === "whatsapp" ? (
                  <div>
                    <Label>Mensagem WhatsApp (template)</Label>
                    <Textarea
                      value={form.whatsapp_message}
                      onChange={e => setForm(f => ({ ...f, whatsapp_message: e.target.value }))}
                      rows={6}
                      className="text-sm"
                      placeholder="Template será preenchido automaticamente..."
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Use [cliente.name] e [job.title] como variáveis dinâmicas.
                    </p>
                  </div>
                ) : (
                  <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                )}

                <Button onClick={handleCreate} disabled={createTp.isPending} className="w-full">
                  {createTp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar Touchpoint
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Realizados (mês)</p><p className="text-2xl font-bold text-green-600">{completed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Programados</p><p className="text-2xl font-bold">{touchpoints.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Taxa Execução</p><p className="text-2xl font-bold text-blue-600">{touchpoints.length > 0 ? Math.round((completed / touchpoints.length) * 100) : 0}%</p></CardContent></Card>
      </div>

      {/* SLA Reference Card */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">📏 Regras de Touchpoints</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <span>⭐ NPS: D+3 após entrega</span>
            <span>📞 Follow-up: D+7 após entrega</span>
            <span>🛡️ Garantia: 30d antes vencimento</span>
            <span>🔄 Recompra: 60d sem novo pedido</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="completed">Realizado</SelectItem>
            <SelectItem value="postponed">Adiado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="nps_survey">Pesquisa NPS</SelectItem>
            <SelectItem value="post_delivery_follow">Follow-up</SelectItem>
            <SelectItem value="warranty_reminder">Garantia</SelectItem>
            <SelectItem value="reorder_nudge">Recompra</SelectItem>
            <SelectItem value="anniversary">Aniversário</SelectItem>
            <SelectItem value="complaint_resolved_check">Check Resolução</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <TooltipProvider>
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum touchpoint encontrado.</TableCell></TableRow>
                ) : filtered.map((tp: any) => (
                  <TableRow key={tp.id} className={tp.status === "pending" ? "bg-yellow-50/20" : ""}>
                    <TableCell className="whitespace-nowrap">{formatDate(tp.date)}</TableCell>
                    <TableCell className="font-medium">{tp.customerName}</TableCell>
                    <TableCell><Badge className={typeCfg[tp.type]?.className || ""}>{typeCfg[tp.type]?.icon || ""} {typeCfg[tp.type]?.label || tp.type}</Badge></TableCell>
                    <TableCell>
                      {tp.channel === "whatsapp" ? (
                        <span className="text-green-600 font-medium">💬 WhatsApp</span>
                      ) : (
                        <>{channelIcon[tp.channel] || ""} {tp.channel}</>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tp.trigger}</TableCell>
                    <TableCell>{tp.responsibleName}</TableCell>
                    <TableCell>
                      {tp.status === "completed" && tp.channel === "whatsapp" && tp.notes?.startsWith("[WhatsApp]") ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 cursor-help">
                              ✓✓ Enviado
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs whitespace-pre-wrap">{tp.notes?.replace("[WhatsApp] ", "")}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{formatDate(tp.date)}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge className={statusCfg[tp.status]?.className || ""}>{statusCfg[tp.status]?.label || tp.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {tp.status === "pending" && (
                        <div className="flex gap-1">
                          {tp.channel === "whatsapp" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-green-700 hover:bg-green-50 gap-1"
                              onClick={() => handleSendWhatsApp(tp)}
                              title="Enviar via WhatsApp agora"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> Enviar
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAction(tp.id, "completed", tp._isDb)}>✅</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAction(tp.id, "postponed", tp._isDb)}>⏭️</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </TooltipProvider>
    </div>
  );
};

export default ReguaRelacionamentoTab;
