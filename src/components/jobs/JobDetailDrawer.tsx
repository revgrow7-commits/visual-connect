import React, { useState } from "react";
import type { Job } from "./types";
import { formatBRL, formatDateBR, formatTimeMins, isOverdue } from "./types";
import { DEFAULT_STAGES } from "./types";
import { useJobDetail, type ProductionTask } from "@/hooks/useJobDetail";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Calendar, DollarSign, Zap, Clock, Package,
  FileText, MessageSquare, ChevronDown, ChevronUp,
  Printer, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";

interface Props {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobDetailDrawer: React.FC<Props> = ({ job, open, onOpenChange }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading, isError } = useJobDetail(open ? job : null);

  if (!job) return null;

  const stageCfg = DEFAULT_STAGES.find(s => s.id === job.stage);
  const overdue = isOverdue(job.delivery_date);

  // Use detail data when available, fallback to job data
  const items = detail?.items || job.items || [];
  const materials = detail?.materials || job.materials || [];
  const comments = detail?.comments || job.comments || [];
  const productionTasks = detail?.productionTasks || [];
  const productionProgress = detail?.productionProgress ?? job.progress_percent;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:w-[75vw] sm:max-w-3xl p-0 flex flex-col">
        {/* Header */}
        <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] p-5 space-y-3">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <SheetTitle className="text-[hsl(var(--sidebar-foreground))] text-xl font-bold leading-tight">
                J{job.code || job.id} | {job.description || job.client_name}
              </SheetTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold">{formatBRL(job.value)}</span>
                <Badge
                  className="text-xs border text-white"
                  style={{ backgroundColor: stageCfg?.color || "#6b7280", borderColor: stageCfg?.color }}
                >
                  {stageCfg?.name || job.stage}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div>
              <span className="opacity-60 font-semibold">Cliente:</span>{" "}
              <span>{job.client_name}</span>
            </div>
            <div>
              <span className="opacity-60 font-semibold">Criado:</span>{" "}
              <span>{formatDateBR(job.created_at)}</span>
            </div>
            {job.responsible.length > 0 && (
              <div>
                <span className="opacity-60 font-semibold">Responsável:</span>{" "}
                <span>{job.responsible.map(r => r.name).join(", ")}</span>
              </div>
            )}
            <div>
              <span className="opacity-60 font-semibold">Necessidade de entrega:</span>{" "}
              <span className={overdue ? "text-red-400 font-semibold" : ""}>
                {formatDateBR(job.delivery_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm opacity-60">Progresso</span>
            <Progress value={productionProgress} className="flex-1 h-2 bg-white/20" />
            <span className="text-sm font-bold">{productionProgress}%</span>
          </div>

          {detailLoading && (
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando detalhes da API...
            </div>
          )}
        </div>

        {/* Tabs content */}
        <Tabs defaultValue="itens" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-5 pt-3 bg-background border-b rounded-none h-auto justify-start gap-1">
            {["itens", "info", "producao", "materiais", "timeline"].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                {{
                  itens: `Itens${items.length ? ` (${items.length})` : ""}`,
                  info: "Informações gerais",
                  producao: "Produção",
                  materiais: `Matéria Prima${materials.length ? ` (${materials.length})` : ""}`,
                  timeline: "Histórico",
                }[tab]}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Itens Tab */}
            <TabsContent value="itens" className="p-5 space-y-3 mt-0">
              {detailLoading ? (
                <LoadingSkeleton rows={3} />
              ) : items.length > 0 ? items.map((item, idx) => (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">{idx + 1}. {item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Quant. <strong>{item.quantity || 1}</strong></span>
                      <span>Unid. <strong>{item.unit || "UN"}</strong></span>
                      <span>Valor <strong>{formatBRL(item.unitPrice || 0)}</strong></span>
                      <span>Subtotal <strong>{formatBRL(item.subtotal || 0)}</strong></span>
                      {expandedItem === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedItem === item.id && (
                    <div className="p-3 border-t space-y-3">
                      {item.description && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-1">DESCRIÇÃO</p>
                          <p className="text-sm text-foreground">{item.description}</p>
                        </div>
                      )}
                      {item.materials && item.materials.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-2">MATÉRIA PRIMA</p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground border-b">
                                <th className="text-left py-1">NOME</th>
                                <th className="text-left py-1">PROCESSO</th>
                                <th className="text-left py-1">ATRIBUTOS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.materials.map((mat, mi) => (
                                <tr key={mi} className="border-b last:border-0">
                                  <td className="py-2 font-medium">{mat.name}</td>
                                  <td className="py-2">{mat.process || "—"}</td>
                                  <td className="py-2">
                                    {mat.attributes ? (
                                      <div className="flex gap-1 flex-wrap">
                                        {Object.entries(mat.attributes).map(([k, v]) => (
                                          <Badge key={k} variant="outline" className="text-[9px] px-1.5 py-0">{k}: {v}</Badge>
                                        ))}
                                      </div>
                                    ) : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )) : (
                <EmptyState icon={<Package className="h-10 w-10" />} message="Nenhum item encontrado para este job" sub="Os itens são carregados da API Holdprint" />
              )}
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="p-5 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<User className="h-4 w-4" />} label="Cliente" value={job.client_name} />
                <InfoRow icon={<FileText className="h-4 w-4" />} label="Descrição" value={job.description} />
                <InfoRow icon={<Package className="h-4 w-4" />} label="Tipo de Produção" value={job.production_type} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Valor Total" value={formatBRL(job.value)} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data de Criação" value={formatDateBR(job.created_at)} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data de Entrega" value={formatDateBR(job.delivery_date)} highlight={isOverdue(job.delivery_date)} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Responsável" value={job.responsible.map(r => r.name).join(", ") || "Não atribuído"} />
                <InfoRow icon={<Zap className="h-4 w-4" />} label="Urgente" value={job.urgent ? "Sim" : "Não"} />
                <InfoRow icon={<Clock className="h-4 w-4" />} label="Tempo Gasto" value={formatTimeMins(job.time_spent_minutes)} />
                {job._unit_key && <InfoRow icon={<Package className="h-4 w-4" />} label="Unidade" value={job._unit_key.toUpperCase()} />}
                {detail?.productionStartDate && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Início Produção" value={formatDateBR(detail.productionStartDate)} />}
                {detail?.productionEndDate && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Fim Produção" value={formatDateBR(detail.productionEndDate)} />}
              </div>
            </TabsContent>

            {/* Produção Tab */}
            <TabsContent value="producao" className="p-5 mt-0">
              {detailLoading ? (
                <LoadingSkeleton rows={4} />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Etapa Atual:</span>
                    <Badge className="text-white" style={{ backgroundColor: stageCfg?.color }}>{stageCfg?.name}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Progresso:</span>
                    <Progress value={productionProgress} className="flex-1 h-3" />
                    <span className="font-bold">{productionProgress}%</span>
                  </div>

                  {/* Production Flow from real tasks */}
                  {productionTasks.length > 0 ? (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-semibold mb-3">Fluxo de Produção</p>
                      <div className="flex items-center gap-1 overflow-x-auto pb-2">
                        {productionTasks.map((task, i) => {
                          const isFinalized = task.productionStatus === "Finalized";
                          const isStarted = task.productionStatus === "Started";
                          const isCurrent = isStarted || (task.productionStatus === "Ready" && i > 0 && productionTasks[i - 1]?.productionStatus === "Finalized");
                          return (
                            <div key={i} className="flex items-center gap-1">
                              <div
                                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all ${
                                  isCurrent
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : isFinalized
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-muted/50 text-muted-foreground/60"
                                }`}
                              >
                                {isFinalized && <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />}
                                {isCurrent && <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />}
                                {task.name}
                                {task.duration > 0 && <span className="ml-1 opacity-60">({task.duration}min)</span>}
                              </div>
                              {i < productionTasks.length - 1 && <span className="text-muted-foreground/40">→</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-semibold mb-3">Fluxo de Produção</p>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {DEFAULT_STAGES.map((s, i) => {
                          const isCurrent = s.id === job.stage;
                          const isPast = s.order < (stageCfg?.order || 0);
                          return (
                            <div key={s.id} className="flex items-center gap-1">
                              <div
                                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                                  isCurrent ? "text-white shadow-md" : isPast ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/60"
                                }`}
                                style={isCurrent ? { backgroundColor: s.color } : undefined}
                              >
                                {isPast && <CheckCircle className="h-3 w-3 inline mr-1" />}
                                {s.name}
                              </div>
                              {i < DEFAULT_STAGES.length - 1 && <span className="text-muted-foreground/40">→</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tasks detail table */}
                  {productionTasks.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-2">
                        <h4 className="text-sm font-semibold">Tarefas de Produção</h4>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left p-2.5">Etapa</th>
                            <th className="text-left p-2.5">Status</th>
                            <th className="text-right p-2.5">Duração</th>
                            <th className="text-left p-2.5">Liberado</th>
                            <th className="text-left p-2.5">Finalizado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productionTasks.map((t, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-2.5 font-medium">{t.name}</td>
                              <td className="p-2.5">
                                <TaskStatusBadge status={t.productionStatus} isPaused={t.isPaused} />
                              </td>
                              <td className="p-2.5 text-right">{t.duration > 0 ? `${t.duration} min` : "—"}</td>
                              <td className="p-2.5">{t.releasedDate ? formatDateBR(t.releasedDate) : "—"}</td>
                              <td className="p-2.5">{t.finalizedDate ? formatDateBR(t.finalizedDate) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Matéria Prima Tab */}
            <TabsContent value="materiais" className="p-5 mt-0">
              {detailLoading ? (
                <LoadingSkeleton rows={4} />
              ) : materials.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] px-4 py-3">
                    <h3 className="font-bold text-lg">Matéria Prima</h3>
                    <p className="text-xs opacity-60">{materials.length} materiais encontrados</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="text-left p-3">NOME</th>
                        <th className="text-left p-3">PROCESSO</th>
                        <th className="text-left p-3">ATRIBUTOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((mat, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">
                            <span className="font-medium">{mat.name}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">{mat.process || "—"}</td>
                          <td className="p-3">
                            {mat.attributes ? (
                              <div className="flex gap-1 flex-wrap">
                                {Object.entries(mat.attributes).map(([k, v]) => (
                                  <Badge key={k} variant="outline" className="text-[10px] px-1.5">{k}: {v}</Badge>
                                ))}
                              </div>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<Package className="h-10 w-10" />} message="Nenhuma matéria prima cadastrada" />
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="p-5 mt-0">
              {detailLoading ? (
                <LoadingSkeleton rows={5} />
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-medium">{comments.length} eventos registrados</p>
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {c.content.startsWith("✅") ? "✓" : c.content.startsWith("🔄") ? "↻" : "○"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {c.user}{" "}
                          <span className="text-muted-foreground font-normal">{formatDateBR(c.timestamp)}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<MessageSquare className="h-10 w-10" />} message="Nenhum evento registrado" sub="O histórico é gerado a partir das etapas de produção" />
              )}
            </TabsContent>
          </ScrollArea>

          {/* Footer actions */}
          <div className="border-t p-4 flex items-center justify-between bg-background">
            <div className="text-xs text-muted-foreground">
              {detail && !detailLoading && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  Dados da API Holdprint
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-1">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                <CheckCircle className="h-4 w-4" /> {stageCfg?.name || "Aprovação"} Ok
              </Button>
            </div>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

function TaskStatusBadge({ status, isPaused }: { status: string; isPaused: boolean }) {
  if (isPaused) return <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-600">Pausado</Badge>;
  switch (status) {
    case "Finalized":
      return <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">Finalizado</Badge>;
    case "Started":
      return <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-600">Em andamento</Badge>;
    case "Ready":
      return <Badge variant="outline" className="text-[10px] border-muted-foreground text-muted-foreground">Aguardando</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className={`text-sm ${highlight ? "text-destructive font-semibold" : "text-foreground"}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="mx-auto mb-2 opacity-50 w-fit">{icon}</div>
      <p className="text-sm">{message}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  );
}

function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default JobDetailDrawer;
