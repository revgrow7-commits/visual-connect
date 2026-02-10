import { useState } from "react";
import { FileText, Plus, Eye, Send, Download, Search, Filter, CheckCircle2, Clock, AlertCircle, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  incompleto: { label: "Incompleto", variant: "destructive", icon: AlertCircle },
  completo: { label: "Completo", variant: "secondary", icon: CheckCircle2 },
  aguardando: { label: "Aguardando Contrato", variant: "outline", icon: Clock },
  enviado: { label: "Contrato Enviado", variant: "default", icon: Send },
  assinado: { label: "Assinado", variant: "default", icon: CheckCircle2 },
};

const mockCandidatos = [
  {
    id: "1", nome: "Ana Paula Silva", cargo: "Designer Gráfico", unidade: "POA", tipo: "CLT",
    status: "completo", lgpd: true, sigilo: true, monitoramento: true, imagem: true,
    dataAdmissao: "2025-03-01", email: "ana@email.com",
  },
  {
    id: "2", nome: "Carlos Eduardo Souza", cargo: "Instalador Externo", unidade: "SP", tipo: "CLT",
    status: "aguardando", lgpd: true, sigilo: true, monitoramento: true, imagem: false,
    dataAdmissao: "2025-03-10", email: "carlos@email.com",
  },
  {
    id: "3", nome: "Mariana Costa", cargo: "Analista Comercial", unidade: "POA", tipo: "PJ",
    status: "enviado", lgpd: true, sigilo: true, monitoramento: true, imagem: true,
    dataAdmissao: "2025-02-20", email: "mariana@email.com",
  },
  {
    id: "4", nome: "Rafael Oliveira", cargo: "Técnico de Segurança", unidade: "SP", tipo: "CLT",
    status: "assinado", lgpd: true, sigilo: true, monitoramento: true, imagem: false,
    dataAdmissao: "2025-02-01", email: "rafael@email.com",
  },
  {
    id: "5", nome: "Juliana Mendes", cargo: "Assistente Administrativo", unidade: "POA", tipo: "Estágio",
    status: "incompleto", lgpd: true, sigilo: false, monitoramento: false, imagem: false,
    dataAdmissao: "2025-04-01", email: "juliana@email.com",
  },
];

const mockTemplates = [
  { id: "1", cargo: "Designer Gráfico", tipo: "CLT", ativo: true, variaveis: 12 },
  { id: "2", cargo: "Instalador Externo", tipo: "CLT", ativo: true, variaveis: 14 },
  { id: "3", cargo: "Analista Comercial", tipo: "PJ", ativo: true, variaveis: 10 },
  { id: "4", cargo: "Estagiário", tipo: "Estágio", ativo: true, variaveis: 8 },
];

const mockContratos = [
  { id: "1", candidato: "Rafael Oliveira", cargo: "Técnico de Segurança", tipo: "CLT", status: "assinado", criadoEm: "2025-01-25", assinadoEm: "2025-01-28" },
  { id: "2", candidato: "Mariana Costa", cargo: "Analista Comercial", tipo: "PJ", status: "enviado", criadoEm: "2025-02-10", assinadoEm: null },
];

const ContratosPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUnidade, setFilterUnidade] = useState("all");
  const [gerarDialogOpen, setGerarDialogOpen] = useState(false);
  const [selectedCandidato, setSelectedCandidato] = useState<typeof mockCandidatos[0] | null>(null);

  const filtered = mockCandidatos.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.cargo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchUnidade = filterUnidade === "all" || c.unidade === filterUnidade;
    return matchSearch && matchStatus && matchUnidade;
  });

  const ComplianceBadges = ({ c }: { c: typeof mockCandidatos[0] }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant={c.lgpd ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">LGPD {c.lgpd ? "✅" : "❌"}</Badge>
      <Badge variant={c.sigilo ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">Sigilo {c.sigilo ? "✅" : "❌"}</Badge>
      <Badge variant={c.monitoramento ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">Monitor. {c.monitoramento ? "✅" : "❌"}</Badge>
      <Badge variant={c.imagem ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
        <Camera className="h-3 w-3 mr-0.5" /> {c.imagem ? "Sim" : "Não"}
      </Badge>
    </div>
  );

  const handleGerarContrato = (candidato: typeof mockCandidatos[0]) => {
    setSelectedCandidato(candidato);
    setGerarDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
        <p className="text-muted-foreground">Geração e gestão de contratos com templates e assinatura digital.</p>
      </div>

      <Tabs defaultValue="candidatos">
        <TabsList>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
          <TabsTrigger value="contratos">Contratos Gerados</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ===== ABA CANDIDATOS ===== */}
        <TabsContent value="candidatos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar candidato ou cargo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas unidades</SelectItem>
                <SelectItem value="POA">POA</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = mockCandidatos.filter((c) => c.status === key).length;
              return (
                <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(key === filterStatus ? "all" : key)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <cfg.icon className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Cargo / Tipo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const st = statusConfig[c.status];
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{c.nome}</p>
                                <p className="text-xs text-muted-foreground">{c.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{c.cargo}</p>
                            <Badge variant="outline" className="text-[10px] mt-0.5">{c.tipo}</Badge>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{c.unidade}</Badge></TableCell>
                          <TableCell><ComplianceBadges c={c} /></TableCell>
                          <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                              {(c.status === "completo" || c.status === "aguardando") && (
                                <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => handleGerarContrato(c)}>
                                  <FileText className="h-3.5 w-3.5 mr-1" /> Gerar Contrato
                                </Button>
                              )}
                              {c.status === "assinado" && (
                                <Button variant="outline" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA CONTRATOS GERADOS ===== */}
        <TabsContent value="contratos" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Assinado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockContratos.map((ct) => (
                      <TableRow key={ct.id}>
                        <TableCell className="font-medium">{ct.candidato}</TableCell>
                        <TableCell>{ct.cargo}</TableCell>
                        <TableCell><Badge variant="outline">{ct.tipo}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={ct.status === "assinado" ? "default" : "secondary"}>
                            {ct.status === "assinado" ? "Assinado" : "Enviado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ct.criadoEm}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ct.assinadoEm ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA TEMPLATES ===== */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Templates de contrato por cargo</p>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Template</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockTemplates.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t.cargo}</CardTitle>
                  <CardDescription>Tipo: {t.tipo} · {t.variaveis} variáveis</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant={t.ativo ? "default" : "secondary"}>{t.ativo ? "Ativo" : "Inativo"}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG GERAR CONTRATO ===== */}
      <Dialog open={gerarDialogOpen} onOpenChange={setGerarDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Contrato</DialogTitle>
            <DialogDescription>Preencha os dados para gerar o contrato de {selectedCandidato?.nome}.</DialogDescription>
          </DialogHeader>
          {selectedCandidato && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Candidato</Label><Input value={selectedCandidato.nome} disabled /></div>
                <div><Label>Cargo</Label><Input value={selectedCandidato.cargo} disabled /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data de Início</Label><Input type="date" defaultValue={selectedCandidato.dataAdmissao} /></div>
                <div><Label>Data de Fim (se temporário)</Label><Input type="date" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Salário Base (R$)</Label><Input type="text" placeholder="5.000,00" /></div>
                <div>
                  <Label>Regime</Label>
                  <Select defaultValue="presencial">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Jornada Semanal</Label><Input defaultValue="44h" /></div>
                <div><Label>Período de Experiência</Label><Input defaultValue="45 + 45 dias" /></div>
              </div>
              <div>
                <Label className="mb-2 block">Benefícios</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Vale Transporte", "Vale Refeição", "Plano de Saúde", "Wellhub", "Seguro de Vida"].map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <Checkbox id={b} defaultChecked={b !== "Seguro de Vida"} />
                      <Label htmlFor={b} className="text-sm font-normal">{b}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Observações Adicionais</Label>
                <Textarea placeholder="Cláusulas específicas, equipamentos, etc." />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setGerarDialogOpen(false)}>Cancelar</Button>
            <Button variant="secondary"><Eye className="h-4 w-4 mr-1" /> Preview</Button>
            <Button onClick={() => setGerarDialogOpen(false)}><Send className="h-4 w-4 mr-1" /> Gerar e Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContratosPage;
