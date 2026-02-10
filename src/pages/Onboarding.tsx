import { useState, useRef, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Send,
  RefreshCw,
  Building2,
  GitBranch,
  Users2,
  Settings2,
  Heart,
  Loader2,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ListChecks,
  Bot,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import OnboardingTrilhas from "@/components/onboarding/OnboardingTrilhas";

type Msg = { role: "user" | "assistant"; content: string };

const TOPICS = [
  {
    icon: Building2,
    title: "Sobre a Empresa",
    description: "História, estrutura e áreas de atuação",
    prompt: "Me conte sobre a Indústria Visual. Qual a história, estrutura e áreas de atuação da empresa?",
  },
  {
    icon: GitBranch,
    title: "Fluxo de Produção (PCP)",
    description: "Como um job passa do orçamento à entrega",
    prompt: "Explique o fluxo de produção (PCP) da Indústria Visual. Como um job passa do orçamento à entrega?",
  },
  {
    icon: Users2,
    title: "Departamentos",
    description: "Funções e responsabilidades de cada área",
    prompt: "Quais são os departamentos da Indústria Visual e quais as funções de cada um?",
  },
  {
    icon: Settings2,
    title: "Processos",
    description: "Impressão, acabamento, instalação",
    prompt: "Detalhe os processos de impressão, acabamento e instalação da Indústria Visual.",
  },
  {
    icon: Heart,
    title: "Cultura e Valores",
    description: "Nossos princípios e forma de trabalhar",
    prompt: "Quais são a cultura e os valores da Indústria Visual? Me explique o C.R.I.E.",
  },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-agent`;

async function streamChat({
  messages,
  cargo,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  cargo?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, cargo }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
      onError(err.error || `Erro ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("Sem resposta do servidor");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw || !raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {}
      }
    }

    onDone();
  } catch (e: any) {
    onError(e.message || "Erro de conexão");
  }
}

const WELCOME_MSG: Msg = {
  role: "assistant",
  content: `Olá! 👋 Bem-vindo(a) à **Indústria Visual**!

Sou o **Assistente de Onboarding**, estou aqui para te ajudar a conhecer melhor a empresa e tirar todas as suas dúvidas.

Posso te explicar sobre:
- 🏗️ **Como a empresa funciona** (estrutura, departamentos)
- 📋 **O fluxo de produção** (PCP - do orçamento à entrega)
- 🔧 **As etapas de cada processo** (impressão, acabamento, instalação)
- 👥 **Cultura e valores** da empresa
- ❓ **Dúvidas específicas** sobre seu departamento

Por onde você gostaria de começar? Ou pode me fazer qualquer pergunta! 😊`,
};

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("trilhas");
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const saveConversation = useCallback(async (msgs: Msg[]) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      titulo: msgs.find(m => m.role === "user")?.content?.slice(0, 60) || "Nova Conversa",
      mensagens: JSON.stringify(msgs),
    };
    if (conversationId) {
      await supabase.from("onboarding_conversas").update({ mensagens: JSON.stringify(msgs) }).eq("id", conversationId);
    } else {
      const { data } = await supabase.from("onboarding_conversas").insert(payload as any).select("id").single();
      if (data) setConversationId(data.id);
    }
  }, [user, conversationId]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const apiMessages = newMsgs.filter(m => m !== WELCOME_MSG);

    await streamChat({
      messages: apiMessages,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last !== WELCOME_MSG) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
        scrollToBottom();
      },
      onDone: () => {
        setIsLoading(false);
        setMessages((prev) => {
          saveConversation(prev);
          return prev;
        });
      },
      onError: (err) => {
        setIsLoading(false);
        toast({ title: "Erro", description: err, variant: "destructive" });
      },
    });
  };

  const handleTopicClick = (prompt: string) => {
    send(prompt);
  };

  const handleNewConversation = () => {
    setMessages([WELCOME_MSG]);
    setConversationId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const msgCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Onboarding</h1>
            <p className="text-sm text-muted-foreground">Trilhas de integração e assistente IA</p>
          </div>
        </div>
        {activeTab === "assistente" && (
          <Button variant="outline" size="sm" onClick={handleNewConversation} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Nova Conversa
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="trilhas" className="gap-1.5">
            <ListChecks className="h-4 w-4" /> Minhas Trilhas
          </TabsTrigger>
          <TabsTrigger value="assistente" className="gap-1.5">
            <Bot className="h-4 w-4" /> Assistente IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trilhas">
          <OnboardingTrilhas />
        </TabsContent>

        <TabsContent value="assistente">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Chat Area */}
            <Card className="flex flex-col h-[calc(100vh-18rem)]">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Conversa</span>
                </div>
                <Badge variant="outline" className="text-xs">{msgCount} mensagens</Badge>
              </div>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                  <Input ref={inputRef} placeholder="Digite sua pergunta..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="flex-1" />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>

            {/* Topics Sidebar */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Tópicos de Ajuda</h2>
              </div>
              <p className="text-xs text-muted-foreground">Clique em um tópico para saber mais</p>
              <div className="space-y-2">
                {TOPICS.map((topic) => (
                  <Card key={topic.title} className="cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => handleTopicClick(topic.prompt)}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <topic.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{topic.title}</p>
                        <p className="text-xs text-muted-foreground">{topic.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
