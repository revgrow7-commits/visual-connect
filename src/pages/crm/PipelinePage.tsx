import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, GripVertical } from "lucide-react";
import { mockDeals, fmtBRL } from "@/lib/crm/mockData";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/types";
import { Progress } from "@/components/ui/progress";

export default function CRMPipelinePage() {
  const [search, setSearch] = useState("");
  const openDeals = mockDeals.filter(d => d.status === "aberto");
  const totalPipeline = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedPipeline = openDeals.reduce((s, d) => s + d.weighted_value, 0);

  const filteredDeals = useMemo(() => {
    if (!search) return mockDeals;
    return mockDeals.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.company_name?.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const dealsByStage = (stage: DealStage) => filteredDeals.filter(d => d.stage === stage && d.status === "aberto");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">{openDeals.length} deals abertos • {fmtBRL(totalPipeline)} total • {fmtBRL(weightedPipeline)} ponderado</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Deal</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Deal</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Título</Label><Input placeholder="Nome do deal" /></div>
              <div className="space-y-2"><Label>Empresa</Label><Input placeholder="Empresa" /></div>
              <div className="space-y-2"><Label>Contato</Label><Input placeholder="Contato principal" /></div>
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" placeholder="0,00" /></div>
              <div className="space-y-2"><Label>Probabilidade (%)</Label><Input type="number" placeholder="50" /></div>
              <div className="space-y-2"><Label>Etapa</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{DEAL_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Responsável</Label><Input placeholder="Nome" /></div>
              <div className="space-y-2"><Label>Data de Fechamento</Label><Input type="date" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline">Cancelar</Button><Button>Salvar</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar deal..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="kanban">
        <TabsList><TabsTrigger value="kanban">Kanban</TabsTrigger><TabsTrigger value="lista">Lista</TabsTrigger></TabsList>

        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {DEAL_STAGES.map(stage => {
              const deals = dealsByStage(stage.id);
              const stageTotal = deals.reduce((s, d) => s + d.value, 0);
              return (
                <div key={stage.id} className="min-w-[260px] max-w-[280px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">{deals.length}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1 mb-2">{fmtBRL(stageTotal)}</p>
                  <div className="space-y-2">
                    {deals.map(deal => (
                      <Card key={deal.id} className="cursor-grab hover:shadow-md transition-shadow">
                        <CardContent className="p-3 space-y-2">
                          <p className="font-medium text-sm leading-tight">{deal.title}</p>
                          <p className="text-xs text-muted-foreground">{deal.company_name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">{fmtBRL(deal.value)}</span>
                            <Badge variant="secondary" className="text-[10px]">{deal.probability}%</Badge>
                          </div>
                          <Progress value={deal.probability} className="h-1" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{deal.owner_name}</span>
                            {deal.close_date && <span className="text-[10px] text-muted-foreground">{new Date(deal.close_date).toLocaleDateString("pt-BR")}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {deals.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum deal</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="lista">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Deal</TableHead><TableHead>Empresa</TableHead><TableHead>Responsável</TableHead><TableHead>Etapa</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Prob.</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredDeals.map(d => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">{d.title}</TableCell>
                      <TableCell className="text-sm">{d.company_name || "—"}</TableCell>
                      <TableCell className="text-sm">{d.owner_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{DEAL_STAGES.find(s => s.id === d.stage)?.label}</Badge></TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtBRL(d.value)}</TableCell>
                      <TableCell className="text-sm">{d.probability}%</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.close_date ? new Date(d.close_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
