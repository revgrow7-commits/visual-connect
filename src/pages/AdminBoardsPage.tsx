import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, LayoutGrid, Settings2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { loadBoards, saveBoards, type Board, type BoardStage, type FlexField } from "@/stores/boardsStore";

const DEFAULT_COLORS = [
  "#1DB899", "#6366F1", "#F59E0B", "#3B82F6", "#8B5CF6",
  "#EC4899", "#14B8A6", "#22C55E", "#EF4444", "#F97316",
];

const FIELD_TYPES: { value: FlexField["type"]; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "select", label: "Seleção" },
  { value: "date", label: "Data" },
  { value: "boolean", label: "Sim/Não" },
  { value: "textarea", label: "Texto Longo" },
  { value: "file", label: "Arquivo" },
];

// ─── Flexfield Row ───
function FlexfieldRow({ field, onUpdate, onDelete }: { field: FlexField; onUpdate: (f: FlexField) => void; onDelete: () => void }) {
  const [optionsInput, setOptionsInput] = useState(field.options?.join(", ") || "");
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
      <GripVertical className="h-4 w-4 mt-2 text-muted-foreground cursor-grab shrink-0" />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input value={field.label} onChange={(e) => onUpdate({ ...field, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select value={field.type} onValueChange={(v) => onUpdate({ ...field, type: v as FlexField["type"] })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {field.type === "select" && (
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Opções (separadas por vírgula)</Label>
            <Input value={optionsInput} onChange={(e) => { setOptionsInput(e.target.value); onUpdate({ ...field, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }); }} className="h-8 text-sm" placeholder="Opção 1, Opção 2" />
          </div>
        )}
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-1.5 text-xs"><Switch checked={field.required} onCheckedChange={(c) => onUpdate({ ...field, required: c })} className="scale-75" />Obrigatório</label>
          <label className="flex items-center gap-1.5 text-xs"><Switch checked={field.show_on_card} onCheckedChange={(c) => onUpdate({ ...field, show_on_card: c })} className="scale-75" />Visível no card</label>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0 mt-1" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

// ─── Stage Row ───
function StageRow({ stage, onUpdate, onDelete }: { stage: BoardStage; onUpdate: (s: BoardStage) => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
      <input type="color" value={stage.color} onChange={(e) => onUpdate({ ...stage, color: e.target.value })} className="w-7 h-7 rounded border-0 cursor-pointer shrink-0" />
      <Input value={stage.name} onChange={(e) => onUpdate({ ...stage, name: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") })} className="h-8 text-sm flex-1" />
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={onDelete}><X className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

// ─── Board Editor Dialog ───
function BoardEditorDialog({ board, open, onClose, onSave }: { board: Board | null; open: boolean; onClose: () => void; onSave: (b: Board) => void }) {
  const [editBoard, setEditBoard] = useState<Board>(board || { id: `board-${Date.now()}`, name: "", color: "#1DB899", active: true, stages: [{ id: "etapa_1", name: "Etapa 1", color: "#6366F1" }, { id: "etapa_2", name: "Etapa 2", color: "#22C55E" }], flexfields: [] });
  const [activeSection, setActiveSection] = useState<"info" | "stages" | "fields">("info");

  // Sync when board prop changes
  useState(() => { if (board) setEditBoard(board); });

  const updateStage = (idx: number, s: BoardStage) => { const stages = [...editBoard.stages]; stages[idx] = s; setEditBoard({ ...editBoard, stages }); };
  const deleteStage = (idx: number) => setEditBoard({ ...editBoard, stages: editBoard.stages.filter((_, i) => i !== idx) });
  const addStage = () => { const n = editBoard.stages.length + 1; setEditBoard({ ...editBoard, stages: [...editBoard.stages, { id: `nova_etapa_${n}`, name: `Nova Etapa ${n}`, color: DEFAULT_COLORS[n % DEFAULT_COLORS.length] }] }); };
  const updateField = (idx: number, f: FlexField) => { const ff = [...editBoard.flexfields]; ff[idx] = f; setEditBoard({ ...editBoard, flexfields: ff }); };
  const deleteField = (idx: number) => setEditBoard({ ...editBoard, flexfields: editBoard.flexfields.filter((_, i) => i !== idx) });
  const addField = () => setEditBoard({ ...editBoard, flexfields: [...editBoard.flexfields, { key: `campo_${editBoard.flexfields.length + 1}`, label: "Novo Campo", type: "text", required: false, show_on_card: false }] });

  const handleSave = () => {
    if (!editBoard.name.trim()) { toast.error("Nome do board é obrigatório"); return; }
    if (editBoard.stages.length < 1) { toast.error("O board precisa de pelo menos uma etapa"); return; }
    onSave(editBoard);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" style={{ color: editBoard.color }} />{board ? "Editar Board" : "Novo Board"}</DialogTitle></DialogHeader>
        <div className="flex gap-1 border-b border-border pb-2">
          {(["info", "stages", "fields"] as const).map((s) => (
            <Button key={s} variant={activeSection === s ? "default" : "ghost"} size="sm" onClick={() => setActiveSection(s)} className="text-xs">
              {s === "info" ? "Informações" : s === "stages" ? `Etapas (${editBoard.stages.length})` : `Campos (${editBoard.flexfields.length})`}
            </Button>
          ))}
        </div>
        {activeSection === "info" && (
          <div className="space-y-4">
            <div><Label>Nome do Board</Label><Input value={editBoard.name} onChange={(e) => setEditBoard({ ...editBoard, name: e.target.value, id: board?.id || `board-${e.target.value.toLowerCase().replace(/\s+/g, "-")}` })} placeholder="Ex: Produção Completa" /></div>
            <div><Label>Cor do Board</Label><div className="flex items-center gap-3 mt-1"><input type="color" value={editBoard.color} onChange={(e) => setEditBoard({ ...editBoard, color: e.target.value })} className="w-10 h-10 rounded border-0 cursor-pointer" /><div className="flex gap-1.5 flex-wrap">{DEFAULT_COLORS.map((c) => <button key={c} className="w-7 h-7 rounded-full border-2 transition-all" style={{ backgroundColor: c, borderColor: editBoard.color === c ? "#fff" : "transparent" }} onClick={() => setEditBoard({ ...editBoard, color: c })} />)}</div></div></div>
            <div className="flex items-center gap-3"><Label>Ativo</Label><Switch checked={editBoard.active} onCheckedChange={(c) => setEditBoard({ ...editBoard, active: c })} /></div>
          </div>
        )}
        {activeSection === "stages" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Configure as etapas de produção deste board.</p>
            {editBoard.stages.map((stage, idx) => <StageRow key={stage.id + idx} stage={stage} onUpdate={(s) => updateStage(idx, s)} onDelete={() => deleteStage(idx)} />)}
            <Button variant="outline" size="sm" onClick={addStage} className="w-full"><Plus className="h-4 w-4 mr-1" /> Adicionar Etapa</Button>
          </div>
        )}
        {activeSection === "fields" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Campos extras para jobs deste tipo de produção.</p>
            {editBoard.flexfields.map((field, idx) => <FlexfieldRow key={field.key + idx} field={field} onUpdate={(f) => updateField(idx, f)} onDelete={() => deleteField(idx)} />)}
            <Button variant="outline" size="sm" onClick={addField} className="w-full"><Plus className="h-4 w-4 mr-1" /> Adicionar Campo</Button>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} style={{ backgroundColor: editBoard.color }}>{board ? "Salvar Alterações" : "Criar Board"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───
export default function AdminBoardsPage() {
  const [boards, setBoards] = useState<Board[]>(() => loadBoards());
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const persist = (next: Board[]) => { setBoards(next); saveBoards(next); };

  const handleNew = () => { setEditingBoard(null); setDialogOpen(true); };
  const handleEdit = (board: Board) => { setEditingBoard(board); setDialogOpen(true); };
  const handleSave = (board: Board) => {
    const exists = boards.find((b) => b.id === board.id);
    persist(exists ? boards.map((b) => (b.id === board.id ? board : b)) : [...boards, board]);
    setDialogOpen(false);
    toast.success(editingBoard ? "Board atualizado com sucesso" : "Board criado com sucesso");
  };
  const handleDelete = (id: string) => { persist(boards.filter((b) => b.id !== id)); toast.success("Board removido"); };
  const toggleActive = (id: string) => { persist(boards.map((b) => (b.id === id ? { ...b, active: !b.active } : b))); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Settings2 className="h-6 w-6 text-primary" />Admin — Boards de Produção</h1>
            <p className="text-sm text-muted-foreground">Configure quadros Kanban, etapas e campos customizáveis.</p>
          </div>
        </div>
        <Button onClick={handleNew} className="bg-[#1DB899] hover:bg-[#17a085] text-white"><Plus className="h-4 w-4 mr-1" /> Novo Board</Button>
      </div>

      <div className="grid gap-4">
        {boards.map((board) => (
          <Card key={board.id} className="overflow-hidden">
            <div className="h-1" style={{ backgroundColor: board.color }} />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: board.color + "22" }}><LayoutGrid className="h-5 w-5" style={{ color: board.color }} /></div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">{board.name}{!board.active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}</CardTitle>
                    <p className="text-xs text-muted-foreground">{board.stages.length} etapas · {board.flexfields.length} campos extras</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(board.id)}>{board.active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(board)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(board.id)}><Trash2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(expandedId === board.id ? null : board.id)}>{expandedId === board.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {board.stages.map((s) => <Badge key={s.id} variant="outline" className="text-xs font-normal" style={{ borderColor: s.color, color: s.color }}>{s.name}</Badge>)}
              </div>
            </CardContent>
            {expandedId === board.id && (
              <CardContent className="border-t border-border pt-4 space-y-4">
                <h4 className="text-sm font-semibold mb-2">Campos Customizáveis (Flexfields)</h4>
                {board.flexfields.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum campo extra configurado.</p>
                ) : (
                  <div className="grid gap-2">
                    {board.flexfields.map((f) => (
                      <div key={f.key} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/40 border border-border">
                        <span className="font-medium min-w-[120px]">{f.label}</span>
                        <Badge variant="secondary" className="text-xs">{FIELD_TYPES.find((t) => t.value === f.type)?.label || f.type}</Badge>
                        {f.required && <Badge className="text-xs bg-amber-500/20 text-amber-600 border-amber-300">Obrigatório</Badge>}
                        {f.show_on_card && <Badge className="text-xs bg-blue-500/20 text-blue-600 border-blue-300">Visível no card</Badge>}
                        {f.type === "select" && f.options && <span className="text-xs text-muted-foreground ml-auto">{f.options.join(" · ")}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        {boards.length === 0 && (
          <Card className="py-12 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum board configurado.</p>
            <Button onClick={handleNew} variant="outline" className="mt-3"><Plus className="h-4 w-4 mr-1" /> Criar Primeiro Board</Button>
          </Card>
        )}
      </div>
      <BoardEditorDialog board={editingBoard} open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} />
    </div>
  );
}
