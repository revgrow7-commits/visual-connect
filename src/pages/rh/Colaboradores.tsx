import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, Search, Filter, UserPlus, FileText, ShieldCheck, Clock,
  Mail, Phone, Building2, Calendar, MoreHorizontal, Eye,
  CheckCircle2, AlertCircle, Loader2, Download,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type StatusColaborador = "ativo" | "pendente" | "inativo";

interface Colaborador {
  id: string;
  nome: string;
  email_pessoal: string | null;
  telefone_celular: string | null;
  cargo: string | null;
  setor: string | null;
  unidade: string | null;
  data_admissao: string | null;
  tipo_contratacao: string | null;
  status: StatusColaborador;
  compliance_aceito: boolean | null;
  cpf: string | null;
  created_at: string;
}

const statusColabBadge: Record<StatusColaborador, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  pendente: { label: "Pendente", className: "bg-info/10 text-info border-info/20" },
  inativo: { label: "Inativo", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("pt-BR");
};

const maskCpf = (cpf: string | null) => {
  if (!cpf) return "—";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length < 11) return "***.***.***-**";
  return `${clean.slice(0, 3)}.***.***.${clean.slice(-2)}`;
};

const ColaboradoresPage = () => {
  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSetor, setFilterSetor] = useState("todos");
  const [selectedColab, setSelectedColab] = useState<Colaborador | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColaboradores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome, email_pessoal, telefone_celular, cargo, setor, unidade, data_admissao, tipo_contratacao, status, compliance_aceito, cpf, created_at")
        .order("nome");

      if (error) {
        console.error("Error fetching colaboradores:", error);
      } else {
        setColaboradores((data as Colaborador[]) || []);
      }
      setLoading(false);
    };
    fetchColaboradores();
  }, []);

  const filtered = colaboradores.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.cargo || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email_pessoal || "").toLowerCase().includes(search.toLowerCase());
    const matchUnidade = filterUnidade === "todas" || c.unidade === filterUnidade;
    const matchStatus = filterStatus === "todos" || c.status === filterStatus;
    const matchSetor = filterSetor === "todos" || c.setor === filterSetor;
    return matchSearch && matchUnidade && matchStatus && matchSetor;
  });

  const setores = [...new Set(colaboradores.map(c => c.setor).filter(Boolean))] as string[];

  const stats = {
    total: colaboradores.length,
    ativos: colaboradores.filter(c => c.status === "ativo").length,
    pendentes: colaboradores.filter(c => c.status === "pendente").length,
    poa: colaboradores.filter(c => c.unidade === "POA").length,
    sp: colaboradores.filter(c => c.unidade === "SP").length,
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
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : stats.total}</p>
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
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : stats.ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : stats.poa}</p>
              <p className="text-xs text-muted-foreground">POA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : stats.sp}</p>
              <p className="text-xs text-muted-foreground">SP</p>
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
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setores.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {loading ? "Carregando..." : `${filtered.length} colaborador${filtered.length !== 1 ? "es" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
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
                  <TableHead className="hidden lg:table-cell">Contato</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Compliance</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-9 w-48" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {filtered.map((c) => {
                      const sb = statusColabBadge[c.status] || statusColabBadge.ativo;
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
                                <p className="text-xs text-muted-foreground truncate md:hidden">{c.cargo || "—"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="text-sm text-foreground">{c.cargo || "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.setor || "—"}</p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs">{c.unidade || "—"}</Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.email_pessoal || "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.telefone_celular || "—"}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className={`text-xs ${sb.className}`}>
                              {sb.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {c.compliance_aceito ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            )}
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
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          Nenhum colaborador encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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
                    <p className="text-sm text-muted-foreground font-normal">{selectedColab.cargo || "—"} · {selectedColab.setor || "—"}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{selectedColab.email_pessoal || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedColab.telefone_celular || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Unidade {selectedColab.unidade || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedColab.data_admissao)}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Informações Adicionais</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">CPF:</span>{" "}
                      <span className="font-mono">{maskCpf(selectedColab.cpf)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>{" "}
                      <span>{selectedColab.tipo_contratacao || "CLT"}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Compliance</p>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedColab.compliance_aceito ? (
                      <><CheckCircle2 className="h-4 w-4 text-success" /><span className="text-foreground">Termos aceitos</span></>
                    ) : (
                      <><AlertCircle className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Pendente</span></>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 flex gap-2 flex-wrap">
                  <Badge variant="outline" className={statusColabBadge[selectedColab.status]?.className}>
                    {statusColabBadge[selectedColab.status]?.label || selectedColab.status}
                  </Badge>
                  <Badge variant="outline">{selectedColab.tipo_contratacao || "CLT"}</Badge>
                  <Badge variant="outline">{selectedColab.unidade}</Badge>
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
