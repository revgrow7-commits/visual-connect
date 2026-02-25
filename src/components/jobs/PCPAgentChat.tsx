import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Bot, X, Send, Loader2, Minimize2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "🔴 Ver jobs atrasados", prompt: "Ver jobs atrasados" },
  { label: "⚠️ Analisar riscos de hoje", prompt: "Analisar riscos de hoje" },
  { label: "📊 Relatório de produção", prompt: "Relatório de produção semanal" },
  { label: "👥 Ver sobrecargas da equipe", prompt: "Quem está sobrecarregado hoje?" },
  { label: "🔍 Verificar gargalos", prompt: "Verificar gargalos de produção" },
  { label: "📬 Enviar alertas pendentes", prompt: "Enviar alertas para jobs atrasados" },
];

const PCPAgentChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("pcp-agent", {
        body: { messages: [...messages, userMsg] },
      });

      if (error) throw error;
      const reply = data?.reply || data?.error || "Sem resposta do agente.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ Erro ao consultar agente: ${err.message}`,
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#1a2332] hover:bg-[#2a3a4e] text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 group"
        title="Agente PCP"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-background border-2 border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a2332] text-white p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold text-sm">Agente PCP</span>
          <Badge className="text-[9px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">● Ativo</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded"><Minimize2 className="h-4 w-4" /></button>
          <button onClick={() => { setOpen(false); setMessages([]); }} className="p-1 hover:bg-white/10 rounded"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Olá! Sou o Agente PCP 🤖<br />Como posso ajudar com a produção?
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_ACTIONS.map(qa => (
                <button key={qa.prompt} onClick={() => sendMessage(qa.prompt)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border bg-muted/50 hover:bg-muted transition-colors text-foreground">
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_li]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions when there are messages */}
      {messages.length > 0 && (
        <div className="px-3 pb-1 flex gap-1 overflow-x-auto flex-shrink-0">
          {QUICK_ACTIONS.slice(0, 3).map(qa => (
            <button key={qa.prompt} onClick={() => sendMessage(qa.prompt)} disabled={isLoading}
              className="text-[10px] px-2 py-1 rounded-full border bg-muted/50 hover:bg-muted whitespace-nowrap flex-shrink-0">
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Pergunte sobre a produção..." className="flex-1 h-9 text-sm" disabled={isLoading} />
          <Button type="submit" size="sm" disabled={!input.trim() || isLoading} className="h-9 w-9 p-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PCPAgentChat;
