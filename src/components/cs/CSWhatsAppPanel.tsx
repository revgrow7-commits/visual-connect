import React, { useState } from "react";
import { useWhatsAppLogs, useSendWhatsAppMessage } from "@/hooks/useWhatsAppLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageSquare, Send, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2, Phone, Search, Filter } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  read: "bg-green-500/10 text-green-700 border-green-500/30",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
};

const originLabels: Record<string, string> = {
  regua: "Régua",
  ticket: "Ticket",
  oportunidade: "Oportunidade",
  nps: "NPS",
  manual: "Manual",
};

const CSWhatsAppPanel: React.FC = () => {
  const { data: logs, isLoading, refetch } = useWhatsAppLogs();
  const sendMsg = useSendWhatsAppMessage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!phone || !message) {
      toast.error("Preencha telefone e mensagem");
      return;
    }
    try {
      await sendMsg.mutateAsync({
        phone,
        message,
        customer_name: customerName || undefined,
        origin: "manual",
        sent_by: "Carlos",
      });
      toast.success("Mensagem enviada!");
      setDialogOpen(false);
      setPhone("");
      setCustomerName("");
      setMessage("");
    } catch {
      toast.error("Falha ao enviar mensagem");
    }
  };

  const filtered = (logs || []).filter((l) => {
    if (filterOrigin !== "all" && l.origin !== filterOrigin) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.customer_name?.toLowerCase().includes(s) ||
        l.phone.includes(s) ||
        l.message.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // KPIs
  const total = logs?.length || 0;
  const sent = logs?.filter((l) => l.status === "sent" || l.status === "delivered" || l.status === "read").length || 0;
  const failed = logs?.filter((l) => l.status === "failed").length || 0;
  const read = logs?.filter((l) => l.status === "read").length || 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total mensagens</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{sent}</p><p className="text-xs text-muted-foreground">Enviadas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{read}</p><p className="text-xs text-muted-foreground">Lidas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{failed}</p><p className="text-xs text-muted-foreground">Falhas</p></CardContent></Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Send className="h-4 w-4" /> Nova Mensagem</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar WhatsApp</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do cliente (opcional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="5551999999999" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Textarea placeholder="Mensagem..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button className="w-full gap-2" onClick={handleSend} disabled={sendMsg.isPending}>
                {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-48" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-32"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="regua">Régua</SelectItem>
            <SelectItem value="ticket">Ticket</SelectItem>
            <SelectItem value="oportunidade">Oportunidade</SelectItem>
            <SelectItem value="nps">NPS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="read">Lido</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
          </SelectContent>
        </Select>

        <Button size="icon" variant="ghost" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Histórico de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Nenhuma mensagem encontrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.direction === "outbound" ? (
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {log.created_at ? format(new Date(log.created_at), "dd/MM HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-medium max-w-[120px] truncate">{log.customer_name || "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{log.phone}</TableCell>
                    <TableCell className="text-xs max-w-[250px] truncate">{log.message}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {originLabels[log.origin || "manual"] || log.origin}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[log.status || "pending"]}`}>
                        {log.status || "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSWhatsAppPanel;
