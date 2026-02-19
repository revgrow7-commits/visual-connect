import React, { useState } from "react";
import {
  useTrelloLabels,
  useCreateTrelloLabel,
  useUpdateTrelloLabel,
  useDeleteTrelloLabel,
  useToggleCardLabel,
  trelloColorToTw,
  TRELLO_COLOR_MAP,
  type TrelloLabel,
} from "./useTrelloData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, X, Pencil, Plus, Trash2, Loader2 } from "lucide-react";

interface Props {
  boardId: string | null;
  cardId?: string | null;
  cardLabelIds?: string[];
  trigger?: React.ReactNode;
}

const AVAILABLE_COLORS = [
  "green", "yellow", "orange", "red", "purple",
  "blue", "sky", "lime", "pink", "black",
];

const LabelManager: React.FC<Props> = ({ boardId, cardId, cardLabelIds = [], trigger }) => {
  const { data: labels, isLoading } = useTrelloLabels(boardId);
  const createLabel = useCreateTrelloLabel(boardId);
  const updateLabel = useUpdateTrelloLabel();
  const deleteLabel = useDeleteTrelloLabel();
  const toggleCardLabel = useToggleCardLabel(boardId);

  const [search, setSearch] = useState("");
  const [editingLabel, setEditingLabel] = useState<TrelloLabel | null>(null);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("green");

  const filtered = (labels || []).filter(
    (l) => l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (label: TrelloLabel) => {
    if (!cardId) return;
    const hasLabel = cardLabelIds.includes(label.id);
    toggleCardLabel.mutate({ cardId, labelId: label.id, hasLabel });
  };

  const handleSaveNew = () => {
    if (!formName.trim()) return;
    createLabel.mutate(
      { name: formName.trim(), color: formColor },
      { onSuccess: () => { setCreating(false); setFormName(""); } }
    );
  };

  const handleSaveEdit = () => {
    if (!editingLabel || !formName.trim()) return;
    updateLabel.mutate(
      { labelId: editingLabel.id, labelData: { name: formName.trim(), color: formColor } },
      { onSuccess: () => { setEditingLabel(null); setFormName(""); } }
    );
  };

  const handleDelete = (labelId: string) => {
    if (confirm("Tem certeza que deseja excluir esta etiqueta?")) {
      deleteLabel.mutate(labelId);
    }
  };

  const startEdit = (label: TrelloLabel) => {
    setEditingLabel(label);
    setFormName(label.name);
    setFormColor(label.color || "green");
    setCreating(false);
  };

  const startCreate = () => {
    setCreating(true);
    setEditingLabel(null);
    setFormName("");
    setFormColor("green");
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingLabel(null);
    setFormName("");
  };

  const showForm = creating || editingLabel;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Tag className="h-3.5 w-3.5" /> Etiquetas
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Etiquetas</h4>
            {showForm && (
              <button onClick={cancelForm} className="p-0.5 hover:bg-gray-100 rounded">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {!showForm && (
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar etiquetas..."
              className="h-8 text-xs"
            />
          )}
        </div>

        {!showForm ? (
          <>
            <div className="max-h-[280px] overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Nenhuma etiqueta encontrada</p>
              ) : (
                filtered.map((label) => {
                  const isActive = cardLabelIds.includes(label.id);
                  return (
                    <div key={label.id} className="flex items-center gap-1.5 group">
                      {cardId && (
                        <Checkbox
                          checked={isActive}
                          onCheckedChange={() => handleToggle(label)}
                          className="flex-shrink-0"
                          disabled={toggleCardLabel.isPending}
                        />
                      )}
                      <button
                        onClick={() => cardId && handleToggle(label)}
                        className={`flex-1 h-8 rounded px-2.5 text-left text-xs font-medium text-white truncate ${trelloColorToTw(label.color)} hover:opacity-90 transition-opacity`}
                        title={`Cor: ${label.color || "sem cor"}, título: "${label.name}"`}
                      >
                        {label.name || "(sem nome)"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(label); }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                      >
                        <Pencil className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t space-y-1">
              <Button onClick={startCreate} variant="ghost" size="sm" className="w-full text-xs justify-center">
                Criar uma nova etiqueta
              </Button>
            </div>
          </>
        ) : (
          <div className="p-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nome</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome da etiqueta..."
                className="h-8 text-xs"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Cor</label>
              <div className="grid grid-cols-5 gap-1.5">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={`h-7 rounded ${TRELLO_COLOR_MAP[c] || "bg-gray-400"} ${formColor === c ? "ring-2 ring-offset-1 ring-blue-500" : ""} hover:opacity-80 transition-all`}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={editingLabel ? handleSaveEdit : handleSaveNew}
                disabled={createLabel.isPending || updateLabel.isPending}
              >
                {(createLabel.isPending || updateLabel.isPending) && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {editingLabel ? "Salvar" : "Criar"}
              </Button>
              {editingLabel && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                  onClick={() => handleDelete(editingLabel.id)}
                  disabled={deleteLabel.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default LabelManager;
