import React, { useState, useCallback, useEffect } from "react";
import { initialPcpColumns, PCPCard as PCPCardType, PCPColumn } from "./pcpMockData";
import { useKanbanHoldprintJobs } from "./useKanbanHoldprint";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  MessageSquare, Paperclip, Eye, Lock, AlignLeft, Clock, CheckCircle2,
  MoreHorizontal, Plus, ClipboardList, X, Calendar, Tag, User, FileText,
  RefreshCw, Wifi, WifiOff, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Card Component ───
const PCPCardComponent: React.FC<{
  card: PCPCardType;
  index: number;
  onClick: () => void;
}> = ({ card, index, onClick }) => (
  <Draggable draggableId={card.id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onClick={onClick}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-2 cursor-pointer transition-shadow ${
          snapshot.isDragging ? "shadow-lg ring-2 ring-blue-400 rotate-2" : "hover:shadow-md"
        }`}
      >
        {card.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {card.tags.map((tag, i) => (
              <span key={i} className={`h-2 w-10 rounded-full ${tag.color}`} />
            ))}
          </div>
        )}
        <p className="text-[13px] font-medium text-gray-800 leading-tight">{card.title}</p>
        <div className="flex items-center gap-2 flex-wrap text-gray-500">
          {card.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          {card.overdue && (
            <span className="flex items-center gap-0.5 text-[11px] bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">
              <Clock className="h-3 w-3" />{card.date}
            </span>
          )}
          {!card.overdue && card.date && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
              <Clock className="h-3 w-3" />{card.date}
            </span>
          )}
          {card.hasList && <AlignLeft className="h-3.5 w-3.5" />}
          {card.comments != null && card.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[11px]">
              <MessageSquare className="h-3 w-3" />{card.comments}
            </span>
          )}
          {card.attachments != null && card.attachments > 0 && (
            <span className="flex items-center gap-0.5 text-[11px]">
              <Paperclip className="h-3 w-3" />{card.attachments}
            </span>
          )}
          {card.hasWatcher && <Eye className="h-3.5 w-3.5" />}
          {card.hasLock && <Lock className="h-3.5 w-3.5" />}
        </div>
      </div>
    )}
  </Draggable>
);

// ─── Add Card Form ───
const AddCardForm: React.FC<{
  onAdd: (title: string) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        placeholder="Insira um título para este cartão..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-[60px] text-sm resize-none bg-white"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (title.trim()) onAdd(title.trim()); }
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => { if (title.trim()) onAdd(title.trim()); }}>
          Adicionar cartão
        </Button>
        <button onClick={onCancel} className="p-1 hover:bg-gray-300 rounded">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

// ─── Card Detail Dialog ───
const CardDetailDialog: React.FC<{
  card: PCPCardType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (card: PCPCardType) => void;
  columnTitle?: string;
  subSectionLabel?: string;
}> = ({ card, open, onOpenChange, onUpdate, columnTitle, subSectionLabel }) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  React.useEffect(() => {
    if (card) {
      setEditTitle(card.title);
      setEditDesc(card.description || "");
      setEditing(false);
    }
  }, [card]);

  if (!card) return null;

  const isHoldprint = card.id.startsWith("hp-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              {editing && !isHoldprint ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-bold text-lg"
                  onBlur={() => {
                    if (editTitle.trim()) onUpdate({ ...card, title: editTitle.trim(), description: editDesc });
                    setEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (editTitle.trim()) onUpdate({ ...card, title: editTitle.trim(), description: editDesc });
                      setEditing(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className={`${!isHoldprint ? "cursor-pointer hover:bg-gray-100" : ""} px-1 rounded`}
                  onClick={() => !isHoldprint && setEditing(true)}
                >
                  {card.title}
                </DialogTitle>
              )}
              <p className="text-xs text-gray-500 mt-1">
                na lista <span className="font-semibold">{subSectionLabel || "—"}</span>
                {columnTitle && <> · {columnTitle}</>}
              </p>
              {isHoldprint && (
                <Badge className="mt-1 bg-blue-100 text-blue-700 text-[10px]">
                  <Wifi className="h-3 w-3 mr-1" /> Holdprint (real-time)
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Etiquetas
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {card.tags.map((tag, i) => (
                <Badge key={i} className={`${tag.color} text-white text-[11px] px-2`}>
                  {tag.label || "Tag"}
                </Badge>
              ))}
            </div>
          </div>

          {card.date && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Data de entrega
              </p>
              <span className={`text-sm ${card.overdue ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                {card.date} {card.overdue && "⚠️ Atrasado"}{card.done && " ✅ Concluído"}
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
              <AlignLeft className="h-3.5 w-3.5" /> Descrição
            </p>
            {editing && !isHoldprint ? (
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="text-sm min-h-[80px]"
                placeholder="Adicionar uma descrição..."
              />
            ) : (
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded px-3 py-2 min-h-[40px]">
                {card.description || "Sem descrição"}
              </pre>
            )}
          </div>

          {/* Activity */}
          {!isHoldprint && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Atividade
              </p>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  <User className="h-4 w-4" />
                </div>
                <Input placeholder="Escreva um comentário..." className="text-sm" />
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex gap-4 text-xs text-gray-400 pt-2 border-t">
            {card.attachments != null && card.attachments > 0 && (
              <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{card.attachments} anexo(s)</span>
            )}
            {card.hasWatcher && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />Observando</span>}
            {card.responsible && <span className="flex items-center gap-1"><User className="h-3 w-3" />{card.responsible}</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Loading Skeleton ───
const KanbanSkeleton = () => (
  <div className="flex gap-3 h-full min-h-[calc(100vh-280px)]">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="min-w-[272px] max-w-[272px] bg-[#EBECF0] rounded-xl p-3 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

// ─── Main Board ───
const PCPKanbanBoard: React.FC = () => {
  const { data: holdprintData, isLoading, isError, refetch, isFetching } = useKanbanHoldprintJobs();
  const [columns, setColumns] = useState<PCPColumn[]>(initialPcpColumns);
  const [selectedCard, setSelectedCard] = useState<PCPCardType | null>(null);
  const [selectedCardMeta, setSelectedCardMeta] = useState<{ columnTitle: string; subSectionLabel: string }>({ columnTitle: "", subSectionLabel: "" });
  const [addingCardAt, setAddingCardAt] = useState<string | null>(null);

  // Sync holdprint data into columns
  useEffect(() => {
    if (holdprintData?.columns) {
      setColumns(holdprintData.columns);
    }
  }, [holdprintData]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setColumns(prev => {
      const next = prev.map(col => ({
        ...col,
        subSections: col.subSections.map(sub => ({
          ...sub,
          cards: [...sub.cards],
        })),
      }));

      let srcSub: typeof next[0]["subSections"][0] | null = null;
      let dstSub: typeof next[0]["subSections"][0] | null = null;
      for (const col of next) {
        for (const sub of col.subSections) {
          if (sub.id === source.droppableId) srcSub = sub;
          if (sub.id === destination.droppableId) dstSub = sub;
        }
      }
      if (!srcSub || !dstSub) return prev;

      const [moved] = srcSub.cards.splice(source.index, 1);
      dstSub.cards.splice(destination.index, 0, moved);
      return next;
    });
  }, []);

  const handleAddCard = useCallback((subSectionId: string, title: string) => {
    setColumns(prev =>
      prev.map(col => ({
        ...col,
        subSections: col.subSections.map(sub => {
          if (sub.id !== subSectionId) return sub;
          return {
            ...sub,
            cards: [...sub.cards, {
              id: `manual-${Date.now()}`,
              title,
              tags: [{ color: "bg-purple-400", label: "Manual" }],
              hasWatcher: true,
            }],
          };
        }),
      }))
    );
    setAddingCardAt(null);
  }, []);

  const handleUpdateCard = useCallback((updated: PCPCardType) => {
    setColumns(prev =>
      prev.map(col => ({
        ...col,
        subSections: col.subSections.map(sub => ({
          ...sub,
          cards: sub.cards.map(c => (c.id === updated.id ? updated : c)),
        })),
      }))
    );
    setSelectedCard(updated);
  }, []);

  const getLastSubId = (col: PCPColumn) => col.subSections[col.subSections.length - 1]?.id;

  const totalCards = columns.reduce((s, c) => s + c.subSections.reduce((ss, sub) => ss + sub.cards.length, 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#026AA7] rounded-t-xl">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-white/80" />
          <h1 className="text-white font-bold text-lg">PCP - Industria Visual</h1>
        </div>
        <div className="flex items-center gap-3">
          {holdprintData?.fetchedAt && (
            <span className="text-white/60 text-xs hidden sm:inline">
              Sync: {new Date(holdprintData.fetchedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Badge className={`border-0 text-xs ${isError ? "bg-red-500/30 text-red-200" : "bg-white/20 text-white"}`}>
            {isError ? <><WifiOff className="h-3 w-3 mr-1" />Offline</> : <><Wifi className="h-3 w-3 mr-1" />{totalCards} jobs</>}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 h-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1 text-xs hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>

      {/* Columns with DnD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto bg-[#0079BF] p-3">
          {isLoading ? (
            <KanbanSkeleton />
          ) : (
            <div className="flex gap-3 h-full min-h-[calc(100vh-280px)]">
              {columns.map((col) => (
                <div key={col.id} className="min-w-[272px] max-w-[272px] flex flex-col bg-[#EBECF0] rounded-xl">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <h2 className="text-[13px] font-bold text-gray-700 uppercase leading-tight flex-1">
                      {col.title}
                    </h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-300 rounded">
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setAddingCardAt(getLastSubId(col))}>
                          <Plus className="h-4 w-4 mr-2" /> Adicionar cartão
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setColumns(prev => prev.map(c =>
                            c.id === col.id
                              ? { ...c, subSections: c.subSections.map(s => ({ ...s, cards: s.cards.filter(card => !card.id.startsWith("manual-")) })) }
                              : c
                          ));
                        }}>
                          <X className="h-4 w-4 mr-2" /> Limpar manuais
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Cards area */}
                  <ScrollArea className="flex-1 px-2 pb-2">
                    <div className="space-y-2 py-1">
                      {col.subSections.map((section) => (
                        <div key={section.id} className="space-y-1.5">
                          {section.label && (
                            <div className={`rounded-md px-3 py-2 font-bold text-sm uppercase ${section.color} ${section.textColor || "text-white"}`}>
                              {section.label}
                              <span className="ml-1.5 font-normal text-xs opacity-75">({section.cards.length})</span>
                            </div>
                          )}
                          <Droppable droppableId={section.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`space-y-2 min-h-[8px] rounded-md transition-colors ${
                                  snapshot.isDraggingOver ? "bg-blue-100/50" : ""
                                }`}
                              >
                                {section.cards.map((card, idx) => (
                                  <PCPCardComponent
                                    key={card.id}
                                    card={card}
                                    index={idx}
                                    onClick={() => {
                                      setSelectedCard(card);
                                      setSelectedCardMeta({ columnTitle: col.title, subSectionLabel: section.label });
                                    }}
                                  />
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {addingCardAt === section.id && (
                            <AddCardForm
                              onAdd={(title) => handleAddCard(section.id, title)}
                              onCancel={() => setAddingCardAt(null)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-gray-300/50">
                    {addingCardAt !== getLastSubId(col) && (
                      <button
                        onClick={() => setAddingCardAt(getLastSubId(col))}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm w-full hover:bg-gray-200 rounded px-1 py-1 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar um cartão</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Bottom nav */}
      <div className="flex items-center justify-center gap-6 py-2 bg-[#EBECF0] rounded-b-xl border-t">
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-200">
          <ClipboardList className="h-4 w-4" /> Caixa de entrada
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-200">
          <AlignLeft className="h-4 w-4" /> Planejador
        </button>
        <button className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded">
          <ClipboardList className="h-4 w-4" /> Quadro
        </button>
      </div>

      {/* Card Detail Dialog */}
      <CardDetailDialog
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(o) => { if (!o) setSelectedCard(null); }}
        onUpdate={handleUpdateCard}
        columnTitle={selectedCardMeta.columnTitle}
        subSectionLabel={selectedCardMeta.subSectionLabel}
      />
    </div>
  );
};

export default PCPKanbanBoard;
