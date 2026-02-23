import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, Filter, Download, Building2,
  CheckCircle2, Table2, UserPlus, ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Colaborador, StatusColaborador } from "@/components/colaboradores/types";
import ColaboradoresEditableTable from "@/components/colaboradores/ColaboradoresEditableTable";
import NovoColaboradorDialog from "@/components/colaboradores/NovoColaboradorDialog";

const COLAB_SELECT = `id, nome, email_pessoal, telefone_celular, cargo, setor, unidade, data_admissao, tipo_contratacao, status, compliance_aceito, cpf, created_at, matricula, rg, data_nascimento, sexo, estado_civil, salario_base, jornada, horario, escala, pis_pasep, ctps, cep, endereco, numero, bairro, cidade, estado, banco, agencia, conta, pix, escolaridade, sst, secoes_visiveis`;

const ColaboradoresPage = () => {
  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSetor, setFilterSetor] = useState("todos");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoOpen, setNovoOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const fetchColaboradores = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("colaboradores")
      .select(COLAB_SELECT)
      .order("nome");

    if (!error) {
      setColaboradores((data as Colaborador[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchColaboradores(); }, [fetchColaboradores]);

  const filtered = colaboradores.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.cargo || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email_pessoal || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.matricula || "").toLowerCase().includes(search.toLowerCase());
    const matchUnidade = filterUnidade === "todas" || c.unidade === filterUnidade;
    const matchStatus = filterStatus === "todos" || c.status === filterStatus;
    const matchSetor = filterSetor === "todos" || c.setor === filterSetor;
    return matchSearch && matchUnidade && matchStatus && matchSetor;
  });

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterUnidade, filterStatus, filterSetor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const setores = [...new Set(colaboradores.map(c => c.setor).filter(Boolean))] as string[];

  const stats = {
    total: colaboradores.length,
    ativos: colaboradores.filter(c => c.status === "ativo").length,
    pendentes: colaboradores.filter(c => c.status === "pendente").length,
    poa: colaboradores.filter(c => c.unidade === "POA").length,
    sp: colaboradores.filter(c => c.unidade === "SP").length,
    rs: colaboradores.filter(c => c.unidade === "RS").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão completa de colaboradores — edite inline e salve.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setNovoOpen(true)} className="gradient-bordo text-primary-foreground gap-2">
            <UserPlus className="h-4 w-4" /> Novo Colaborador
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "primary" },
          { label: "Ativos", value: stats.ativos, icon: CheckCircle2, color: "success" },
          { label: "POA", value: stats.poa, icon: Building2, color: "primary" },
          { label: "SP", value: stats.sp, icon: Building2, color: "info" },
          { label: "RS", value: stats.rs, icon: Building2, color: "accent" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
                <Icon className={`h-5 w-5 text-${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{loading ? "—" : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo, e-mail ou matrícula..."
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
                <SelectItem value="RS">RS</SelectItem>
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

      {/* Full Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              {loading ? "Carregando..." : `${filtered.length} colaborador${filtered.length !== 1 ? "es" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs">Itens por página:</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ColaboradoresEditableTable
            colaboradores={paginated}
            loading={loading}
            onRefresh={fetchColaboradores}
          />
        </CardContent>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Mostrando {((currentPage - 1) * perPage) + 1}–{Math.min(currentPage * perPage, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  typeof p === "string" ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="icon"
                      className={`h-8 w-8 text-xs ${p === currentPage ? "gradient-bordo text-primary-foreground" : ""}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      <NovoColaboradorDialog open={novoOpen} onOpenChange={setNovoOpen} onSuccess={fetchColaboradores} />
    </div>
  );
};

export default ColaboradoresPage;
