import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Users, Search, Filter, UserPlus, FileText, ShieldCheck, Clock,
  Mail, Phone, MapPin, Building2, Calendar, MoreHorizontal, Eye,
  CheckCircle2, AlertCircle, Loader2, Download,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type StatusFormulario = "completo" | "incompleto" | "pendente" | "novo";
type StatusColaborador = "ativo" | "ferias" | "afastado" | "desligado";

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  unidade: string;
  dataAdmissao: string;
  statusFormulario: StatusFormulario;
  statusColaborador: StatusColaborador;
  tipoContrato: string;
  complianceLgpd: boolean;
  complianceSigilo: boolean;
  complianceMonitoramento: boolean;
  complianceImagem: boolean;
}

const mockColaboradores: Colaborador[] = [
  {
    id: "1", nome: "Fernanda Oliveira", email: "fernanda@iv.com.br", telefone: "(51) 99123-4567",
    cargo: "Analista de RH", setor: "Recursos Humanos", unidade: "POA", dataAdmissao: "2026-02-03",
    statusFormulario: "completo", statusColaborador: "ativo", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: true,
  },
  {
    id: "2", nome: "Gabriel Santos", email: "gabriel@iv.com.br", telefone: "(11) 98765-4321",
    cargo: "Técnico de Instalação", setor: "Operações", unidade: "SP", dataAdmissao: "2026-02-01",
    statusFormulario: "completo", statusColaborador: "ativo", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: false,
  },
  {
    id: "3", nome: "Helena Costa", email: "helena@iv.com.br", telefone: "(51) 99876-5432",
    cargo: "Designer Gráfico", setor: "Marketing", unidade: "POA", dataAdmissao: "2026-01-27",
    statusFormulario: "completo", statusColaborador: "ativo", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: true,
  },
  {
    id: "4", nome: "Ricardo Lima", email: "ricardo@iv.com.br", telefone: "(51) 99111-2222",
    cargo: "Gerente de Projetos", setor: "Operações", unidade: "POA", dataAdmissao: "2025-06-15",
    statusFormulario: "completo", statusColaborador: "ativo", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: true,
  },
  {
    id: "5", nome: "Juliana Martins", email: "juliana@iv.com.br", telefone: "(11) 97654-3210",
    cargo: "Analista Comercial", setor: "Comercial", unidade: "SP", dataAdmissao: "2025-09-01",
    statusFormulario: "completo", statusColaborador: "ferias", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: false,
  },
  {
    id: "6", nome: "Carlos Eduardo Ramos", email: "carlos@iv.com.br", telefone: "(51) 99333-4444",
    cargo: "Técnico de Segurança", setor: "Segurança", unidade: "POA", dataAdmissao: "2024-03-10",
    statusFormulario: "completo", statusColaborador: "ativo", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: true,
  },
  {
    id: "7", nome: "Mariana Souza", email: "mariana@iv.com.br", telefone: "(11) 98888-7777",
    cargo: "Estagiária de Design", setor: "Marketing", unidade: "SP", dataAdmissao: "2026-02-10",
    statusFormulario: "novo", statusColaborador: "ativo", tipoContrato: "Estágio",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: true, complianceImagem: true,
  },
  {
    id: "8", nome: "André Pereira", email: "andre@iv.com.br", telefone: "(51) 99555-6666",
    cargo: "Instalador Sênior", setor: "Operações", unidade: "POA", dataAdmissao: "2026-02-10",
    statusFormulario: "pendente", statusColaborador: "ativo", tipoContrato: "CLT",
    complianceLgpd: true, complianceSigilo: true, complianceMonitoramento: false, complianceImagem: false,
  },
];

