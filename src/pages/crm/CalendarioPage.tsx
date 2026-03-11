import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { mockTasks } from "@/lib/crm/mockData";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PRIORITY_COLORS = { alta: "bg-red-500", media: "bg-yellow-500", baixa: "bg-blue-500" };

export default function CRMCalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day: number) => {
    return mockTasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Evento</Button>
      </div>

      <Tabs defaultValue="mes">
        <TabsList><TabsTrigger value="mes">Mês</TabsTrigger><TabsTrigger value="lista">Lista</TabsTrigger></TabsList>

        <TabsContent value="mes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base">{currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</CardTitle>
              <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {DAYS.map(d => <div key={d} className="bg-muted px-2 py-1 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
                {cells.map((day, i) => {
                  const tasks = day ? getTasksForDay(day) : [];
                  const isToday = day === 11 && month === 2 && year === 2026;
                  return (
                    <div key={i} className={`bg-background min-h-[80px] p-1 ${!day ? "bg-muted/30" : ""}`}>
                      {day && (
                        <>
                          <span className={`text-xs font-medium ${isToday ? "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center" : "text-foreground"}`}>{day}</span>
                          <div className="mt-1 space-y-0.5">
                            {tasks.slice(0, 2).map(t => (
                              <div key={t.id} className={`text-[9px] px-1 py-0.5 rounded truncate text-white ${PRIORITY_COLORS[t.priority]}`}>{t.title}</div>
                            ))}
                            {tasks.length > 2 && <span className="text-[9px] text-muted-foreground">+{tasks.length - 2} mais</span>}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          <Card>
            <CardContent className="p-4 space-y-3">
              {mockTasks.filter(t => t.due_date).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[t.priority]}`} />
                  <div className="flex-1"><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.owner_name}</p></div>
                  <Badge variant="secondary" className="text-[10px]">{t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : ""}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
