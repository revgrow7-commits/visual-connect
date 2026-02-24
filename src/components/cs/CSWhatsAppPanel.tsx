import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Send, RefreshCw, Search, Phone, Copy, User,
  MessageSquare, Loader2, CheckCheck, Check, Clock, X,
  ArrowLeft, Building2
} from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { customersService } from "@/services/holdprint/customers";
import { setHoldprintUnidade } from "@/services/holdprint/api";
import type { HoldprintCustomer } from "@/services/holdprint/types";
import { useIsMobile } from "@/hooks/use-mobile";

// Helper to extract best phone from Holdprint customer
const extractCustomerPhone = (customer: HoldprintCustomer): string | null => {
  // Check contacts for phone numbers first
  if (customer.contacts?.length) {
    for (const contact of customer.contacts) {
      if (contact.phoneNumber) {
        const clean = contact.phoneNumber.replace(/\D/g, "");
        if (clean.length >= 10) return clean.length <= 11 ? `55${clean}` : clean;
      }
    }
  }
  // Fallback to mainPhoneNumber
  if (customer.mainPhoneNumber) {
    const clean = customer.mainPhoneNumber.replace(/\D/g, "");
    if (clean.length >= 10) return clean.length <= 11 ? `55${clean}` : clean;
  }
  return null;
};

// --- Types ---
interface WhatsAppLog {
  id: string;
  created_at: string | null;
  customer_id: number | null;
  customer_name: string | null;
  phone: string;
  direction: string;
  message: string;
  origin: string | null;
  origin_id: string | null;
  status: string | null;
  evolution_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  sent_by: string | null;
  unidade: string | null;
}

interface Conversation {
  phone: string;
  customer_id: number | null;
  customer_name: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastDirection: string;
  origin: string | null;
  unreadCount: number;
}

// --- Helpers ---
const originColors: Record<string, string> = {
  regua: "🟢",
  ticket: "🔴",
  oportunidade: "🟡",
  manual: "⚪",
};

const formatPhone = (p: string) => {
  const clean = p.replace(/\D/g, "");
  if (clean.length === 13) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
  if (clean.length === 12) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
  return p;
};

const getInitials = (name: string | null) => {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
};

const formatDateLabel = (d: Date) => {
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yyyy");
};

