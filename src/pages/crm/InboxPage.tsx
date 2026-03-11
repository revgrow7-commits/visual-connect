import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Pin, Search } from "lucide-react";

const mockConversations = [
  { id: "1", name: "Carlos Incomum", company: "AGENCIA INCOMUM", lastMsg: "Vamos agendar para semana que vem?", time: "10:30", unread: 2, pinned: true },
  { id: "2", name: "Roberto Menezes", company: "TERMOLAR", lastMsg: "Recebi a proposta, vou analisar", time: "Ontem", unread: 0, pinned: false },
  { id: "3", name: "Mariana Asun", company: "CLAUDIO ASUN", lastMsg: "Material aprovado! Pode seguir", time: "Ontem", unread: 0, pinned: true },
  { id: "4", name: "Thiago Costa", company: "SICREDI", lastMsg: "Preciso de mais informações", time: "Seg", unread: 1, pinned: false },
  { id: "5", name: "Fernanda Alibem", company: "ALIBEM", lastMsg: "Obrigada pelo retorno", time: "08/03", unread: 0, pinned: false },
];

const mockMessages = [
  { id: "m1", from: "Carlos Incomum", text: "Olá Rafael, tudo bem? Gostaria de discutir o projeto de rebranding.", time: "09:15", mine: false },
  { id: "m2", from: "Você", text: "Oi Carlos! Claro, quando podemos agendar?", time: "09:20", mine: true },
  { id: "m3", from: "Carlos Incomum", text: "Vamos agendar para semana que vem?", time: "10:30", mine: false },
];

export default function CRMInboxPage() {
  const [selected, setSelected] = useState(mockConversations[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar conversa..." className="pl-9" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {mockConversations.map(c => (
                <div key={c.id} onClick={() => setSelected(c)} className={`flex items-start gap-3 p-3 cursor-pointer border-b hover:bg-muted/50 ${selected.id === c.id ? "bg-muted" : ""}`}>
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{c.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {c.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{c.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.company}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg}</p>
                  </div>
                  {c.unread > 0 && <Badge className="text-[10px] shrink-0">{c.unread}</Badge>}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-3 border-b flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{selected.name.charAt(0)}</div>
              <div><p className="text-sm font-medium">{selected.name}</p><p className="text-xs text-muted-foreground">{selected.company}</p></div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map(m => (
                  <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${m.mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm">{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex items-center gap-2">
              <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
              <Input placeholder="Escreva uma mensagem..." className="flex-1" value={message} onChange={e => setMessage(e.target.value)} />
              <Button size="icon"><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
