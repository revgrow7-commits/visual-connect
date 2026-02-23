import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Search, Filter, Download, Building2,
  CheckCircle2, Table2, LayoutGrid,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Colaborador, StatusColaborador } from "@/components/colaboradores/types";
import ColaboradoresEditableTable from "@/components/colaboradores/ColaboradoresEditableTable";

const COLAB_SELECT = `id, nome, email_pessoal, telefone_celular, cargo, setor, unidade, data_admissao, tipo_contratacao, status, compliance_aceito, cpf, created_at, matricula, rg, data_nascimento, sexo, estado_civil, salario_base, jornada, horario, escala, pis_pasep, ctps, cep, endereco, numero, bairro, cidade, estado, banco, agencia, conta, pix, escolaridade, sst, secoes_visiveis`;

const ColaboradoresPage = () => {
  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSetor, setFilterSetor] = useState("todos");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Button className="gradient-bordo text-primary-foreground gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
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
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            {loading ? "Carregando..." : `${filtered.length} colaborador${filtered.length !== 1 ? "es" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ColaboradoresEditableTable
            colaboradores={filtered}
            loading={loading}
            onRefresh={fetchColaboradores}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ColaboradoresPage;
