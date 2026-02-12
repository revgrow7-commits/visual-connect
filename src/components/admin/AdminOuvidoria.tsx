import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Eye, Filter, AlertTriangle, Clock, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Manifestacao = {
  id: string;
  protocolo: string;
  categoria: string;
  setor: string;
  unidade: string;
  urgencia: string;
  status: string;
  anonimo: boolean;
  nome: string | null;
  email: string | null;
  descricao: string;
  created_at: string;
  setor_identificacao: string | null;
  unidade_identificacao: string | null;
};

const statusOptions = [
  { value: "aberto", label: "Aberto", color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  { value: "em_analise", label: "Em Análise", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  { value: "resolvido", label: "Resolvido", color: "bg-green-500/15 text-green-700 dark:text-green-400" },
  { value: "arquivado", label: "Arquivado", color: "bg-muted text-muted-foreground" },
];

const urgenciaColors: Record<string, string> = {
  critica: "bg-destructive/15 text-destructive",
  alta: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  media: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  baixa: "bg-green-500/15 text-green-700 dark:text-green-400",
};

const categoriaLabels: Record<string, string> = {
  incidente_critico: "Incidente Crítico",
  incidente_operacional: "Incidente Operacional",
  sugestao_estrategica: "Sugestão Estratégica",
  clima_cultura: "Clima / Cultura",
};

const AdminOuvidoria = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterUrgencia, setFilterUrgencia] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [selected, setSelected] = useState<Manifestacao | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: manifestacoes = [], isLoading } = useQuery({
    queryKey: ["admin-ouvidoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ouvidoria_manifestacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Manifestacao[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ouvidoria_manifestacoes")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ouvidoria"] });
      toast.success("Status atualizado com sucesso");
      setSelected(null);
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const filtered = manifestacoes.filter((m) => {
    const matchSearch =
      !search ||
      m.protocolo.toLowerCase().includes(search.toLowerCase()) ||
      m.descricao.toLowerCase().includes(search.toLowerCase()) ||
      (m.nome && m.nome.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "todos" || m.status === filterStatus;
    const matchUrgencia = filterUrgencia === "todos" || m.urgencia === filterUrgencia;
    const matchCategoria = filterCategoria === "todos" || m.categoria === filterCategoria;
    return matchSearch && matchStatus && matchUrgencia && matchCategoria;
  });

  const stats = {
    total: manifestacoes.length,
    abertos: manifestacoes.filter((m) => m.status === "aberto").length,
    criticos: manifestacoes.filter((m) => m.urgencia === "critica" && m.status !== "resolvido" && m.status !== "arquivado").length,
    resolvidos: manifestacoes.filter((m) => m.status === "resolvido").length,
  };

  const openDetail = (m: Manifestacao) => {
    setSelected(m);
    setNewStatus(m.status);
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.abertos}</p>
            <p className="text-xs text-muted-foreground">Abertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.criticos}</p>
            <p className="text-xs text-muted-foreground">Críticos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolvidos}</p>
            <p className="text-xs text-muted-foreground">Resolvidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar protocolo, descrição ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUrgencia} onValueChange={setFilterUrgencia}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="incidente_critico">Incidente Crítico</SelectItem>
            <SelectItem value="incidente_operacional">Incidente Operacional</SelectItem>
            <SelectItem value="sugestao_estrategica">Sugestão Estratégica</SelectItem>
            <SelectItem value="clima_cultura">Clima / Cultura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma manifestação encontrada.</div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-3 py-2 font-medium">Protocolo</th>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 font-medium">Setor</th>
                <th className="px-3 py-2 font-medium">Urgência</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Ident.</th>
                <th className="px-3 py-2 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs">{m.protocolo}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {format(new Date(m.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs">{categoriaLabels[m.categoria] || m.categoria}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{m.setor}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className={urgenciaColors[m.urgencia] || ""}>
                      {m.urgencia}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className={statusOptions.find((s) => s.value === m.status)?.color || ""}>
                      {statusOptions.find((s) => s.value === m.status)?.label || m.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs">{m.anonimo ? "Anônimo" : m.nome || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(m)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {selected.protocolo}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Categoria</p>
                  <p className="font-medium">{categoriaLabels[selected.categoria] || selected.categoria}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Urgência</p>
                  <Badge variant="secondary" className={urgenciaColors[selected.urgencia] || ""}>{selected.urgencia}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Unidade</p>
                  <p>{selected.unidade}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Setor</p>
                  <p>{selected.setor}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data</p>
                  <p>{format(new Date(selected.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Identificação</p>
                  <p>{selected.anonimo ? "Anônimo" : selected.nome || "—"}</p>
                </div>
              </div>
              {!selected.anonimo && selected.email && (
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{selected.email}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs mb-1">Descrição</p>
                <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">{selected.descricao}</div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Alterar Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              <Button
                disabled={newStatus === selected.status}
                onClick={() => updateStatus.mutate({ id: selected.id, status: newStatus })}
              >
                Salvar Status
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AdminOuvidoria;
