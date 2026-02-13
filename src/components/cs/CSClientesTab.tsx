import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Users, UserCheck, UserX, Search } from "lucide-react";
import { mockCSCustomers } from "./mockData";
import type { CSCustomer } from "./types";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const renderStars = (n: number) => "⭐".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

const npsColor = (score: number | null) => {
  if (score === null) return "text-muted-foreground";
  if (score >= 9) return "text-green-600 font-bold";
  if (score >= 7) return "text-yellow-600 font-bold";
  return "text-red-600 font-bold";
};

const CSClientesTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [npsFilter, setNpsFilter] = useState("all");
  const [selected, setSelected] = useState<CSCustomer | null>(null);

  const promoters = mockCSCustomers.filter((c) => c.nps_category === "promoter").length;
  const passives = mockCSCustomers.filter((c) => c.nps_category === "passive").length;
  const detractors = mockCSCustomers.filter((c) => c.nps_category === "detractor").length;
  const total = mockCSCustomers.length;

  const filtered = mockCSCustomers.filter((c) => {
    if (npsFilter !== "all" && c.nps_category !== npsFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.document.includes(s) || c.contact_person.toLowerCase().includes(s);
    }
    return true;
  });

  const kpis = [
    { label: "Total Clientes Atendidos", value: String(total), icon: Users, bg: "bg-muted", color: "text-muted-foreground" },
    { label: `Promotores (NPS 9-10)`, value: `${promoters} (${Math.round((promoters / total) * 100)}%)`, icon: UserCheck, bg: "bg-green-50", color: "text-green-600" },
    { label: `Passivos (NPS 7-8)`, value: `${passives} (${Math.round((passives / total) * 100)}%)`, icon: Users, bg: "bg-yellow-50", color: "text-yellow-600" },
    { label: `Detratores (NPS 0-6)`, value: `${detractors} (${Math.round((detractors / total) * 100)}%)`, icon: UserX, bg: "bg-red-50", color: "text-red-600" },
  ];

  return (
    <div ref={ref} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Select value={npsFilter} onValueChange={setNpsFilter}>
            <SelectTrigger><SelectValue placeholder="NPS" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="promoter">Promotores</SelectItem>
              <SelectItem value="passive">Passivos</SelectItem>
              <SelectItem value="detractor">Detratores</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Jobs</TableHead>
                <TableHead>Último Job</TableHead>
                <TableHead className="text-center">NPS</TableHead>
                <TableHead>Satisfação</TableHead>
                <TableHead className="text-center">Recl.</TableHead>
                <TableHead className="text-right">Receita Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className={`cursor-pointer hover:bg-muted/50 ${c.open_complaints > 0 ? "bg-red-50/30" : ""}`} onClick={() => setSelected(c)}>
                  <TableCell>
                    <div>
                      <p className="font-bold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.document}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.contact_person}</TableCell>
                  <TableCell className="text-center">{c.total_jobs}</TableCell>
                  <TableCell>{formatDate(c.last_job_date)}</TableCell>
                  <TableCell className={`text-center ${npsColor(c.nps_score)}`}>{c.nps_score ?? "—"}</TableCell>
                  <TableCell>{renderStars(c.avg_satisfaction)}</TableCell>
                  <TableCell className="text-center">
                    {c.complaint_count > 0 ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{c.complaint_count}{c.open_complaints > 0 ? ` (${c.open_complaints} aberta${c.open_complaints > 1 ? "s" : ""})` : ""}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.total_revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>CNPJ: {selected.document}</p>
                  <p>Contato: {selected.contact_person}</p>
                  <p>Email: {selected.email}</p>
                  <p>Telefone: {selected.phone}</p>
                  <p>Cidade: {selected.city} - {selected.state}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">NPS</p>
                      <p className={`text-2xl font-bold ${npsColor(selected.nps_score)}`}>{selected.nps_score ?? "—"}</p>
                      <p className="text-xs capitalize">{selected.nps_category ?? ""}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Satisfação</p>
                      <p className="text-lg">{renderStars(selected.avg_satisfaction)}</p>
                      <p className="text-xs">{selected.avg_satisfaction.toFixed(1)}/5</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Jobs Realizados</p>
                      <p className="text-2xl font-bold">{selected.total_jobs}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Receita Total</p>
                      <p className="text-lg font-bold">{formatCurrency(selected.total_revenue)}</p>
                    </CardContent>
                  </Card>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Reclamações</h4>
                  {selected.complaint_count === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma reclamação registrada.</p>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p>Total: {selected.complaint_count}</p>
                      {selected.open_complaints > 0 && <p className="text-red-600">Abertas: {selected.open_complaints}</p>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
});

CSClientesTab.displayName = "CSClientesTab";
export default CSClientesTab;