const StatusIcon: React.FC<{ status: string | null }> = ({ status }) => {
  switch (status) {
    case "pending": return <Clock className="h-3 w-3 text-muted-foreground" />;
    case "sent": return <Check className="h-3 w-3 text-muted-foreground" />;
    case "delivered": return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "read": return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case "failed": return <X className="h-3 w-3 text-red-500" />;
    default: return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
};

const originTag = (origin: string | null, originId: string | null) => {
  if (!origin || origin === "manual") return <span className="text-[9px] text-muted-foreground/60">manual</span>;
  const label = origin === "regua" ? "régua" : origin === "ticket" ? `ticket ${originId ? `#${originId.slice(0,8)}` : ""}` : origin;
  return <span className="text-[9px] text-muted-foreground/60">{label}</span>;
};

// --- Main Component ---
const CSWhatsAppPanel: React.FC = () => {
  const isMobile = useIsMobile();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "clients" | "leads">("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  // === Fetch Holdprint customers (both units) ===
  const { data: holdprintCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["holdprint-customers-whatsapp"],
    queryFn: async () => {
      const allCustomers: HoldprintCustomer[] = [];
      for (const unit of ["poa", "sp"] as const) {
        try {
          setHoldprintUnidade(unit);
          const result = await customersService.list({ skip: 0, take: 200 });
          allCustomers.push(...result.data);
        } catch (e) {
          console.warn(`Holdprint ${unit} customers fetch failed:`, e);
        }
      }
      return allCustomers;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // === Fetch all logs for conversation list ===
  const { data: allLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ["whatsapp-logs-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as WhatsAppLog[];
    },
    refetchInterval: 15000,
  });

  // === Build conversation list (merging Holdprint customers) ===
  const conversations: Conversation[] = React.useMemo(() => {
    const map = new Map<string, Conversation>();

    // 1. Build from existing logs
    if (allLogs) {
      for (const log of allLogs) {
        const existing = map.get(log.phone);
        if (!existing) {
          map.set(log.phone, {
            phone: log.phone,
            customer_id: log.customer_id,
            customer_name: log.customer_name,
            lastMessage: log.message,
            lastMessageAt: log.created_at || "",
            lastDirection: log.direction,
            origin: log.origin,
            unreadCount: log.direction === "inbound" && !log.read_at ? 1 : 0,
          });
        } else {
          if (!existing.customer_name && log.customer_name) existing.customer_name = log.customer_name;
          if (!existing.customer_id && log.customer_id) existing.customer_id = log.customer_id;
          if (log.direction === "inbound" && !log.read_at) existing.unreadCount++;
        }
      }
    }

    // 2. When "clients" filter active, merge Holdprint customers with phone
    if (filter === "clients" && holdprintCustomers) {
      for (const customer of holdprintCustomers) {
        const phone = extractCustomerPhone(customer);
        if (!phone) continue;
        if (!map.has(phone)) {
          map.set(phone, {
            phone,
            customer_id: customer.id ? Number(customer.id) || null : null,
            customer_name: customer.name || customer.fullName || null,
            lastMessage: "",
            lastMessageAt: "",
            lastDirection: "",
            origin: null,
            unreadCount: 0,
          });
        } else {
          // Enrich existing conversation with customer name
          const existing = map.get(phone)!;
          if (!existing.customer_name) existing.customer_name = customer.name || customer.fullName || null;
          if (!existing.customer_id && customer.id) existing.customer_id = Number(customer.id) || null;
        }
      }
    }

    let list = Array.from(map.values());

    // Filters
    if (filter === "unread") list = list.filter(c => c.unreadCount > 0);
    if (filter === "clients") list = list.filter(c => c.customer_id != null || c.customer_name != null);
    if (filter === "leads") list = list.filter(c => c.customer_id == null);

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.customer_name?.toLowerCase().includes(s) ||
        c.phone.includes(s)
      );
    }

    // Sort: conversations with messages first, then alphabetically
    return list.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return (a.customer_name || a.phone).localeCompare(b.customer_name || b.phone);
    });
  }, [allLogs, filter, search, holdprintCustomers]);

  const selectedConvo = conversations.find(c => c.phone === selectedPhone);

  // === Chat messages for selected phone ===
  const { data: chatMessages, isLoading: loadingChat } = useQuery({
    queryKey: ["whatsapp-chat", selectedPhone],
    queryFn: async () => {
      if (!selectedPhone) return [];
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("phone", selectedPhone)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as WhatsAppLog[];
    },
    enabled: !!selectedPhone,
    refetchInterval: 8000,
  });

  // === Mark as read when opening conversation ===
  useEffect(() => {
    if (!selectedPhone || !chatMessages) return;
    const unreadIds = chatMessages
      .filter(m => m.direction === "inbound" && !m.read_at)
      .map(m => m.id);
    if (unreadIds.length === 0) return;

    supabase
      .from("whatsapp_logs")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["whatsapp-logs-all"] });
      });
  }, [selectedPhone, chatMessages, qc]);

  // === Send message ===
  const [msgText, setMsgText] = useState("");
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPhone || !msgText.trim()) throw new Error("Missing data");
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          phone: selectedPhone,
          message: msgText.trim(),
          origin: "manual",
          client_id: selectedConvo?.customer_id,
          client_name: selectedConvo?.customer_name,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setMsgText("");
      qc.invalidateQueries({ queryKey: ["whatsapp-chat", selectedPhone] });
      qc.invalidateQueries({ queryKey: ["whatsapp-logs-all"] });
      toast.success("Mensagem enviada!");
    },
    onError: () => toast.error("Falha ao enviar mensagem"),
  });

  // === Auto-scroll ===
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // === Keyboard shortcut ===
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey && msgText.trim()) {
      e.preventDefault();
      sendMutation.mutate();
    }
  };

  const showChat = isMobile ? !!selectedPhone : true;
  const showList = isMobile ? !selectedPhone : true;

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height)-10rem)] border rounded-lg overflow-hidden bg-card">
      {/* === Conversation List === */}
      {showList && (
        <div className={`${isMobile ? "w-full" : "w-[35%]"} border-r flex flex-col`}>
          {/* Search & Filters */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="Buscar nome ou número..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {(["all", "unread", "clients", "leads"] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "ghost"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Todas" : f === "unread" ? "Não lidas" : f === "clients" ? "Clientes" : "Leads"}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {(loadingLogs || (filter === "clients" && loadingCustomers)) ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhuma conversa encontrada</p>
            ) : (
              conversations.map(c => (
                <button
                  key={c.phone}
                  onClick={() => setSelectedPhone(c.phone)}
                  className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedPhone === c.phone ? "bg-muted" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(c.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate">
                        {c.customer_name || formatPhone(c.phone)}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {c.lastMessageAt ? format(new Date(c.lastMessageAt), "HH:mm") : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {c.lastMessage ? (
                          <>
                            {c.lastDirection === "outbound" && <Check className="h-3 w-3 inline mr-0.5" />}
                            {c.lastMessage.slice(0, 45)}{c.lastMessage.length > 45 ? "..." : ""}
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground/60">
                            <Building2 className="h-3 w-3" /> Holdprint • {formatPhone(c.phone)}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {c.lastMessage && <span className="text-[10px]">{originColors[c.origin || "manual"] || "⚪"}</span>}
                        {c.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-[9px] h-4 min-w-4 p-0 flex items-center justify-center rounded-full">
                            {c.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* === Chat Area === */}
      {showChat && (
        <div className={`${isMobile ? "w-full" : "w-[65%]"} flex flex-col`}>
          {selectedPhone && selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-card flex-shrink-0">
                {isMobile && (
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedPhone(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(selectedConvo.customer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {selectedConvo.customer_name || formatPhone(selectedConvo.phone)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">{formatPhone(selectedConvo.phone)}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedConvo.phone);
                              toast.success("Telefone copiado!");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar telefone</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {selectedConvo.customer_id ? "Cliente" : "Lead"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 border-green-500/30">
                    Ativa
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
                {loadingChat ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className="h-12 w-48 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : chatMessages && chatMessages.length > 0 ? (
                  <>
                    {chatMessages.map((msg, idx) => {
                      const msgDate = msg.created_at ? new Date(msg.created_at) : new Date();
                      const prevDate = idx > 0 && chatMessages[idx - 1].created_at ? new Date(chatMessages[idx - 1].created_at!) : null;
                      const showDateSep = idx === 0 || (prevDate && !isSameDay(msgDate, prevDate));
                      const isOutbound = msg.direction === "outbound";

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateSep && (
                            <div className="flex justify-center py-2">
                              <span className="text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground font-medium">
                                {formatDateLabel(msgDate)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-1`}>
                            <div
                              className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
                                isOutbound
                                  ? "bg-[#DCF8C6] text-foreground rounded-tr-none"
                                  : "bg-card border text-foreground rounded-tl-none"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                                {originTag(msg.origin, msg.origin_id)}
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.created_at ? format(new Date(msg.created_at), "HH:mm") : ""}
                                </span>
                                {isOutbound && <StatusIcon status={msg.status} />}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <MessageSquare className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Nenhuma mensagem ainda. Envie a primeira!</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Send Bar */}
              <div className="border-t p-3 bg-card flex-shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Mensagem..."
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[40px] max-h-[120px] resize-none pr-12 text-sm"
                      rows={1}
                    />
                    <span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">
                      {msgText.length}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    disabled={!msgText.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate()}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Ctrl+Enter para enviar</p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-medium">Selecione uma conversa para começar</p>
              <p className="text-xs">Escolha um contato na lista à esquerda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CSWhatsAppPanel;
