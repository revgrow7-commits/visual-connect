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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, ThumbsUp, MessageCircle, ShieldAlert, Eye, EyeOff, Sparkles, Image as ImageIcon } from "lucide-react";

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string | null;
  categoria: string;
  unidade: string;
  fixado: boolean;
  status: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  comentarios_count: number;
  image_url: string | null;
}

interface Comentario {
  id: string;
  comunicado_id: string;
  autor_nome: string;
  conteudo: string;
  moderado: boolean;
  created_at: string;
}

const CATEGORIAS = ["Geral", "RH", "Institucional", "Resultados", "Eventos", "TI", "Segurança"];
const UNIDADES = ["Todas", "POA", "SP", "RJ", "BH"];

const AdminComunicados = () => {
  const { toast } = useToast();
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Comunicado | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPoster, setGeneratingPoster] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<{ id: string; url: string } | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    conteudo: "",
    categoria: "Geral",
    unidade: "Todas",
    fixado: false,
    status: "ativo",
  });

  const fetchComunicados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comunicados")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else setComunicados((data || []) as Comunicado[]);
    setLoading(false);
  };

  const fetchComentarios = async () => {
    const { data } = await supabase
      .from("comunicado_comentarios")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50) as { data: Comentario[] | null };
    setComentarios(data || []);
  };

  useEffect(() => { fetchComunicados(); fetchComentarios(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ titulo: "", conteudo: "", categoria: "Geral", unidade: "Todas", fixado: false, status: "ativo" });
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
      status: c.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("comunicados").update(form).eq("id", editing.id);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Comunicado atualizado" });
    } else {
      const { error } = await supabase.from("comunicados").insert(form);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Comunicado criado" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchComunicados();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comunicados").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Comunicado excluído" }); fetchComunicados(); }
  };

  const toggleStatus = async (c: Comunicado) => {
    const newStatus = c.status === "ativo" ? "inativo" : "ativo";
    await supabase.from("comunicados").update({ status: newStatus }).eq("id", c.id);
    fetchComunicados();
  };

  const handleGeneratePoster = async (c: Comunicado) => {
    setGeneratingPoster(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("endomarketing-agent", {
        body: {
          tema: c.titulo,
          tom: "motivacional",
          detalhes: c.conteudo || "",
          gerarImagem: true,
        },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        // Save image_url to the comunicado
        await supabase.from("comunicados").update({ image_url: data.imageUrl }).eq("id", c.id);
        setPosterPreview({ id: c.id, url: data.imageUrl });
        toast({ title: "Cartaz gerado com sucesso!", description: "O cartaz foi vinculado ao comunicado." });
        fetchComunicados();
      } else {
        toast({ title: "Cartaz gerado sem imagem", description: "A IA não conseguiu gerar a imagem. Tente novamente.", variant: "destructive" });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao gerar cartaz", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingPoster(null);
    }
  };

  const toggleModeration = async (comment: Comentario) => {
    await supabase.from("comunicado_comentarios").update({ moderado: !comment.moderado }).eq("id", comment.id);
    toast({ title: comment.moderado ? "Comentário restaurado" : "Comentário moderado" });
    fetchComentarios();
  };

  const deleteComment = async (id: string) => {
    await supabase.from("comunicado_comentarios").delete().eq("id", id);
    toast({ title: "Comentário excluído" });
    fetchComentarios();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Comunicados</CardTitle>
          <CardDescription>Gerencie comunicados internos e modere comentários</CardDescription>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={form.fixado} onCheckedChange={(v) => setForm({ ...form, fixado: v })} />
                  <Label>Fixar comunicado</Label>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Salvar Alterações" : "Criar Comunicado"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Poster Preview Dialog */}
        {posterPreview && (
          <Dialog open={!!posterPreview} onOpenChange={() => setPosterPreview(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Cartaz Gerado</DialogTitle>
              </DialogHeader>
              <img src={posterPreview.url} alt="Cartaz gerado pela IA" className="w-full rounded-lg" />
            </DialogContent>
          </Dialog>
        )}

        <Tabs defaultValue="comunicados">
          <TabsList className="mb-4">
            <TabsTrigger value="comunicados">Comunicados ({comunicados.length})</TabsTrigger>
            <TabsTrigger value="comentarios">Moderação ({comentarios.filter((c) => !c.moderado).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="comunicados">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Engajamento</TableHead>
                  <TableHead>Cartaz</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : comunicados.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Nenhum comunicado.</TableCell></TableRow>
                ) : (
                  comunicados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {c.fixado && <Badge variant="outline" className="mr-1 text-[10px]">📌</Badge>}
                        {c.titulo}
                      </TableCell>
                      <TableCell><Badge variant="outline">{c.categoria}</Badge></TableCell>
                      <TableCell>{c.unidade}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{c.likes_count || 0}</span>
                          <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{c.comentarios_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.image_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1 text-primary"
                            onClick={() => setPosterPreview({ id: c.id, url: c.image_url! })}
                          >
                            <ImageIcon className="h-3 w-3" /> Ver
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => handleGeneratePoster(c)}
                            disabled={generatingPoster === c.id}
                          >
                            {generatingPoster === c.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            {generatingPoster === c.id ? "Gerando..." : "Gerar"}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(c.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => toggleStatus(c)}>
                          {c.status === "ativo" ? <><Eye className="h-3 w-3 mr-1" />Ativo</> : <><EyeOff className="h-3 w-3 mr-1" />Inativo</>}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {c.image_url ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Regerar cartaz"
                              onClick={() => handleGeneratePoster(c)}
                              disabled={generatingPoster === c.id}
                            >
                              {generatingPoster === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="comentarios">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autor</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comentarios.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum comentário.</TableCell></TableRow>
                ) : (
                  comentarios.map((c) => (
                    <TableRow key={c.id} className={c.moderado ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{c.autor_nome}</TableCell>
                      <TableCell className="max-w-xs truncate">{c.conteudo}</TableCell>
                      <TableCell>{formatDate(c.created_at)}</TableCell>
                      <TableCell>
                        {c.moderado
                          ? <Badge variant="destructive" className="text-[10px]">Moderado</Badge>
                          : <Badge variant="outline" className="text-[10px]">Ativo</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toggleModeration(c)} title={c.moderado ? "Restaurar" : "Moderar"}>
                            <ShieldAlert className="h-4 w-4 text-yellow-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteComment(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminComunicados;
