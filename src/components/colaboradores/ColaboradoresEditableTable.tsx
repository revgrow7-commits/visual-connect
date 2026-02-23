import React, { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Pencil, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Colaborador } from "./types";

const SECOES_DISPONIVEIS = [
  "RH", "Operação", "Comercial", "Financeiro", "CS", "Marketing",
  "Compras", "Jurídico", "Fiscal", "Contábil", "PCP", "Admin",
];

const formatDate = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR");
};

const formatDateInput = (d: string | null) => {
  if (!d) return "";
  return d.split("T")[0];
};

interface Props {
  colaboradores: Colaborador[];
  loading: boolean;
  onRefresh: () => void;
}

type EditingRow = Record<string, string | boolean | string[] | null>;

const ColaboradoresEditableTable: React.FC<Props> = ({ colaboradores, loading, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditingRow>({});
  const [saving, setSaving] = useState(false);
  const [expandedSst, setExpandedSst] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  // Sync top scrollbar ↔ table scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateWidth = () => setScrollWidth(el.scrollWidth);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);

    const syncFromTable = () => {
      if (topScrollRef.current) topScrollRef.current.scrollLeft = el.scrollLeft;
    };
    const syncFromTop = () => {
      if (scrollRef.current) scrollRef.current.scrollLeft = topScrollRef.current!.scrollLeft;
    };

    el.addEventListener("scroll", syncFromTable);
    topScrollRef.current?.addEventListener("scroll", syncFromTop);

    return () => {
      el.removeEventListener("scroll", syncFromTable);
      topScrollRef.current?.removeEventListener("scroll", syncFromTop);
      ro.disconnect();
    };
  }, [loading]);

  const startEdit = useCallback((c: Colaborador) => {
    setEditingId(c.id);
    setEditData({
      matricula: c.matricula || "",
      nome: c.nome,
      cpf: c.cpf || "",
      rg: c.rg || "",
      data_nascimento: formatDateInput(c.data_nascimento),
      sexo: c.sexo || "",
      estado_civil: c.estado_civil || "",
      email_pessoal: c.email_pessoal || "",
      telefone_celular: c.telefone_celular || "",
      cargo: c.cargo || "",
      setor: c.setor || "",
      unidade: c.unidade || "",
      data_admissao: formatDateInput(c.data_admissao),
      tipo_contratacao: c.tipo_contratacao || "",
      salario_base: c.salario_base || "",
      jornada: c.jornada || "",
      horario: c.horario || "",
      escala: c.escala || "",
      status: c.status || "pendente",
      pis_pasep: c.pis_pasep || "",
      ctps: c.ctps || "",
      cep: c.cep || "",
      endereco: c.endereco || "",
      numero: c.numero || "",
      bairro: c.bairro || "",
      cidade: c.cidade || "",
      estado: c.estado || "",
      banco: c.banco || "",
      agencia: c.agencia || "",
      conta: c.conta || "",
      pix: c.pix || "",
      escolaridade: c.escolaridade || "",
      sst_status_aso: (c.sst as any)?.status_aso || "",
      sst_tipo_exame: (c.sst as any)?.tipo_exame || "",
      compliance_aceito: c.compliance_aceito || false,
      secoes_visiveis: c.secoes_visiveis || [],
    });
  }, []);

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    const { sst_status_aso, sst_tipo_exame, secoes_visiveis, ...rest } = editData;

    const updatePayload: Record<string, any> = {};
    const fields = [
      "matricula", "nome", "cpf", "rg", "data_nascimento", "sexo", "estado_civil",
      "email_pessoal", "telefone_celular", "cargo", "setor", "unidade",
      "data_admissao", "tipo_contratacao", "salario_base", "jornada", "horario",
      "escala", "status", "pis_pasep", "ctps", "cep", "endereco", "numero",
      "bairro", "cidade", "estado", "banco", "agencia", "conta", "pix",
      "escolaridade", "compliance_aceito",
    ];
    fields.forEach((f) => {
      const val = rest[f];
      if (val === "") {
        updatePayload[f] = null;
      } else {
        updatePayload[f] = val;
      }
    });

    updatePayload.sst = {
      status_aso: sst_status_aso || null,
      tipo_exame: sst_tipo_exame || null,
    };
    updatePayload.secoes_visiveis = secoes_visiveis;

    const { error } = await supabase
      .from("colaboradores")
      .update(updatePayload)
      .eq("id", editingId);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo com sucesso!" });
      setEditingId(null);
      setEditData({});
      onRefresh();
    }
  };

  const setField = (key: string, value: any) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSecao = (secao: string) => {
    setEditData((prev) => {
      const current = (prev.secoes_visiveis as string[]) || [];
      const next = current.includes(secao)
        ? current.filter((s) => s !== secao)
        : [...current, secao];
      return { ...prev, secoes_visiveis: next };
    });
  };

  const renderCell = (c: Colaborador, field: string, value: string | null | undefined, type: "text" | "date" | "select" = "text", options?: string[]) => {
    if (editingId === c.id) {
      if (type === "select" && options) {
        return (
          <Select value={(editData[field] as string) || ""} onValueChange={(v) => setField(field, v)}>
            <SelectTrigger className="h-7 text-xs min-w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      return (
        <Input
          type={type}
          value={(editData[field] as string) || ""}
          onChange={(e) => setField(field, e.target.value)}
          className="h-7 text-xs min-w-[80px]"
        />
      );
    }
    if (type === "date") return <span className="text-xs whitespace-nowrap">{formatDate(value || null)}</span>;
    return <span className="text-xs whitespace-nowrap">{value || "—"}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* External top horizontal scrollbar */}
      <div
        ref={topScrollRef}
        className="overflow-x-auto scrollbar-external"
        style={{ overflowY: "hidden" }}
      >
        <div style={{ width: scrollWidth, height: 1 }} />
      </div>
      <style>{`
        .scrollbar-external::-webkit-scrollbar { height: 12px; }
        .scrollbar-external::-webkit-scrollbar-track { background: hsl(var(--muted)); border-radius: 6px; }
        .scrollbar-external::-webkit-scrollbar-thumb { background: hsl(var(--primary)); border-radius: 6px; min-width: 60px; }
        .scrollbar-external::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary) / 0.8); }
        .scrollbar-external { scrollbar-width: auto; scrollbar-color: hsl(var(--primary)) hsl(var(--muted)); }
        .scrollbar-thin::-webkit-scrollbar { height: 10px; width: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: hsl(var(--muted)); border-radius: 5px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--primary)); border-radius: 5px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary) / 0.8); }
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: hsl(var(--primary)) hsl(var(--muted)); }
      `}</style>

      <div ref={scrollRef} className="overflow-x-auto scrollbar-thin" style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-background min-w-[40px]">Ações</TableHead>
            <TableHead className="min-w-[80px]">Matrícula</TableHead>
            <TableHead className="min-w-[180px]">Nome</TableHead>
            <TableHead className="min-w-[120px]">CPF</TableHead>
            <TableHead className="min-w-[100px]">RG</TableHead>
            <TableHead className="min-w-[110px]">Nascimento</TableHead>
            <TableHead className="min-w-[70px]">Sexo</TableHead>
            <TableHead className="min-w-[100px]">Estado Civil</TableHead>
            <TableHead className="min-w-[180px]">E-mail</TableHead>
            <TableHead className="min-w-[120px]">Telefone</TableHead>
            <TableHead className="min-w-[140px]">Cargo</TableHead>
            <TableHead className="min-w-[120px]">Setor</TableHead>
            <TableHead className="min-w-[60px]">Unidade</TableHead>
            <TableHead className="min-w-[110px]">Admissão</TableHead>
            <TableHead className="min-w-[80px]">Tipo</TableHead>
            <TableHead className="min-w-[100px]">Salário</TableHead>
            <TableHead className="min-w-[80px]">Jornada</TableHead>
            <TableHead className="min-w-[80px]">Horário</TableHead>
            <TableHead className="min-w-[80px]">Escala</TableHead>
            <TableHead className="min-w-[80px]">Status</TableHead>
            <TableHead className="min-w-[100px]">PIS/PASEP</TableHead>
            <TableHead className="min-w-[80px]">CTPS</TableHead>
            <TableHead className="min-w-[80px]">CEP</TableHead>
            <TableHead className="min-w-[150px]">Endereço</TableHead>
            <TableHead className="min-w-[50px]">Nº</TableHead>
            <TableHead className="min-w-[100px]">Bairro</TableHead>
            <TableHead className="min-w-[100px]">Cidade</TableHead>
            <TableHead className="min-w-[50px]">UF</TableHead>
            <TableHead className="min-w-[80px]">Banco</TableHead>
            <TableHead className="min-w-[70px]">Agência</TableHead>
            <TableHead className="min-w-[80px]">Conta</TableHead>
            <TableHead className="min-w-[100px]">PIX</TableHead>
            <TableHead className="min-w-[100px]">Escolaridade</TableHead>
            <TableHead className="min-w-[90px]">ASO Status</TableHead>
            <TableHead className="min-w-[100px]">ASO Tipo</TableHead>
            <TableHead className="min-w-[70px]">Compliance</TableHead>
            <TableHead className="min-w-[200px]">Seções Visíveis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colaboradores.map((c) => {
            const isEditing = editingId === c.id;
            const sst = (c.sst as any) || {};
            return (
              <TableRow key={c.id} className={isEditing ? "bg-primary/5" : ""}>
                <TableCell className="sticky left-0 z-10 bg-background">
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={saving}>
                        <Save className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
                <TableCell>{renderCell(c, "matricula", c.matricula)}</TableCell>
                <TableCell className="font-medium">{renderCell(c, "nome", c.nome)}</TableCell>
                <TableCell>{renderCell(c, "cpf", c.cpf)}</TableCell>
                <TableCell>{renderCell(c, "rg", c.rg)}</TableCell>
                <TableCell>{renderCell(c, "data_nascimento", c.data_nascimento, "date")}</TableCell>
                <TableCell>{renderCell(c, "sexo", c.sexo, "select", ["M", "F"])}</TableCell>
                <TableCell>{renderCell(c, "estado_civil", c.estado_civil, "select", ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"])}</TableCell>
                <TableCell>{renderCell(c, "email_pessoal", c.email_pessoal)}</TableCell>
                <TableCell>{renderCell(c, "telefone_celular", c.telefone_celular)}</TableCell>
                <TableCell>{renderCell(c, "cargo", c.cargo)}</TableCell>
                <TableCell>{renderCell(c, "setor", c.setor)}</TableCell>
                <TableCell>{renderCell(c, "unidade", c.unidade, "select", ["POA", "SP", "RS"])}</TableCell>
                <TableCell>{renderCell(c, "data_admissao", c.data_admissao, "date")}</TableCell>
                <TableCell>{renderCell(c, "tipo_contratacao", c.tipo_contratacao, "select", ["CLT", "PJ", "Estágio", "Temporário"])}</TableCell>
                <TableCell>{renderCell(c, "salario_base", c.salario_base)}</TableCell>
                <TableCell>{renderCell(c, "jornada", c.jornada)}</TableCell>
                <TableCell>{renderCell(c, "horario", c.horario)}</TableCell>
                <TableCell>{renderCell(c, "escala", c.escala)}</TableCell>
                <TableCell>{renderCell(c, "status", c.status, "select", ["ativo", "pendente", "inativo"])}</TableCell>
                <TableCell>{renderCell(c, "pis_pasep", c.pis_pasep)}</TableCell>
                <TableCell>{renderCell(c, "ctps", c.ctps)}</TableCell>
                <TableCell>{renderCell(c, "cep", c.cep)}</TableCell>
                <TableCell>{renderCell(c, "endereco", c.endereco)}</TableCell>
                <TableCell>{renderCell(c, "numero", c.numero)}</TableCell>
                <TableCell>{renderCell(c, "bairro", c.bairro)}</TableCell>
                <TableCell>{renderCell(c, "cidade", c.cidade)}</TableCell>
                <TableCell>{renderCell(c, "estado", c.estado)}</TableCell>
                <TableCell>{renderCell(c, "banco", c.banco)}</TableCell>
                <TableCell>{renderCell(c, "agencia", c.agencia)}</TableCell>
                <TableCell>{renderCell(c, "conta", c.conta)}</TableCell>
                <TableCell>{renderCell(c, "pix", c.pix)}</TableCell>
                <TableCell>{renderCell(c, "escolaridade", c.escolaridade)}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select value={(editData.sst_status_aso as string) || ""} onValueChange={(v) => setField("sst_status_aso", v)}>
                      <SelectTrigger className="h-7 text-xs min-w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Válido">Válido</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={`text-[10px] ${
                      sst.status_aso === "Válido" ? "bg-success/10 text-success border-success/20" :
                      sst.status_aso === "Pendente" ? "bg-info/10 text-info border-info/20" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {sst.status_aso || "—"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input value={(editData.sst_tipo_exame as string) || ""} onChange={(e) => setField("sst_tipo_exame", e.target.value)} className="h-7 text-xs min-w-[80px]" />
                  ) : (
                    <span className="text-xs">{sst.tipo_exame || "—"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Checkbox
                      checked={!!editData.compliance_aceito}
                      onCheckedChange={(v) => setField("compliance_aceito", !!v)}
                    />
                  ) : (
                    <Badge variant="outline" className={`text-[10px] ${c.compliance_aceito ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {c.compliance_aceito ? "Sim" : "Não"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-7 text-xs min-w-[140px] justify-start">
                          {((editData.secoes_visiveis as string[]) || []).length > 0
                            ? `${(editData.secoes_visiveis as string[]).length} seções`
                            : "Selecionar..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-2" align="start">
                        <div className="space-y-1">
                          {SECOES_DISPONIVEIS.map((s) => (
                            <label key={s} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted p-1 rounded">
                              <Checkbox
                                checked={((editData.secoes_visiveis as string[]) || []).includes(s)}
                                onCheckedChange={() => toggleSecao(s)}
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(c.secoes_visiveis || []).length > 0
                        ? (c.secoes_visiveis || []).map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                          ))
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {colaboradores.length === 0 && (
            <TableRow>
              <TableCell colSpan={37} className="h-32 text-center text-muted-foreground">
                Nenhum colaborador encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};

export default ColaboradoresEditableTable;
