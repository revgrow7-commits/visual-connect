import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/budget-agent`;

const SUGGESTIONS = [
  "Quais materiais aparecem nos orçamentos perdidos?",
  "Quais produtos são mais solicitados?",
  "Qual a taxa de conversão por vendedor?",
  "Compare as unidades POA e SP",
  "Quais clientes mais solicitam orçamentos?",
  "Qual a tendência mensal de conversão?",
];

interface Props {
  embedded?: boolean;
}

export default function BudgetAgentChat({ embedded = false }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    const resp = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, provider: "claude" }),
    });

    if (resp.status === 429) {
      toast({ title: "Limite de requisições", description: "Tente novamente em alguns minutos.", variant: "destructive" });
      throw new Error("Rate limited");
    }
    if (!resp.ok || !resp.body) throw new Error("Falha ao iniciar stream");

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
  }, []);

  const handleSend = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (e) {
      console.error("Budget agent error:", e);
      toast({ title: "Erro", description: "Não foi possível conectar ao agente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-card rounded-2xl border border-border shadow-lg overflow-hidden",
      embedded ? "h-[500px] w-full" : "fixed bottom-6 right-6 z-50 w-[420px] h-[600px] shadow-2xl"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">Agente de Orçamentos</h3>
          <p className="text-xs text-muted-foreground">Especialista em análise · Claude</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMessages([])} title="Limpar conversa">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-6">
            <Bot className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground text-center mb-1">
              Olá! Sou o especialista em <span className="font-semibold text-primary">orçamentos</span>.
            </p>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Analiso materiais, produtos, taxa de conversão e tendências.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
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
              {msg.role === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className={cn(
              "max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            )}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>table]:text-xs">
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
              <Bot className="h-4 w-4 text-muted-foreground" />
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
            placeholder="Pergunte sobre orçamentos..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
