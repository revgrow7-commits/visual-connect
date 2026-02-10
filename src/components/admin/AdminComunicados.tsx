import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string | null;
  categoria: string;
  unidade: string;
  fixado: boolean;
  status: string;
  created_at: string;
}

const CATEGORIAS = ["Geral", "RH", "Institucional", "Resultados", "Eventos", "TI"];
const UNIDADES = ["Todas", "POA", "SP", "RJ", "BH"];

const AdminComunicados = () => {
  const { toast } = useToast();
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Comunicado | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    conteudo: "",
    categoria: "Geral",
    unidade: "Todas",
    fixado: false,
  });

  const fetchComunicados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comunicados")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar comunicados", description: error.message, variant: "destructive" });
    } else {
      setComunicados(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComunicados();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ titulo: "", conteudo: "", categoria: "Geral", unidade: "Todas", fixado: false });
    setDialogOpen(true);
  };

  const openEdit = (c: Comunicado) => {
    setEditing(c);
    setForm({
      titulo: c.titulo,
      conteudo: c.conteudo || "",
      categoria: c.categoria,
      unidade: c.unidade,
      fixado: c.fixado,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("comunicados")
        .update(form)
        .eq("id", editing.id);
      if (error) toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      else toast({ title: "Comunicado atualizado" });
    } else {
      const { error } = await supabase.from("comunicados").insert(form);
      if (error) toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      else toast({ title: "Comunicado criado" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchComunicados();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comunicados").delete().eq("id", id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Comunicado excluído" });
      fetchComunicados();
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Comunicados</CardTitle>
          <CardDescription>Crie e gerencie comunicados internos</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Comunicado" : "Novo Comunicado"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea rows={4} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.fixado} onCheckedChange={(v) => setForm({ ...form, fixado: v })} />
                <Label>Fixar comunicado</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Salvar Alterações" : "Criar Comunicado"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : comunicados.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhum comunicado cadastrado.</TableCell></TableRow>
            ) : (
              comunicados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.titulo}</TableCell>
                  <TableCell><Badge variant="outline">{c.categoria}</Badge></TableCell>
                  <TableCell>{c.unidade}</TableCell>
                  <TableCell>{formatDate(c.created_at)}</TableCell>
                  <TableCell>
                    {c.fixado && <Badge className="bg-destructive text-destructive-foreground">Fixado</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

export default AdminComunicados;
