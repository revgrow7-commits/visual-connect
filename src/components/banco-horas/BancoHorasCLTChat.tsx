import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Trash2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import LLMModelSelector, { type LLMProvider } from "@/components/ai-agent/LLMModelSelector";

type Msg = { role: "user" | "assistant"; content: string };

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/banco-horas-agent`;

const SUGGESTIONS = [
  "Relatório de conformidade CCT com passivo detalhado",
  "Quais colaboradores estão com saldo vencido?",
  "Calcule o passivo total com encargos INSS e FGTS",
  "Liste os colaboradores críticos (>40h) por departamento",
  "Quais os prazos de vencimento pela regra de quinzena?",
];

const BancoHorasCLTChat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("gemini");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || anonKey;

    const resp = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ messages: allMessages, provider: llmProvider }),
    });

    if (!resp.ok) {
      let errorMsg = "Erro ao conectar ao agente.";
      try {
        const errBody = await resp.json();
        errorMsg = errBody.error || errorMsg;
      } catch {}
      toast({ title: "Erro do Agente", description: errorMsg, variant: "destructive" });
      throw new Error(errorMsg);
    }
    if (!resp.body) throw new Error("Sem corpo de resposta");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          const claudeContent = parsed.type === "content_block_delta" ? parsed.delta?.text : undefined;
          const token = content || claudeContent;
          if (token) {
            assistantSoFar += token;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content || (parsed.type === "content_block_delta" ? parsed.delta?.text : undefined);
          if (content) {
            assistantSoFar += content;
            setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
        } catch {}
      }
    }
  }, [llmProvider]);

  const sendingRef = useRef(false);

  const handleSend = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: Msg = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (e) {
      console.error("CLT Agent error:", e);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-card rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Scale className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Agente CLT/CCT — Banco de Horas</h3>
          <p className="text-xs text-muted-foreground">CCT EAA × SESCON-SP 2025/2026 · Cl. 41, 10, 7, 58</p>
        </div>
        <LLMModelSelector value={llmProvider} onChange={setLlmProvider} disabled={isLoading} />
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={() => setMessages([])} title="Limpar conversa">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Scale className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Especialista em <span className="font-semibold text-primary">conformidade CLT/CCT</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Acesso direto aos dados do banco de horas. Peça relatórios, cálculos de passivo, alertas de vencimento ou análises por departamento.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2.5 mb-4", msg.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              msg.role === "user" ? "bg-primary/10" : "bg-muted"
            )}>
              {msg.role === "user" ? <User className="h-4 w-4 text-primary" /> : <Scale className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className={cn(
              "max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            )}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2.5 mb-4">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="bg-muted px-3.5 py-2.5 rounded-xl rounded-tl-sm">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Peça um relatório, cálculo ou análise de conformidade..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BancoHorasCLTChat;
