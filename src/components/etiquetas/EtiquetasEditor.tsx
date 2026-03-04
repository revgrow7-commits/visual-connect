import React, { useState, useMemo } from "react";
import {
  useEtiquetas,
  useCreateEtiqueta,
  useUpdateEtiqueta,
  useDeleteEtiqueta,
  useEtiquetasHistorico,
  ETIQUETA_COLORS,
  etiquetaCorToBg,
  type Etiqueta,
} from "@/hooks/useEtiquetas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Trash2, X, Check, Plus, ChevronLeft, History, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const INITIAL_SHOW = 6;

interface Props {
  /** IDs of currently selected/active labels (for checkbox toggling) */
  selectedIds?: string[];
  onToggle?: (id: string, selected: boolean) => void;
}

const EtiquetasEditor: React.FC<Props> = ({ selectedIds = [], onToggle }) => {
  const { data: etiquetas, isLoading } = useEtiquetas();
  const { data: historico, isLoading: loadingHist } = useEtiquetasHistorico();
  const createEtiqueta = useCreateEtiqueta();
  const updateEtiqueta = useUpdateEtiqueta();
  const deleteEtiqueta = useDeleteEtiqueta();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit" | "history">("list");
  const [formNome, setFormNome] = useState("");
  const [formCor, setFormCor] = useState("green");
  const [formDesc, setFormDesc] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [colorblindMode, setColorblindMode] = useState(false);

  const filtered = useMemo(() => {
    const list = etiquetas || [];
    if (!search.trim()) return list;
    return list.filter((e) => e.nome.toLowerCase().includes(search.toLowerCase()));
  }, [etiquetas, search]);

  const displayed = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW && !showAll;

  const startCreate = () => {
    setView("create");
    setFormNome("");
    setFormCor("green");
    setFormDesc("");
  };

  const startEdit = (et: Etiqueta) => {
    setEditingId(et.id);
    setView("edit");
    setFormNome(et.nome);
    setFormCor(et.cor);
    setFormDesc(et.descricao || "");
  };

  const goBack = () => {
    setView("list");
    setEditingId(null);
    setFormNome("");
  };

  const handleCreate = () => {
    if (!formNome.trim()) return;
    createEtiqueta.mutate(
      { nome: formNome.trim(), cor: formCor, descricao: formDesc.trim() || undefined },
      { onSuccess: goBack }
    );
  };

  const handleUpdate = () => {
    if (!editingId || !formNome.trim()) return;
    const original = etiquetas?.find((e) => e.id === editingId);
    if (!original) return;
    updateEtiqueta.mutate(
      {
        id: editingId,
        dados_anteriores: { nome: original.nome, cor: original.cor, descricao: original.descricao },
        nome: formNome.trim(),
        cor: formCor,
        descricao: formDesc.trim() || undefined,
      },
      { onSuccess: goBack }
    );
  };

  const handleDelete = () => {
    const et = etiquetas?.find((e) => e.id === editingId);
    if (!et || !confirm(`Excluir etiqueta "${et.nome}"?`)) return;
    deleteEtiqueta.mutate(et, { onSuccess: goBack });
  };

  const acaoLabel: Record<string, { text: string; color: string }> = {
    criada: { text: "Criada", color: "bg-green-100 text-green-800" },
    editada: { text: "Editada", color: "bg-blue-100 text-blue-800" },
    excluida: { text: "Excluída", color: "bg-red-100 text-red-800" },
  };

  // ── HISTORY VIEW ──
  if (view === "history") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 pb-2">
          <button onClick={goBack} className="text-white/50 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          <h3 className="text-white font-semibold text-sm flex-1 text-center">Histórico de Etiquetas</h3>
          <div className="w-4" />
        </div>
        <Separator className="bg-white/10" />
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingHist ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/50" /></div>
          ) : !historico?.length ? (
            <p className="text-white/40 text-sm text-center py-6">Nenhum registro</p>
          ) : (
            historico.map((h) => {
              const info = acaoLabel[h.acao] || { text: h.acao, color: "bg-gray-100 text-gray-800" };
              const dados = (h.dados_novos || h.dados_anteriores) as Record<string, unknown> | null;
              return (
                <div key={h.id} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                  <Badge className={`${info.color} text-[10px] shrink-0`}>{info.text}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{(dados?.nome as string) || "Etiqueta"}</p>
                    {dados?.cor && <div className={`inline-block h-3 w-8 rounded mt-1 ${etiquetaCorToBg(dados.cor as string)}`} />}
                  </div>
                  <span className="text-white/40 text-[10px] shrink-0">
                    {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ──
  if (view === "create" || view === "edit") {
    const isEdit = view === "edit";
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 pb-2">
          <button onClick={goBack} className="text-white/50 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          <h3 className="text-white font-semibold text-sm flex-1 text-center">
            {isEdit ? "Editar etiqueta" : "Criar etiqueta"}
          </h3>
          <div className="w-4" />
        </div>
        <Separator className="bg-white/10" />
        <div className="p-4 space-y-4 flex-1">
          {/* Preview */}
          <div>
            <p className="text-white/60 text-xs mb-1.5">Pré-visualização</p>
            <div className={`h-9 rounded px-3 flex items-center ${etiquetaCorToBg(formCor)}`}>
              <span className="text-white text-sm font-bold truncate">{formNome || " "}</span>
              {colorblindMode && (
                <span className="ml-auto text-white/80 text-[10px] font-mono uppercase">{formCor}</span>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Nome</label>
            <Input
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Nome da etiqueta..."
              className="bg-white/10 border-white/20 text-white h-9 text-sm placeholder:text-white/30"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Descrição (opcional)</label>
            <Input
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Descrição..."
              className="bg-white/10 border-white/20 text-white h-9 text-sm placeholder:text-white/30"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-white/60 text-xs mb-2 block">Selecione uma cor</label>
            <div className="grid grid-cols-5 gap-2">
              {ETIQUETA_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFormCor(c.value)}
                  className={`h-8 rounded-md ${c.bg} ${formCor === c.value ? "ring-2 ring-offset-2 ring-offset-[#0d1117] ring-white scale-105" : ""} hover:opacity-80 transition-all relative`}
                  title={c.label}
                >
                  {formCor === c.value && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />}
                  {colorblindMode && (
                    <span className="text-white/90 text-[8px] font-mono">{c.label.slice(0, 3)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={isEdit ? handleUpdate : handleCreate} disabled={createEtiqueta.isPending || updateEtiqueta.isPending} className="flex-1 text-xs">
              {(createEtiqueta.isPending || updateEtiqueta.isPending) && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
            {isEdit && (
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteEtiqueta.isPending} className="text-xs px-3">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (main) ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-white font-semibold text-sm">Etiquetas</h3>
        <button onClick={() => setView("history")} className="text-white/50 hover:text-white" title="Histórico">
          <History className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar etiquetas..."
          className="bg-white/10 border-white/20 text-white h-9 text-sm placeholder:text-white/30"
        />
      </div>

      <Separator className="bg-white/10" />

      {/* Label title */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-white/50 text-xs font-medium">Etiquetas</p>
      </div>

      {/* Labels list */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1.5">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/50" /></div>
        ) : displayed.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">Nenhuma etiqueta encontrada</p>
        ) : (
          displayed.map((et) => {
            const isSelected = selectedIds.includes(et.id);
            return (
              <div key={et.id} className="flex items-center gap-2 group">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggle?.(et.id, !!checked)}
                  className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50 shrink-0"
                />
                <button
                  onClick={() => onToggle?.(et.id, !isSelected)}
                  className={`flex-1 h-8 rounded px-3 text-left text-xs font-bold text-white truncate ${etiquetaCorToBg(et.cor)} hover:opacity-90 transition-opacity`}
                >
                  {et.nome}
                  {colorblindMode && (
                    <span className="ml-2 text-white/70 font-mono text-[10px] uppercase">({et.cor})</span>
                  )}
                </button>
                <button
                  onClick={() => startEdit(et)}
                  className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Actions footer */}
      <div className="p-4 space-y-2">
        <Separator className="bg-white/10 mb-3" />

        <Button onClick={startCreate} variant="ghost" size="sm" className="w-full text-white/70 hover:text-white hover:bg-white/10 text-xs justify-center">
          Criar uma nova etiqueta
        </Button>

        {hasMore && (
          <Button onClick={() => setShowAll(true)} variant="ghost" size="sm" className="w-full text-white/70 hover:text-white hover:bg-white/10 text-xs justify-center">
            Mostrar mais etiquetas
          </Button>
        )}

        <Separator className="bg-white/10" />

        <div className="flex items-center justify-between py-1">
          <span className="text-white/60 text-xs">
            Habilitar o modo compatível para<br />usuários com daltonismo
          </span>
          <Switch
            checked={colorblindMode}
            onCheckedChange={setColorblindMode}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default EtiquetasEditor;
