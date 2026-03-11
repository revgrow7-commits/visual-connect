import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plus, Bot, User, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Qual é o status do meu pipeline?",
  "Quais deals estão em risco?",
  "Resumo de vendas do mês",
  "Sugira próximos passos para o deal Termolar",
  "Previsão de receita para o trimestre",
];

export default function CRMWorkspaceAIPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Olá! 👋 Sou o assistente de IA do CRM. Posso ajudá-lo com análise de dados, sugestões de próximos passos, previsões de vendas e muito mais. Como posso ajudar?" },
  ]);

  const handleSend = (text?: string) => {
    const msg = text || message;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: msg }, { role: "assistant", content: "Analisando seus dados... Esta funcionalidade será conectada à IA em breve. 🚀" }]);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspace AI</h1>
          <p className="text-sm text-muted-foreground">Assistente inteligente para análise e decisões</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-14rem)]">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-3 space-y-2">
            <Button className="w-full justify-start" variant="outline"><Plus className="h-4 w-4 mr-2" /> Nova Conversa</Button>
            <div className="space-y-1 mt-3">
              <div className="p-2 rounded-lg bg-muted text-sm font-medium cursor-pointer">💬 Pipeline Analysis</div>
              <div className="p-2 rounded-lg hover:bg-muted/50 text-sm text-muted-foreground cursor-pointer">📊 Forecast Q2</div>
              <div className="p-2 rounded-lg hover:bg-muted/50 text-sm text-muted-foreground cursor-pointer">🔍 Lead Scoring</div>
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0 h-full flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
                    <div className={`max-w-[70%] p-3 rounded-lg ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm">{m.content}</p>
                    </div>
                    {m.role === "user" && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>}
                  </div>
                ))}
              </div>

              {messages.length === 1 && (
                <div className="max-w-3xl mx-auto mt-6">
                  <p className="text-xs text-muted-foreground mb-3">Sugestões:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map(s => (
                      <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => handleSend(s)}>{s}</Button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t flex items-center gap-2">
              <Input placeholder="Pergunte sobre seus dados..." className="flex-1" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} />
              <Button size="icon" onClick={() => handleSend()}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
