import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface Colaborador {
  id: string;
  nome: string;
  sobrenome: string | null;
  cargo: string | null;
  setor: string | null;
  unidade: string | null;
  status: string;
  email_pessoal: string | null;
  data_admissao: string | null;
}

const getInitials = (nome: string, sobrenome?: string | null) =>
  `${nome?.[0] || ""}${sobrenome?.[0] || ""}`.toUpperCase();

const statusColor: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  completo: "bg-emerald-100 text-emerald-800",
  ativo: "bg-emerald-100 text-emerald-800",
};

async function fetchColaboradores(): Promise<Colaborador[]> {
  const { data } = await supabase
    .from("colaboradores")
    .select("id, nome, sobrenome, cargo, setor, unidade, status, email_pessoal, data_admissao")
    .order("nome");
  return (data || []) as Colaborador[];
}

const AdminColaboradores = () => {
  const [search, setSearch] = useState("");

  const { data: colaboradores = [], isLoading: loading } = useQuery({
    queryKey: ["admin-colaboradores"],
    queryFn: fetchColaboradores,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filtered = colaboradores.filter((c) =>
    `${c.nome} ${c.sobrenome || ""} ${c.cargo || ""} ${c.setor || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Colaboradores</CardTitle>
        <CardDescription>Visualize e gerencie os colaboradores cadastrados</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar colaborador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum colaborador encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(c.nome, c.sobrenome)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{c.nome} {c.sobrenome || ""}</p>
                        <p className="text-xs text-muted-foreground">{c.email_pessoal || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.cargo || "—"}</TableCell>
                  <TableCell>{c.setor || "—"}</TableCell>
                  <TableCell>{c.unidade || "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[c.status] || "bg-muted text-muted-foreground"}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminColaboradores;
