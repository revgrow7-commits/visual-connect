import React from "react";
import { pcpColumns, PCPCard as PCPCardType, PCPSubSection } from "./pcpMockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Paperclip, Eye, Lock, AlignLeft, Clock, CheckCircle2, MoreHorizontal, Plus, ClipboardList } from "lucide-react";

const PCPCardComponent: React.FC<{ card: PCPCardType }> = ({ card }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 space-y-2 hover:shadow-md transition-shadow cursor-pointer">
    {/* Tags */}
    {card.tags.length > 0 && (
      <div className="flex gap-1 flex-wrap">
        {card.tags.map((tag, i) => (
          <span key={i} className={`h-2 w-10 rounded-full ${tag.color}`} />
        ))}
      </div>
    )}

    {/* Title */}
    <p className="text-[13px] font-medium text-gray-800 leading-tight">{card.title}</p>

    {/* Meta row */}
    <div className="flex items-center gap-2 flex-wrap text-gray-500">
      {card.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      {card.overdue && (
        <span className="flex items-center gap-0.5 text-[11px] bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">
          <Clock className="h-3 w-3" />
          {card.date}
        </span>
      )}
      {!card.overdue && card.date && (
        <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
          <Clock className="h-3 w-3" />
          {card.date}
        </span>
      )}
      {card.hasList && <AlignLeft className="h-3.5 w-3.5" />}
      {card.comments !== undefined && card.comments > 0 && (
        <span className="flex items-center gap-0.5 text-[11px]">
          <MessageSquare className="h-3 w-3" />
          {card.comments}
        </span>
      )}
      {card.attachments !== undefined && card.attachments > 0 && (
        <span className="flex items-center gap-0.5 text-[11px]">
          <Paperclip className="h-3 w-3" />
          {card.attachments}
        </span>
      )}
      {card.hasWatcher && <Eye className="h-3.5 w-3.5" />}
      {card.hasLock && <Lock className="h-3.5 w-3.5" />}
    </div>
  </div>
);

const SubSectionBlock: React.FC<{ section: PCPSubSection }> = ({ section }) => (
  <div className="space-y-1.5">
    {section.label && (
      <div className={`rounded-md px-3 py-2 font-bold text-sm uppercase ${section.color} ${section.textColor || "text-white"}`}>
        {section.label}
      </div>
    )}
    <div className="space-y-2">
      {section.cards.map((card) => (
        <PCPCardComponent key={card.id} card={card} />
      ))}
    </div>
  </div>
);

const PCPKanbanBoard: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#026AA7] rounded-t-xl">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-white/80" />
          <h1 className="text-white font-bold text-lg">PCP - Industria Visual</h1>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto bg-[#0079BF] p-3 rounded-b-xl">
        <div className="flex gap-3 h-full min-h-[calc(100vh-280px)]">
          {pcpColumns.map((col) => {
            const totalCards = col.subSections.reduce((sum, s) => sum + s.cards.length, 0);
            return (
              <div key={col.id} className="min-w-[272px] max-w-[272px] flex flex-col bg-[#EBECF0] rounded-xl">
                {/* Column header */}
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <h2 className="text-[13px] font-bold text-gray-700 uppercase leading-tight flex-1">
                    {col.title}
                  </h2>
                  <button className="p-1 hover:bg-gray-300 rounded">
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                {/* Cards area */}
                <ScrollArea className="flex-1 px-2 pb-2">
                  <div className="space-y-2 py-1">
                    {col.subSections.map((section, idx) => (
                      <SubSectionBlock key={idx} section={section} />
                    ))}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-gray-300/50">
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm w-full">
                    <Plus className="h-4 w-4" />
                    <span>Adicionar um cartão</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
    </div>
  );
};

export default PCPKanbanBoard;
