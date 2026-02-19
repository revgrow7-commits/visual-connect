import React, { useState, useCallback, useEffect } from "react";
import { initialPcpColumns, PCPCard as PCPCardType, PCPColumn } from "./pcpMockData";
import { useKanbanHoldprintJobs } from "./useKanbanHoldprint";
import { useTrelloBoardData, trelloColorToTw, type TrelloCard, type TrelloList } from "./useTrelloData";
import TrelloBoardSelector from "./TrelloBoardSelector";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  MessageSquare, Paperclip, Eye, Lock, AlignLeft, Clock, CheckCircle2,
  MoreHorizontal, Plus, ClipboardList, X, RefreshCw, Wifi, WifiOff, Loader2,
  Search, LayoutGrid, Trello,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PCPCardDetailDialog from "./PCPCardDetailDialog";

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
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-1.5 cursor-pointer transition-all ${
          snapshot.isDragging ? "shadow-xl ring-2 ring-blue-400 rotate-1 scale-[1.02]" : "hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        {card.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {card.tags.map((tag, i) => (
              <span
                key={i}
                className={`rounded-sm text-[10px] font-medium text-white px-2 py-0.5 ${tag.color} ${!tag.label ? "w-10 h-2" : ""}`}
                title={tag.label}
              >
                {tag.label || ""}
              </span>
            ))}
          </div>
        )}
        <p className="text-[13px] font-medium text-gray-800 leading-tight line-clamp-2">{card.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap text-gray-400 text-[11px]">
          {card.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          {card.overdue && (
            <span className="flex items-center gap-0.5 bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">
              <Clock className="h-3 w-3" />{card.date}
            </span>
          )}
          {!card.overdue && card.date && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />{card.date}
            </span>
          )}
          {card.hasList && <AlignLeft className="h-3.5 w-3.5" />}
          {(card.comments ?? 0) > 0 && (
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{card.comments}</span>
          )}
          {(card.attachments ?? 0) > 0 && (
            <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{card.attachments}</span>
          )}
          {card.hasWatcher && <Eye className="h-3.5 w-3.5" />}
          {card.hasLock && <Lock className="h-3.5 w-3.5" />}
        </div>
      </div>
    )}
  </Draggable>
);

// ─── Add Card Form ───
const AddCardForm: React.FC<{ onAdd: (title: string) => void; onCancel: () => void }> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        placeholder="Insira um título para este cartão..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-[56px] text-sm resize-none bg-white"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (title.trim()) onAdd(title.trim()); }
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => { if (title.trim()) onAdd(title.trim()); }}>Adicionar cartão</Button>
        <button onClick={onCancel} className="p-1 hover:bg-gray-300 rounded"><X className="h-5 w-5 text-gray-500" /></button>
      </div>
    </div>
  );
};

