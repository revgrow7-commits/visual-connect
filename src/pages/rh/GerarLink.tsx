import { useState, useEffect } from "react";
import { Link2, Copy, CheckCircle2, Plus, Trash2, Send, Loader2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ativo: { label: "Ativo", variant: "default" },
  preenchido: { label: "Preenchido", variant: "secondary" },
  expirado: { label: "Expirado", variant: "destructive" },
};

const GerarLinkPage = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [links, setLinks] = useState<LinkGerado[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Form state — dados do candidato
  const [nomeCandidato, setNomeCandidato] = useState("");
  const [emailCandidato, setEmailCandidato] = useState("");
  const [expiracao, setExpiracao] = useState("7");

  // 10 campos de contratação
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [unidade, setUnidade] = useState("");
  const [tipoContratacao, setTipoContratacao] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [jornada, setJornada] = useState("44h semanais");
  const [horario, setHorario] = useState("08:00 às 17:48");
  const [escala, setEscala] = useState("");
  const [salarioBase, setSalarioBase] = useState("");
  const [adicionais, setAdicionais] = useState("");

  // Campos extras
  const [camposExtras, setCamposExtras] = useState<CampoPersonalizado[]>([]);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recruitment_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLinks(
        data.map((d) => ({
          id: d.id,
          candidato: d.candidato_nome,
          email: d.candidato_email,
          cargo: d.cargo,
          unidade: d.unidade,
          token: d.token,
          criadoEm: new Date(d.created_at).toLocaleDateString("pt-BR"),
          expiraEm: new Date(d.expira_em).toLocaleDateString("pt-BR"),
          status: (new Date(d.expira_em) < new Date() && d.status === "ativo" ? "expirado" : d.status) as any,
        }))
      );
    }
    setLoading(false);
  };

  const addCampoExtra = () => {
    setCamposExtras((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", tipo: "texto", obrigatorio: false },
    ]);
  };

  const removeCampoExtra = (id: string) => setCamposExtras((prev) => prev.filter((c) => c.id !== id));

  const updateCampoExtra = (id: string, field: keyof CampoPersonalizado, value: any) => {
    setCamposExtras((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const resetForm = () => {
    setNomeCandidato(""); setEmailCandidato(""); setExpiracao("7");
    setCargo(""); setSetor(""); setUnidade(""); setTipoContratacao("");
    setDataAdmissao(""); setJornada("44h semanais"); setHorario("08:00 às 17:48");
    setEscala(""); setSalarioBase(""); setAdicionais("");
    setCamposExtras([]);
  };

  const gerarLink = async () => {
    if (!nomeCandidato || !emailCandidato || !cargo || !unidade) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome, e-mail, cargo e unidade.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const token = crypto.randomUUID();
    const hoje = new Date();
    const expira = new Date(hoje);
    expira.setDate(expira.getDate() + parseInt(expiracao));

    const { data, error } = await supabase.from("recruitment_links").insert([{
      candidato_nome: nomeCandidato,
      candidato_email: emailCandidato,
      cargo,
      unidade,
      setor: setor || null,
      tipo_contratacao: tipoContratacao || null,
      data_admissao: dataAdmissao || null,
      jornada: jornada || null,
      horario: horario || null,
      escala: escala || null,
      salario_base: salarioBase || null,
      adicionais: adicionais || null,
      token,
      expira_em: expira.toISOString(),
      status: "ativo",
      campos_extras: camposExtras as any,
    }]).select().single();

    if (error || !data) {
      toast({ title: "Erro ao gerar link", description: "Não foi possível salvar. Tente novamente.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Send email
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("send-recruitment-email", {
        body: {
          candidatoNome: nomeCandidato,
          candidatoEmail: emailCandidato,
          cargo,
          unidade,
          token,
          expiraEm: expira.toISOString(),
        },
      });

      if (res.error) {
        toast({ title: "Link gerado!", description: "Link criado, mas o e-mail não pôde ser enviado. Copie e envie manualmente.", variant: "default" });
      } else {
        toast({ title: "Link gerado e e-mail enviado!", description: `Formulário enviado para ${emailCandidato}.` });
      }
    } catch {
      toast({ title: "Link gerado!", description: "Link criado, mas houve erro ao enviar o e-mail." });
    }

    await fetchLinks();
    setDialogOpen(false);
    resetForm();
    setSubmitting(false);
  };

  const resendEmail = async (link: LinkGerado) => {
    setSendingEmailId(link.id);
    try {
      const res = await supabase.functions.invoke("send-recruitment-email", {
        body: {
          candidatoNome: link.candidato,
          candidatoEmail: link.email,
          cargo: link.cargo,
          unidade: link.unidade,
          token: link.token,
          expiraEm: link.expiraEm,
        },
      });
      if (res.error) {
        toast({ title: "Erro ao enviar", description: "Não foi possível reenviar o e-mail.", variant: "destructive" });
      } else {
        toast({ title: "E-mail reenviado!", description: `Formulário reenviado para ${link.email}.` });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao reenviar e-mail.", variant: "destructive" });
    }
    setSendingEmailId(null);
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/formulario/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerar Link de Formulário</h1>
          <p className="text-muted-foreground text-sm">Crie links únicos para candidatos preencherem o formulário de admissão.</p>
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
                  <TableHead>Criado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : links.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum link gerado ainda.</TableCell></TableRow>
                ) : links.map((l) => {
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
                            {copiedId === l.id ? "Copiado" : "Copiar"}
                          </Button>
                          {l.status === "ativo" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resendEmail(l)} disabled={sendingEmailId === l.id}>
                              {sendingEmailId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Link de Formulário</DialogTitle>
            <DialogDescription>Preencha os dados de contratação. O candidato receberá um e-mail com o link do formulário.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Dados do candidato */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Dados do Candidato
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome Completo *</Label><Input value={nomeCandidato} onChange={(e) => setNomeCandidato(e.target.value)} placeholder="Nome do candidato" /></div>
                <div><Label>E-mail *</Label><Input type="email" value={emailCandidato} onChange={(e) => setEmailCandidato(e.target.value)} placeholder="email@exemplo.com" /></div>
              </div>
            </div>

            <Separator />

            {/* 10 campos de contratação */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Dados de Contratação (10 campos)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cargo / Função *</Label>
                  <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Designer Gráfico" />
                </div>
                <div>
                  <Label>Setor / Departamento</Label>
                  <Input value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex: Marketing" />
                </div>
                <div>
                  <Label>Unidade *</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POA">Porto Alegre</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Contratação</Label>
                  <Select value={tipoContratacao} onValueChange={setTipoContratacao}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="PJ">PJ</SelectItem>
                      <SelectItem value="Estágio">Estágio</SelectItem>
                      <SelectItem value="Temporário">Temporário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Admissão</Label>
                  <Input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} />
                </div>
                <div>
                  <Label>Jornada</Label>
                  <Input value={jornada} onChange={(e) => setJornada(e.target.value)} placeholder="44h semanais" />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="08:00 às 17:48" />
                </div>
                <div>
                  <Label>Escala</Label>
                  <Input value={escala} onChange={(e) => setEscala(e.target.value)} placeholder="Ex: 12x36 (se houver)" />
                </div>
                <div>
                  <Label>Salário Base</Label>
                  <Input value={salarioBase} onChange={(e) => setSalarioBase(e.target.value)} placeholder="R$ 0,00" />
                </div>
                <div>
                  <Label>Adicionais</Label>
                  <Input value={adicionais} onChange={(e) => setAdicionais(e.target.value)} placeholder="Ex: Periculosidade 30%" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Expiração */}
            <div>
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

            <Separator />

            {/* Campos extras opcionais */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Campos Específicos (opcionais / N/D)
                </h3>
                <Button variant="outline" size="sm" onClick={addCampoExtra}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>

              {camposExtras.length === 0 ? (
                <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground text-sm">
                  Nenhum campo adicional. Clique em "Adicionar" para campos específicos do perfil.
                </div>
              ) : (
                <div className="space-y-3">
                  {camposExtras.map((campo) => (
                    <div key={campo.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <Input placeholder="Nome do campo" value={campo.nome} onChange={(e) => updateCampoExtra(campo.id, "nome", e.target.value)} className="flex-1" />
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
                        <Switch checked={campo.obrigatorio} onCheckedChange={(v) => updateCampoExtra(campo.id, "obrigatorio", v)} />
                        <Label className="text-xs whitespace-nowrap">{campo.obrigatorio ? "Obrigatório" : "N/D"}</Label>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCampoExtra(campo.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={gerarLink} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {submitting ? "Gerando..." : "Gerar Link e Enviar por E-mail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerarLinkPage;
