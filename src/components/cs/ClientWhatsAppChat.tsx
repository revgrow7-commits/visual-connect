import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Send, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import type { WhatsAppLog } from "@/hooks/useWhatsAppLogs";

const statusIcon: Record<string, string> = {
  pending: "⏳",
  sent: "✓",
  delivered: "✓✓",
  read: "✓✓",
  failed: "❌",
};

const formatTime = (d: string | null) =>
  d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";

interface ClientWhatsAppChatProps {
  clientId: number | string;
  clientName: string;
  clientPhone: string;
}

const ClientWhatsAppChat: React.FC<ClientWhatsAppChatProps> = ({ clientId, clientName, clientPhone }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["whatsapp-logs-client", String(clientId)],
    queryFn: async () => {
      // Try matching by customer_id or customer_name
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .or(`customer_id.eq.${clientId},customer_name.ilike.%${clientName}%,phone.eq.${clientPhone}`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as WhatsAppLog[];
    },
    refetchInterval: 10000,
  });

  const unreadCount = (logs || []).filter(l => l.direction === "inbound" && l.status !== "read").length;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!clientPhone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          phone: clientPhone,
          message: message.trim(),
          origin: "manual",
          client_id: clientId,
          client_name: clientName,
        },
      });
      if (error) throw error;
      toast.success("Mensagem enviada!");
      setMessage("");
      await refetch();
    } catch {
      toast.error("Falha ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  let lastDate = "";

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b mb-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">{clientPhone || "Sem telefone"}</span>
          {unreadCount > 0 && (
            <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">{unreadCount} não lida{unreadCount > 1 ? "s" : ""}</Badge>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => refetch()} title="Atualizar histórico">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0" style={{ maxHeight: "320px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageCircle className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhuma conversa ainda.</p>
            <p className="text-xs">Envie a primeira mensagem!</p>
          </div>
        ) : (
          logs.map((log) => {
            const isOutbound = log.direction === "outbound";
            const msgDate = formatDate(log.created_at);
            let showDateDivider = false;
            if (msgDate !== lastDate) {
              showDateDivider = true;
              lastDate = msgDate;
            }

            return (
              <React.Fragment key={log.id}>
                {showDateDivider && (
                  <div className="flex justify-center py-2">
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{msgDate}</span>
                  </div>
                )}
                <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                      isOutbound
                        ? "bg-green-100 text-green-900 rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[13px]">{log.message}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-muted-foreground">{formatTime(log.created_at)}</span>
                      {isOutbound && (
                        <span className={`text-[10px] ${log.status === "read" ? "text-blue-600 font-bold" : "text-muted-foreground"}`}>
                          {statusIcon[log.status || "pending"]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Send field */}
      <div className="flex items-center gap-2 pt-3 border-t mt-3">
        <Input
          placeholder="Digite uma mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending || !clientPhone}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !message.trim() || !clientPhone}
          className="h-9 w-9 bg-green-600 hover:bg-green-700"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ClientWhatsAppChat;
