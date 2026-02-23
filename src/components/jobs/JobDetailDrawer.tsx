import React, { useState } from "react";
import type { Job } from "./types";
import { formatBRL, formatDateBR, formatTimeMins, isOverdue } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { DEFAULT_STAGES } from "./types";
import {
  User, Calendar, DollarSign, Zap, Clock, Package,
  FileText, MessageSquare, Paperclip, ChevronDown, ChevronUp,
  Printer, CheckCircle,
} from "lucide-react";

interface Props {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobDetailDrawer: React.FC<Props> = ({ job, open, onOpenChange }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (!job) return null;

  const stageCfg = DEFAULT_STAGES.find(s => s.id === job.stage);
  const overdue = isOverdue(job.delivery_date);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:w-[75vw] sm:max-w-3xl p-0 flex flex-col">
        {/* Header */}
        <div className="bg-[#1a2332] text-white p-5 space-y-3">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <SheetTitle className="text-white text-xl font-bold leading-tight">
                J{job.code || job.id} | {job.description || job.client_name}
              </SheetTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold">{formatBRL(job.value)}</span>
                <Badge
                  className="text-xs border"
                  style={{ backgroundColor: stageCfg?.color || "#6b7280", borderColor: stageCfg?.color }}
                >
                  {stageCfg?.name || job.stage}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div>
              <span className="text-gray-400 font-semibold">Cliente:</span>{" "}
              <span>{job.client_name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold">Criado:</span>{" "}
              <span>{formatDateBR(job.created_at)}</span>
            </div>
            {job.responsible.length > 0 && (
              <div>
                <span className="text-gray-400 font-semibold">Responsável:</span>{" "}
                <span>{job.responsible.map(r => r.name).join(", ")}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 font-semibold">Necessidade de entrega:</span>{" "}
              <span className={overdue ? "text-red-400 font-semibold" : ""}>
                {formatDateBR(job.delivery_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Progresso</span>
            <Progress value={job.progress_percent} className="flex-1 h-2 bg-gray-700" />
            <span className="text-sm font-bold">{job.progress_percent}%</span>
          </div>
        </div>

        {/* Tabs content */}
        <Tabs defaultValue="itens" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-5 pt-3 bg-white border-b rounded-none h-auto justify-start gap-1">
            <TabsTrigger value="itens" className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
              Itens
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
              Informações gerais
            </TabsTrigger>
            <TabsTrigger value="producao" className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
              Produção
            </TabsTrigger>
            <TabsTrigger value="materiais" className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
              Matéria Prima
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
              Histórico
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Itens Tab */}
            <TabsContent value="itens" className="p-5 space-y-3 mt-0">
              {(job.items && job.items.length > 0) ? job.items.map((item, idx) => (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-sm">{idx + 1}. {item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Quant. <strong>{item.quantity || 1}</strong></span>
                      <span>Unid. <strong>{item.unit || "UN"}</strong></span>
                      <span>Valor <strong>{formatBRL(item.unitPrice || 0)}</strong></span>
                      <span>Subtotal <strong>{formatBRL(item.subtotal || 0)}</strong></span>
                      {expandedItem === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedItem === item.id && item.materials && (
                    <div className="p-3 border-t">
                      <p className="text-xs font-bold text-gray-500 mb-2">MATÉRIA PRIMA</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b">
                            <th className="text-left py-1">NOME</th>
                            <th className="text-left py-1">PROCESSO</th>
                            <th className="text-right py-1">QTD. PREVISTA</th>
                            <th className="text-right py-1">UTILIZADO</th>
                            <th className="text-left py-1">CENTRAL</th>
                            <th className="text-right py-1">QTD. UTILIZADA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.materials.map((mat, mi) => (
                            <tr key={mi} className="border-b last:border-0">
                              <td className="py-2">
                                <span className="font-medium">{mat.name}</span>
                                {mat.attributes && (
                                  <div className="flex gap-1 mt-0.5 flex-wrap">
                                    {Object.entries(mat.attributes).map(([k, v]) => (
                                      <Badge key={k} variant="outline" className="text-[9px] px-1.5 py-0">{k}: {v}</Badge>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2">{mat.process || "—"}</td>
                              <td className="text-right py-2">{mat.expectedQuantity?.toFixed(2) || "—"}</td>
                              <td className="text-right py-2">{mat.usedQuantity?.toFixed(2) || "0.00"}</td>
                              <td className="py-2">{mat.stockCenter || "Principal"}</td>
                              <td className="text-right py-2">{mat.usedAmount?.toFixed(3) || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12 text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum item encontrado para este job</p>
                  <p className="text-xs mt-1">Os itens são carregados da API Holdprint</p>
                </div>
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
              </div>
            </TabsContent>

            {/* Produção Tab */}
            <TabsContent value="producao" className="p-5 mt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Etapa Atual:</span>
                  <Badge style={{ backgroundColor: stageCfg?.color }}>{stageCfg?.name}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Progresso:</span>
                  <Progress value={job.progress_percent} className="flex-1 h-3" />
                  <span className="font-bold">{job.progress_percent}%</span>
                </div>
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
                              isCurrent
                                ? "text-white shadow-md"
                                : isPast
                                ? "bg-gray-200 text-gray-500"
                                : "bg-gray-100 text-gray-400"
                            }`}
                            style={isCurrent ? { backgroundColor: s.color } : undefined}
                          >
                            {isPast && <CheckCircle className="h-3 w-3 inline mr-1" />}
                            {s.name}
                          </div>
                          {i < DEFAULT_STAGES.length - 1 && <span className="text-gray-300">→</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Matéria Prima Tab */}
            <TabsContent value="materiais" className="p-5 mt-0">
              {job.materials && job.materials.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-[#1a2332] text-white px-4 py-3">
                    <h3 className="font-bold text-lg">Matéria Prima</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-gray-500 text-xs">
                        <th className="text-left p-3">NOME</th>
                        <th className="text-left p-3">PROCESSO</th>
                        <th className="text-right p-3">QTD. PREVISTA</th>
                        <th className="text-right p-3">UTILIZADO</th>
                        <th className="text-left p-3">CENTRAL DE ESTOQUE</th>
                        <th className="text-right p-3">QTD. UTILIZADA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.materials.map((mat, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3">
                            <span className="font-medium">{mat.name}</span>
                            {mat.attributes && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {Object.entries(mat.attributes).map(([k, v]) => (
                                  <Badge key={k} variant="outline" className="text-[10px] px-1.5">{k}: {v}</Badge>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-gray-600">{mat.process || "—"}</td>
                          <td className="p-3 text-right">{mat.expectedQuantity?.toFixed(2) || "—"}</td>
                          <td className="p-3 text-right">{mat.usedQuantity?.toFixed(2) || "0.00"}</td>
                          <td className="p-3">{mat.stockCenter || "Principal"}</td>
                          <td className="p-3 text-right font-medium">{mat.usedAmount?.toFixed(3) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma matéria prima cadastrada</p>
                </div>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="p-5 mt-0">
              <div className="space-y-4">
                {job.comments && job.comments.length > 0 ? job.comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#1DB899] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.user} <span className="text-gray-400 font-normal">{formatDateBR(c.timestamp)}</span></p>
                      <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum comentário ainda</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>

          {/* Footer actions */}
          <div className="border-t p-4 flex items-center justify-end gap-3 bg-white">
            <Button variant="outline" size="sm" className="gap-1">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button size="sm" className="bg-[#1DB899] hover:bg-[#17a085] text-white gap-1">
              <CheckCircle className="h-4 w-4" /> {stageCfg?.name || "Aprovação"} Ok
            </Button>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

// Small helper
function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className={`text-sm ${highlight ? "text-red-600 font-semibold" : "text-gray-800"}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

function AlignLeft(props: React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="17" x2="3" y1="10" y2="10" /><line x1="21" x2="3" y1="6" y2="6" /><line x1="21" x2="3" y1="14" y2="14" /><line x1="17" x2="3" y1="18" y2="18" />
    </svg>
  );
}

export default JobDetailDrawer;
