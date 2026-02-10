import { useState } from "react";
import { Link2, Copy, CheckCircle2, Plus, Trash2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CampoPersonalizado {
  id: string;
  nome: string;
  tipo: "texto" | "numero" | "data" | "selecao" | "arquivo";
  obrigatorio: boolean;
}

interface LinkGerado {
  id: string;
  candidato: string;
  email: string;
  cargo: string;
  unidade: string;
  token: string;
  criadoEm: string;
  expiraEm: string;
  status: "ativo" | "expirado" | "preenchido";
  camposExtras: CampoPersonalizado[];
}

const mockLinks: LinkGerado[] = [
  {
    id: "1", candidato: "Ana Paula Silva", email: "ana@email.com", cargo: "Designer Gráfico", unidade: "POA",
    token: "abc123def456", criadoEm: "2025-02-05", expiraEm: "2025-02-12", status: "preenchido", camposExtras: [],
  },
  {
    id: "2", candidato: "Carlos Eduardo", email: "carlos@email.com", cargo: "Instalador Externo", unidade: "SP",
    token: "xyz789ghj012", criadoEm: "2025-02-08", expiraEm: "2025-02-15", status: "ativo", camposExtras: [],
  },
  {
    id: "3", candidato: "Juliana Mendes", email: "juliana@email.com", cargo: "Estagiária", unidade: "POA",
    token: "mno345pqr678", criadoEm: "2025-01-20", expiraEm: "2025-01-27", status: "expirado", camposExtras: [],
  },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ativo: { label: "Ativo", variant: "default" },
  preenchido: { label: "Preenchido", variant: "secondary" },
  expirado: { label: "Expirado", variant: "destructive" },
};

const GerarLinkPage = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [links, setLinks] = useState<LinkGerado[]>(mockLinks);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [nomeCandidato, setNomeCandidato] = useState("");
  const [emailCandidato, setEmailCandidato] = useState("");
  const [cargoCandidato, setCargoCandidato] = useState("");
  const [unidadeCandidato, setUnidadeCandidato] = useState("");
  const [expiracao, setExpiracao] = useState("7");
  const [camposExtras, setCamposExtras] = useState<CampoPersonalizado[]>([]);

  const addCampoExtra = () => {
    setCamposExtras((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", tipo: "texto", obrigatorio: false },
    ]);
  };

  const removeCampoExtra = (id: string) => {
    setCamposExtras((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCampoExtra = (id: string, field: keyof CampoPersonalizado, value: any) => {
    setCamposExtras((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const gerarLink = async () => {
    if (!nomeCandidato || !emailCandidato || !cargoCandidato || !unidadeCandidato) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    const token = Math.random().toString(36).substring(2, 14);
    const hoje = new Date();
    const expira = new Date(hoje);
    expira.setDate(expira.getDate() + parseInt(expiracao));

    // Save to database
    const { data, error } = await supabase.from("recruitment_links").insert([{
      candidato_nome: nomeCandidato,
      candidato_email: emailCandidato,
      cargo: cargoCandidato,
      unidade: unidadeCandidato,
      token,
      expira_em: expira.toISOString(),
      status: "ativo",
      campos_extras: camposExtras as any,
    }]).select().single();

    if (error) {
      console.error("Error creating link:", error);
      toast({ title: "Erro ao gerar link", description: "Não foi possível salvar o link. Tente novamente.", variant: "destructive" });
      return;
    }

    const novoLink: LinkGerado = {
      id: data.id,
      candidato: nomeCandidato,
      email: emailCandidato,
      cargo: cargoCandidato,
      unidade: unidadeCandidato,
      token,
      criadoEm: hoje.toISOString().split("T")[0],
      expiraEm: expira.toISOString().split("T")[0],
      status: "ativo",
      camposExtras,
    };

    setLinks((prev) => [novoLink, ...prev]);
    setDialogOpen(false);
    resetForm();
    toast({ title: "Link gerado!", description: `Link criado para ${emailCandidato}.` });
  };

  const resetForm = () => {
    setNomeCandidato("");
    setEmailCandidato("");
    setCargoCandidato("");
    setUnidadeCandidato("");
    setExpiracao("7");
    setCamposExtras([]);
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/formulario/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerar Link de Formulário</h1>
          <p className="text-muted-foreground text-sm">Crie links únicos para candidatos contratados preencherem o formulário de admissão.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Gerar Novo Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{links.filter((l) => l.status === "ativo").length}</p>
              <p className="text-xs text-muted-foreground">Links Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-2xl font-bold">{links.filter((l) => l.status === "preenchido").length}</p>
              <p className="text-xs text-muted-foreground">Preenchidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{links.filter((l) => l.status === "expirado").length}</p>
              <p className="text-xs text-muted-foreground">Expirados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => {
                  const st = statusMap[l.status];
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{l.candidato}</p>
                        <p className="text-xs text-muted-foreground">{l.email}</p>
                      </TableCell>
                      <TableCell className="text-sm">{l.cargo}</TableCell>
                      <TableCell><Badge variant="secondary">{l.unidade}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.criadoEm}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.expiraEm}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => copyLink(l.token, l.id)}>
                            {copiedId === l.id ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                            {copiedId === l.id ? "Copiado" : "Copiar Link"}
                          </Button>
                          {l.status === "ativo" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Gerar Link */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Link de Formulário</DialogTitle>
            <DialogDescription>Preencha os dados do candidato contratado para gerar um link único de admissão.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Campos obrigatórios genéricos */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Campos Obrigatórios (todos os cargos)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome Completo *</Label><Input value={nomeCandidato} onChange={(e) => setNomeCandidato(e.target.value)} placeholder="Nome do candidato" /></div>
                <div><Label>E-mail *</Label><Input type="email" value={emailCandidato} onChange={(e) => setEmailCandidato(e.target.value)} placeholder="email@exemplo.com" /></div>
                <div>
                  <Label>Cargo *</Label>
                  <Input value={cargoCandidato} onChange={(e) => setCargoCandidato(e.target.value)} placeholder="Ex: Designer Gráfico" />
                </div>
                <div>
                  <Label>Unidade *</Label>
                  <Select value={unidadeCandidato} onValueChange={setUnidadeCandidato}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POA">POA</SelectItem>
                      <SelectItem value="SP">SP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label>Expiração do Link</Label>
                <Select value={expiracao} onValueChange={setExpiracao}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos específicos opcionais */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Campos Específicos do Perfil (opcionais / N/D)
                </h3>
                <Button variant="outline" size="sm" onClick={addCampoExtra}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Campo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Adicione campos específicos para este cargo. O candidato poderá marcar "N/D" caso não se aplique.
              </p>

              {camposExtras.length === 0 && (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
                  Nenhum campo adicional. Clique em "Adicionar Campo" para campos específicos do perfil.
                </div>
              )}

              <div className="space-y-3">
                {camposExtras.map((campo) => (
                  <div key={campo.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <Input
                      placeholder="Nome do campo"
                      value={campo.nome}
                      onChange={(e) => updateCampoExtra(campo.id, "nome", e.target.value)}
                      className="flex-1"
                    />
                    <Select value={campo.tipo} onValueChange={(v) => updateCampoExtra(campo.id, "tipo", v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="texto">Texto</SelectItem>
                        <SelectItem value="numero">Número</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="selecao">Seleção</SelectItem>
                        <SelectItem value="arquivo">Arquivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={campo.obrigatorio}
                        onCheckedChange={(v) => updateCampoExtra(campo.id, "obrigatorio", v)}
                      />
                      <Label className="text-xs whitespace-nowrap">{campo.obrigatorio ? "Obrigatório" : "N/D permitido"}</Label>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCampoExtra(campo.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={gerarLink}><Link2 className="h-4 w-4 mr-2" /> Gerar Link e Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerarLinkPage;
