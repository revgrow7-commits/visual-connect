import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, GripVertical, Video, FileText, CheckSquare, Pencil, ChevronDown, ChevronUp,
} from "lucide-react";

type Etapa = {
  id?: string;
  titulo: string;
  descricao: string;
  tipo: "checklist" | "video" | "documento";
  conteudo_url: string;
  obrigatoria: boolean;
  ordem: number;
};

type Trilha = {
  id: string;
  nome: string;
  descricao: string | null;
  cargo: string;
  unidade: string;
  ativo: boolean;
  created_at: string;
};

const TIPO_ICONS = {
  checklist: CheckSquare,
  video: Video,
  documento: FileText,
};

const TIPO_LABELS = {
  checklist: "Checklist",
  video: "Vídeo",
  documento: "Documento",
};

export default function AdminTrilhas() {
  const { toast } = useToast();
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<Trilha | null>(null);
  const [expandedTrilha, setExpandedTrilha] = useState<string | null>(null);
  const [etapas, setEtapas] = useState<Record<string, Etapa[]>>({});

  // Form state
  const [form, setForm] = useState({ nome: "", descricao: "", cargo: "", unidade: "Todas" });
  const [etapaForm, setEtapaForm] = useState<Etapa>({
    titulo: "", descricao: "", tipo: "checklist", conteudo_url: "", obrigatoria: true, ordem: 0,
  });
  const [openEtapaDialog, setOpenEtapaDialog] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [activeTrilaIdForEtapa, setActiveTrilaIdForEtapa] = useState<string | null>(null);

  const fetchTrilhas = async () => {
    const { data, error } = await supabase
      .from("onboarding_trilhas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setTrilhas((data as any[]) || []);
    setLoading(false);
  };

  const fetchEtapas = async (trilhaId: string) => {
    const { data, error } = await supabase
      .from("onboarding_etapas")
      .select("*")
      .eq("trilha_id", trilhaId)
      .order("ordem", { ascending: true });
    if (error) return;
    setEtapas((prev) => ({ ...prev, [trilhaId]: (data as any[]) || [] }));
  };

  useEffect(() => { fetchTrilhas(); }, []);

  useEffect(() => {
    if (expandedTrilha && !etapas[expandedTrilha]) {
      fetchEtapas(expandedTrilha);
    }
  }, [expandedTrilha]);

  const handleSaveTrilha = async () => {
    if (!form.nome || !form.cargo) {
      toast({ title: "Preencha nome e cargo", variant: "destructive" });
      return;
    }
    if (editingTrilha) {
      const { error } = await supabase
        .from("onboarding_trilhas")
        .update({ nome: form.nome, descricao: form.descricao || null, cargo: form.cargo, unidade: form.unidade })
        .eq("id", editingTrilha.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Trilha atualizada" });
    } else {
      const { error } = await supabase
        .from("onboarding_trilhas")
        .insert({ nome: form.nome, descricao: form.descricao || null, cargo: form.cargo, unidade: form.unidade } as any);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Trilha criada" });
    }
    setOpenDialog(false);
    setEditingTrilha(null);
    setForm({ nome: "", descricao: "", cargo: "", unidade: "Todas" });
    fetchTrilhas();
  };

  const handleDeleteTrilha = async (id: string) => {
    const { error } = await supabase.from("onboarding_trilhas").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Trilha removida" });
    fetchTrilhas();
  };

  const handleToggleTrilha = async (id: string, ativo: boolean) => {
    await supabase.from("onboarding_trilhas").update({ ativo: !ativo }).eq("id", id);
    fetchTrilhas();
  };

  const handleSaveEtapa = async () => {
    if (!etapaForm.titulo || !activeTrilaIdForEtapa) return;
    const currentEtapas = etapas[activeTrilaIdForEtapa] || [];
    const payload = {
      ...etapaForm,
      trilha_id: activeTrilaIdForEtapa,
      ordem: editingEtapa ? etapaForm.ordem : currentEtapas.length,
    };
    if (editingEtapa?.id) {
      const { error } = await supabase.from("onboarding_etapas").update(payload as any).eq("id", editingEtapa.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("onboarding_etapas").insert(payload as any);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    setOpenEtapaDialog(false);
    setEditingEtapa(null);
    setEtapaForm({ titulo: "", descricao: "", tipo: "checklist", conteudo_url: "", obrigatoria: true, ordem: 0 });
    fetchEtapas(activeTrilaIdForEtapa);
  };

  const handleDeleteEtapa = async (etapaId: string, trilhaId: string) => {
    await supabase.from("onboarding_etapas").delete().eq("id", etapaId);
    fetchEtapas(trilhaId);
  };

  const openEditTrilha = (trilha: Trilha) => {
    setEditingTrilha(trilha);
    setForm({ nome: trilha.nome, descricao: trilha.descricao || "", cargo: trilha.cargo, unidade: trilha.unidade });
    setOpenDialog(true);
  };

  const openAddEtapa = (trilhaId: string) => {
    setActiveTrilaIdForEtapa(trilhaId);
    setEditingEtapa(null);
    setEtapaForm({ titulo: "", descricao: "", tipo: "checklist", conteudo_url: "", obrigatoria: true, ordem: 0 });
    setOpenEtapaDialog(true);
  };

  const openEditEtapa = (etapa: any, trilhaId: string) => {
    setActiveTrilaIdForEtapa(trilhaId);
    setEditingEtapa(etapa);
    setEtapaForm({
      titulo: etapa.titulo,
      descricao: etapa.descricao || "",
      tipo: etapa.tipo,
      conteudo_url: etapa.conteudo_url || "",
      obrigatoria: etapa.obrigatoria,
      ordem: etapa.ordem,
    });
    setOpenEtapaDialog(true);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trilhas de Onboarding</h2>
        <Dialog open={openDialog} onOpenChange={(o) => { setOpenDialog(o); if (!o) { setEditingTrilha(null); setForm({ nome: "", descricao: "", cargo: "", unidade: "Todas" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nova Trilha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrilha ? "Editar Trilha" : "Nova Trilha"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Trilha do Designer" />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Designer Gráfico" />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    <SelectItem value="POA">POA</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da trilha..." />
              </div>
              <Button onClick={handleSaveTrilha} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {trilhas.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma trilha criada ainda.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {trilhas.map((trilha) => {
            const isExpanded = expandedTrilha === trilha.id;
            const trilhaEtapas = etapas[trilha.id] || [];
            return (
              <Card key={trilha.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedTrilha(isExpanded ? null : trilha.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <CardTitle className="text-base">{trilha.nome}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{trilha.cargo}</Badge>
                          <Badge variant="secondary" className="text-xs">{trilha.unidade}</Badge>
                          {!trilha.ativo && <Badge variant="destructive" className="text-xs">Inativa</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={trilha.ativo} onCheckedChange={() => handleToggleTrilha(trilha.id, trilha.ativo)} />
                      <Button variant="ghost" size="icon" onClick={() => openEditTrilha(trilha)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTrilha(trilha.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-2 space-y-3">
                    {trilha.descricao && <p className="text-sm text-muted-foreground">{trilha.descricao}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Etapas ({trilhaEtapas.length})</span>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddEtapa(trilha.id)}>
                        <Plus className="h-3.5 w-3.5" /> Adicionar Etapa
                      </Button>
                    </div>
                    {trilhaEtapas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma etapa adicionada.</p>
                    ) : (
                      <div className="space-y-2">
                        {trilhaEtapas.map((etapa: any, idx: number) => {
                          const TipoIcon = TIPO_ICONS[etapa.tipo as keyof typeof TIPO_ICONS] || CheckSquare;
                          return (
                            <div key={etapa.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground w-6">{idx + 1}</span>
                              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <TipoIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{etapa.titulo}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px]">{TIPO_LABELS[etapa.tipo as keyof typeof TIPO_LABELS]}</Badge>
                                  {etapa.obrigatoria && <Badge className="text-[10px] bg-primary/20 text-primary border-0">Obrigatória</Badge>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEtapa(etapa, trilha.id)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteEtapa(etapa.id, trilha.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Etapa Dialog */}
      <Dialog open={openEtapaDialog} onOpenChange={(o) => { setOpenEtapaDialog(o); if (!o) setEditingEtapa(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEtapa ? "Editar Etapa" : "Nova Etapa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={etapaForm.titulo} onChange={(e) => setEtapaForm({ ...etapaForm, titulo: e.target.value })} placeholder="Ex: Assistir vídeo institucional" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={etapaForm.tipo} onValueChange={(v: any) => setEtapaForm({ ...etapaForm, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checklist">✅ Checklist</SelectItem>
                  <SelectItem value="video">🎬 Vídeo</SelectItem>
                  <SelectItem value="documento">📄 Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(etapaForm.tipo === "video" || etapaForm.tipo === "documento") && (
              <div>
                <Label>{etapaForm.tipo === "video" ? "URL do Vídeo" : "URL do Documento"}</Label>
                <Input value={etapaForm.conteudo_url} onChange={(e) => setEtapaForm({ ...etapaForm, conteudo_url: e.target.value })} placeholder="https://..." />
              </div>
            )}
            <div>
              <Label>Descrição</Label>
              <Textarea value={etapaForm.descricao} onChange={(e) => setEtapaForm({ ...etapaForm, descricao: e.target.value })} placeholder="Instrução ou detalhes da etapa..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={etapaForm.obrigatoria} onCheckedChange={(c) => setEtapaForm({ ...etapaForm, obrigatoria: c })} />
              <Label>Obrigatória</Label>
            </div>
            <Button onClick={handleSaveEtapa} className="w-full">Salvar Etapa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