// ─── Loading Skeleton ───
const KanbanSkeleton = () => (
  <div className="flex gap-3 h-full">
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

// ─── Transform Trello data to Kanban columns ───
function trelloBoardToColumns(lists: TrelloList[], cards: TrelloCard[]): PCPColumn[] {
  return lists.map((list) => {
    const listCards = cards.filter((c) => c.idList === list.id);
    const mapped: PCPCardType[] = listCards.map((c) => {
      const dueDate = c.due ? new Date(c.due) : null;
      const isOverdue = dueDate ? dueDate < new Date() && !c.dueComplete : false;
      return {
        id: `trello-${c.id}`,
        title: c.name,
        description: c.desc || undefined,
        tags: c.labels.map((l) => ({ color: trelloColorToTw(l.color), label: l.name })),
        date: dueDate
          ? `${dueDate.getDate()} de ${["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."][dueDate.getMonth()]}`
          : undefined,
        overdue: isOverdue,
        done: c.dueComplete,
        comments: c.badges.comments,
        attachments: c.badges.attachments,
        hasList: c.badges.checkItems > 0,
        hasWatcher: false,
        _trelloCardId: c.id,
        _trelloLabelIds: c.labels.map((l) => l.id),
      } as PCPCardType & { _trelloCardId?: string; _trelloLabelIds?: string[] };
    });

    return {
      id: `trello-list-${list.id}`,
      title: list.name,
      subSections: [
        { id: `trello-sub-${list.id}`, label: "", color: "", cards: mapped },
      ],
    };
  });
}

// ─── Main Board ───
const PCPKanbanBoard: React.FC = () => {
  const [dataSource, setDataSource] = useState<"holdprint" | "trello">("holdprint");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Holdprint data
  const { data: holdprintData, isLoading: hpLoading, isError: hpError, refetch: hpRefetch, isFetching: hpFetching } = useKanbanHoldprintJobs();

  // Trello data
  const { data: trelloData, isLoading: trLoading, isError: trError, refetch: trRefetch, isFetching: trFetching } = useTrelloBoardData(
    dataSource === "trello" ? selectedBoardId : null
  );

  const [columns, setColumns] = useState<PCPColumn[]>(initialPcpColumns);
  const [selectedCard, setSelectedCard] = useState<PCPCardType | null>(null);
  const [selectedCardMeta, setSelectedCardMeta] = useState<{ columnTitle: string; subSectionLabel: string }>({ columnTitle: "", subSectionLabel: "" });
  const [addingCardAt, setAddingCardAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync data into columns based on source
  useEffect(() => {
    if (dataSource === "holdprint" && holdprintData?.columns) {
      setColumns(holdprintData.columns);
    }
  }, [holdprintData, dataSource]);

  useEffect(() => {
    if (dataSource === "trello" && trelloData) {
      setColumns(trelloBoardToColumns(trelloData.lists, trelloData.cards));
    }
  }, [trelloData, dataSource]);

  const isLoading = dataSource === "holdprint" ? hpLoading : trLoading;
  const isError = dataSource === "holdprint" ? hpError : trError;
  const isFetching = dataSource === "holdprint" ? hpFetching : trFetching;
  const refetch = dataSource === "holdprint" ? hpRefetch : trRefetch;

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setColumns(prev => {
      const next = prev.map(col => ({
        ...col,
        subSections: col.subSections.map(sub => ({ ...sub, cards: [...sub.cards] })),
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

  // Filter cards by search
  const filteredColumns = searchQuery.trim()
    ? columns.map(col => ({
        ...col,
        subSections: col.subSections.map(sub => ({
          ...sub,
          cards: sub.cards.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())),
        })),
      }))
    : columns;

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#026AA7] rounded-t-xl flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-white/80" />
          <h1 className="text-white font-bold text-lg tracking-tight">PCP — Industria Visual</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source toggle */}
          <div className="flex items-center bg-white/10 rounded-md overflow-hidden">
            <button
              onClick={() => setDataSource("holdprint")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                dataSource === "holdprint" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <Wifi className="h-3 w-3" /> Holdprint
            </button>
            <button
              onClick={() => setDataSource("trello")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                dataSource === "trello" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <LayoutGrid className="h-3 w-3" /> Trello
            </button>
          </div>

          {/* Trello board selector */}
          {dataSource === "trello" && (
            <TrelloBoardSelector
              selectedBoardId={selectedBoardId}
              onSelectBoard={setSelectedBoardId}
            />
          )}

          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar job..."
              className="h-7 w-40 pl-7 text-xs bg-white/15 border-white/20 text-white placeholder:text-white/40 focus:bg-white/25"
            />
          </div>

          <Badge className={`border-0 text-[10px] h-5 ${isError ? "bg-red-500/30 text-red-200" : "bg-white/20 text-white"}`}>
            {isError ? <><WifiOff className="h-3 w-3 mr-1" />Offline</> : <>{totalCards} cards</>}
          </Badge>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 h-7 px-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto bg-[#0079BF] p-3">
          {isLoading ? (
            <KanbanSkeleton />
          ) : dataSource === "trello" && !selectedBoardId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/70 space-y-2">
                <LayoutGrid className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-lg font-medium">Selecione um board do Trello</p>
                <p className="text-sm text-white/50">Use o seletor acima para escolher o board que deseja visualizar</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 h-full min-h-[calc(100vh-280px)]">
              {filteredColumns.map((col) => {
                const colTotal = col.subSections.reduce((s, sub) => s + sub.cards.length, 0);
                return (
                  <div key={col.id} className="min-w-[272px] max-w-[272px] flex flex-col bg-[#EBECF0] rounded-xl">
                    {/* Column header */}
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                      <h2 className="text-[12px] font-bold text-gray-700 uppercase leading-tight flex-1 tracking-wide">
                        {col.title}
                        <span className="ml-1 text-[10px] font-normal text-gray-400">({colTotal})</span>
                      </h2>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-300 rounded"><MoreHorizontal className="h-4 w-4 text-gray-500" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setAddingCardAt(getLastSubId(col))}>
                            <Plus className="h-4 w-4 mr-2" /> Adicionar cartão
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Cards area */}
                    <ScrollArea className="flex-1 px-2 pb-2">
                      <div className="space-y-1.5 py-1">
                        {col.subSections.map((section) => (
                          <div key={section.id} className="space-y-1.5">
                            {section.label && (
                              <div className={`rounded-md px-2.5 py-1.5 font-bold text-[11px] uppercase tracking-wider ${section.color} ${section.textColor || "text-white"}`}>
                                {section.label}
                                <span className="ml-1 font-normal opacity-70">({section.cards.length})</span>
                              </div>
                            )}
                            <Droppable droppableId={section.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`space-y-1.5 min-h-[4px] rounded-md transition-colors ${
                                    snapshot.isDraggingOver ? "bg-blue-100/60 ring-1 ring-blue-300/50" : ""
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
                    <div className="px-2 py-1.5 border-t border-gray-300/50">
                      {addingCardAt !== getLastSubId(col) && (
                        <button
                          onClick={() => setAddingCardAt(getLastSubId(col))}
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-[12px] w-full hover:bg-gray-200 rounded px-1.5 py-1 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adicionar cartão</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Bottom nav */}
      <div className="flex items-center justify-between py-2 px-4 bg-[#EBECF0] rounded-b-xl border-t">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
            {dataSource === "holdprint" ? (
              <><Wifi className="h-4 w-4 text-blue-500" /> Holdprint</>
            ) : (
              <><LayoutGrid className="h-4 w-4 text-blue-500" /> Trello</>
            )}
          </span>
        </div>
        <div className="text-[11px] text-gray-400">
          {totalCards} cartões
        </div>
      </div>

      {/* Card Detail Dialog */}
      <PCPCardDetailDialog
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(o) => { if (!o) setSelectedCard(null); }}
        onUpdate={handleUpdateCard}
        columnTitle={selectedCardMeta.columnTitle}
        subSectionLabel={selectedCardMeta.subSectionLabel}
        boardId={dataSource === "trello" ? selectedBoardId : null}
      />
    </div>
  );
};

export default PCPKanbanBoard;
