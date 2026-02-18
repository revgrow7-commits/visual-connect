import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ExternalLink, Download, Plus } from "lucide-react";
import { toast } from "sonner";

interface CSMeetingDialogProps {
  customerName?: string;
  customerEmail?: string;
  trigger?: React.ReactNode;
}

const CSMeetingDialog: React.FC<CSMeetingDialogProps> = ({ customerName, customerEmail, trigger }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(customerName ? `Reunião com ${customerName}` : "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState(customerEmail || "");
  const [meetingType, setMeetingType] = useState<string>("reuniao");
  const [location, setLocation] = useState("");

  const formatDateForGCal = (dateStr: string, timeStr: string) => {
    const d = new Date(`${dateStr}T${timeStr}:00`);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const generateGoogleCalendarUrl = () => {
    if (!date || !title) {
      toast.error("Preencha título e data");
      return null;
    }

    const startDT = formatDateForGCal(date, startTime);
    const endDT = formatDateForGCal(date, endTime);

    const typeLabels: Record<string, string> = {
      reuniao: "Reunião",
      visita: "Visita Técnica",
      followup: "Follow-up",
      apresentacao: "Apresentação",
    };

    const fullTitle = `[${typeLabels[meetingType] || "Reunião"}] ${title}`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: fullTitle,
      dates: `${startDT}/${endDT}`,
      details: description || `Reunião CS - ${typeLabels[meetingType]}`,
      location: location || "",
    });

    if (attendees) {
      params.set("add", attendees.split(",").map(e => e.trim()).join(","));
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICS = () => {
    if (!date || !title) {
      toast.error("Preencha título e data");
      return;
    }

    const startDT = formatDateForGCal(date, startTime);
    const endDT = formatDateForGCal(date, endTime);

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CS Workspace//Meeting//PT",
      "BEGIN:VEVENT",
      `DTSTART:${startDT}`,
      `DTEND:${endDT}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description || "Reunião CS"}`,
      `LOCATION:${location || ""}`,
      attendees ? `ATTENDEE;CN=${attendees}:mailto:${attendees.split(",")[0].trim()}` : "",
      `UID:${Date.now()}@csworkspace`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reuniao-${date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo .ics baixado!");
  };

  const openGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl();
    if (url) {
      window.open(url, "_blank");
      toast.success("Google Calendar aberto em nova aba!");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <Calendar className="h-4 w-4" />
            Nova Reunião
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Reunião
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reunião com cliente..." />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reuniao">📅 Reunião</SelectItem>
                  <SelectItem value="visita">🏠 Visita Técnica</SelectItem>
                  <SelectItem value="followup">🔄 Follow-up</SelectItem>
                  <SelectItem value="apresentacao">📊 Apresentação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <Label>Início</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div>
              <Label>Término</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div className="col-span-2">
              <Label>Local</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Escritório, Google Meet, endereço..." />
            </div>

            <div className="col-span-2">
              <Label>Participantes (emails separados por vírgula)</Label>
              <Input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="email@empresa.com, outro@empresa.com" />
            </div>

            <div className="col-span-2">
              <Label>Descrição / Pauta</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pauta da reunião..." rows={3} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={openGoogleCalendar} className="flex-1 gap-2" style={{ backgroundColor: "hsl(350 67% 37%)" }}>
              <ExternalLink className="h-4 w-4" />
              Salvar no Google Calendar
            </Button>
            <Button variant="outline" onClick={generateICS} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar .ics
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            O Google Calendar abrirá em nova aba para confirmar o evento. O arquivo .ics é compatível com Outlook, Apple Calendar e outros.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSMeetingDialog;
