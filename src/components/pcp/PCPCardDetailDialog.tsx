import React, { useState, useEffect } from "react";
import { PCPCard as PCPCardType } from "./pcpMockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import LabelManager from "./LabelManager";
import {
  MessageSquare, Paperclip, Eye, AlignLeft, Calendar, Tag, User, FileText, Wifi,
} from "lucide-react";

interface Props {
  card: PCPCardType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (card: PCPCardType) => void;
  columnTitle?: string;
  subSectionLabel?: string;
  boardId?: string | null;
}

const PCPCardDetailDialog: React.FC<Props> = ({ card, open, onOpenChange, onUpdate, columnTitle, subSectionLabel, boardId }) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (card) {
      setEditTitle(card.title);
      setEditDesc(card.description || "");
      setEditing(false);
    }
  }, [card]);

  if (!card) return null;

  const isHoldprint = card.id.startsWith("hp-");
  const isTrello = card.id.startsWith("trello-");
  const trelloCardId = isTrello ? card.id.replace("trello-", "") : null;
  const trelloLabelIds = (card as any)?._trelloLabelIds || [];

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
                na lista <span className="font-semibold">{subSectionLabel || columnTitle || "—"}</span>
                {columnTitle && subSectionLabel && <> · {columnTitle}</>}
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
          {/* Tags / Labels */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Etiquetas
              </p>
              {isTrello && boardId && (
                <LabelManager
                  boardId={boardId}
                  cardId={trelloCardId}
                  cardLabelIds={trelloLabelIds}
                />
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {card.tags.map((tag, i) => (
                <Badge key={i} className={`${tag.color} text-white text-[11px] px-2`}>
                  {tag.label || "Tag"}
                </Badge>
              ))}
              {card.tags.length === 0 && (
                <span className="text-xs text-gray-400">Sem etiquetas</span>
              )}
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
          {!isHoldprint && !isTrello && (
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
            {(card.attachments ?? 0) > 0 && (
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

export default PCPCardDetailDialog;