const statusFormBadge: Record<StatusFormulario, { label: string; className: string; icon: React.ReactNode }> = {
  completo: { label: "Completo", className: "bg-success/10 text-success border-success/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  incompleto: { label: "Incompleto", className: "bg-warning/10 text-warning border-warning/20", icon: <AlertCircle className="h-3 w-3" /> },
  pendente: { label: "Pendente", className: "bg-info/10 text-info border-info/20", icon: <Loader2 className="h-3 w-3" /> },
  novo: { label: "Novo", className: "bg-primary/10 text-primary border-primary/20", icon: <UserPlus className="h-3 w-3" /> },
};

const statusColabBadge: Record<StatusColaborador, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  ferias: { label: "Férias", className: "bg-info/10 text-info border-info/20" },
  afastado: { label: "Afastado", className: "bg-warning/10 text-warning border-warning/20" },
  desligado: { label: "Desligado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const ColaboradoresPage = () => {
  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSetor, setFilterSetor] = useState("todos");
  const [selectedColab, setSelectedColab] = useState<Colaborador | null>(null);

  const filtered = mockColaboradores.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cargo.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchUnidade = filterUnidade === "todas" || c.unidade === filterUnidade;
    const matchStatus = filterStatus === "todos" || c.statusColaborador === filterStatus;
    const matchSetor = filterSetor === "todos" || c.setor === filterSetor;
    return matchSearch && matchUnidade && matchStatus && matchSetor;
  });

  const setores = [...new Set(mockColaboradores.map(c => c.setor))];

  const stats = {
    total: mockColaboradores.length,
    ativos: mockColaboradores.filter(c => c.statusColaborador === "ativo").length,
    novos: mockColaboradores.filter(c => c.statusFormulario === "novo" || c.statusFormulario === "pendente").length,
    completos: mockColaboradores.filter(c => c.statusFormulario === "completo").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de colaboradores — novos ingressos aparecem aqui após o aceite do formulário de admissão.
          </p>
        </div>
        <Button className="gradient-bordo text-primary-foreground gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.novos}</p>
              <p className="text-xs text-muted-foreground">Novos / Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completos}</p>
              <p className="text-xs text-muted-foreground">Formulários OK</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Building2 className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="POA">POA</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSetor} onValueChange={setFilterSetor}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="ferias">Férias</SelectItem>
                <SelectItem value="afastado">Afastados</SelectItem>
                <SelectItem value="desligado">Desligados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} colaborador{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="hidden md:table-cell">Cargo / Setor</TableHead>
                  <TableHead className="hidden lg:table-cell">Unidade</TableHead>
                  <TableHead className="hidden lg:table-cell">Admissão</TableHead>
                  <TableHead>Formulário</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Compliance</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const fb = statusFormBadge[c.statusFormulario];
                  const sb = statusColabBadge[c.statusColaborador];
                  return (
                    <TableRow key={c.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(c.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                            <p className="text-xs text-muted-foreground truncate md:hidden">{c.cargo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-foreground">{c.cargo}</p>
                        <p className="text-xs text-muted-foreground">{c.setor}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">{c.unidade}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(c.dataAdmissao)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-xs ${fb.className}`}>
                          {fb.icon} {fb.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={`text-xs ${sb.className}`}>
                          {sb.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex gap-1">
                          <span title="LGPD" className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${c.complianceLgpd ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            L
                          </span>
                          <span title="Sigilo" className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${c.complianceSigilo ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            S
                          </span>
                          <span title="Monitoramento" className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${c.complianceMonitoramento ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            M
                          </span>
                          <span title="Imagem" className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${c.complianceImagem ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            📷
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedColab(c)}>
                              <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" /> Ver formulário
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ShieldCheck className="h-4 w-4 mr-2" /> Compliance
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="h-4 w-4 mr-2" /> Banco de horas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedColab} onOpenChange={(o) => !o && setSelectedColab(null)}>
        <DialogContent className="max-w-lg">
          {selectedColab && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(selectedColab.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-bold">{selectedColab.nome}</p>
                    <p className="text-sm text-muted-foreground font-normal">{selectedColab.cargo} · {selectedColab.setor}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{selectedColab.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedColab.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Unidade {selectedColab.unidade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedColab.dataAdmissao)}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Compliance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "LGPD", ok: selectedColab.complianceLgpd },
                      { label: "Sigilo", ok: selectedColab.complianceSigilo },
                      { label: "Monitoramento", ok: selectedColab.complianceMonitoramento },
                      { label: "Uso de Imagem", ok: selectedColab.complianceImagem },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        {item.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 flex gap-2 flex-wrap">
                  <Badge variant="outline" className={statusColabBadge[selectedColab.statusColaborador].className}>
                    {statusColabBadge[selectedColab.statusColaborador].label}
                  </Badge>
                  <Badge variant="outline">{selectedColab.tipoContrato}</Badge>
                  <Badge variant="outline" className={statusFormBadge[selectedColab.statusFormulario].className + " gap-1"}>
                    {statusFormBadge[selectedColab.statusFormulario].icon}
                    Formulário {statusFormBadge[selectedColab.statusFormulario].label}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColaboradoresPage;
