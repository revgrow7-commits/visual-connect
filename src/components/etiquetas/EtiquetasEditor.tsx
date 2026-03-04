import React, { useState } from "react";
import {
  useEtiquetas,
  useCreateEtiqueta,
  useUpdateEtiqueta,
  useDeleteEtiqueta,
  useEtiquetasHistorico,
  ETIQUETA_COLORS,
  etiquetaCorToBg,
  type Etiqueta,
} from "@/hooks/useEtiquetas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, Tag, History, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const EtiquetasEditor: React.FC = () => {
  const { data: etiquetas, isLoading } = useEtiquetas();
  const { data: historico, isLoading: loadingHist } = useEtiquetasHistorico();
  const createEtiqueta = useCreateEtiqueta();
  const updateEtiqueta = useUpdateEtiqueta();
  const deleteEtiqueta = useDeleteEtiqueta();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formNome, setFormNome] = useState("");
  const [formCor, setFormCor] = useState("blue");
  const [formDesc, setFormDesc] = useState("");

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setFormNome("");
    setFormCor("blue");
    setFormDesc("");
  };

  const startEdit = (et: Etiqueta) => {
    setEditingId(et.id);
    setCreating(false);
    setFormNome(et.nome);
    setFormCor(et.cor);
    setFormDesc(et.descricao || "");
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setFormNome("");
  };

  const handleCreate = () => {
    if (!formNome.trim()) return;
    createEtiqueta.mutate(
      { nome: formNome.trim(), cor: formCor, descricao: formDesc.trim() || undefined },
      { onSuccess: cancel }
    );
  };

  const handleUpdate = () => {
    if (!editingId || !formNome.trim()) return;
    const original = etiquetas?.find((e) => e.id === editingId);
    if (!original) return;
    updateEtiqueta.mutate(
      {
        id: editingId,
        dados_anteriores: { nome: original.nome, cor: original.cor, descricao: original.descricao },
        nome: formNome.trim(),
        cor: formCor,
        descricao: formDesc.trim() || undefined,
      },
      { onSuccess: cancel }
    );
  };

  const handleDelete = (et: Etiqueta) => {
    if (!confirm(`Excluir etiqueta "${et.nome}"?`)) return;
    deleteEtiqueta.mutate(et);
  };

  const acaoLabel: Record<string, { text: string; color: string }> = {
    criada: { text: "Criada", color: "bg-green-100 text-green-800" },
    editada: { text: "Editada", color: "bg-blue-100 text-blue-800" },
    excluida: { text: "Excluída", color: "bg-red-100 text-red-800" },
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Tag className="h-5 w-5" /> Editor de Etiquetas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="etiquetas">
          <TabsList className="bg-white/10 mb-4">
            <TabsTrigger value="etiquetas" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20">
              <Tag className="h-3.5 w-3.5 mr-1.5" /> Etiquetas
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20">
              <History className="h-3.5 w-3.5 mr-1.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="etiquetas" className="space-y-4">
            {/* Existing labels */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-white/50" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(etiquetas || []).map((et) =>
                  editingId === et.id ? (
                    <div key={et.id} className="col-span-full bg-white/10 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">Editar etiqueta</span>
                        <button onClick={cancel} className="text-white/50 hover:text-white">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Input
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        placeholder="Nome..."
                        className="bg-white/10 border-white/20 text-white h-8 text-sm"
                        autoFocus
                      />
                      <Input
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Descrição (opcional)..."
                        className="bg-white/10 border-white/20 text-white h-8 text-sm"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {ETIQUETA_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setFormCor(c.value)}
                            className={`h-7 w-7 rounded-full ${c.bg} ${formCor === c.value ? "ring-2 ring-offset-1 ring-offset-[#0d1117] ring-white" : ""} hover:opacity-80 transition-all`}
                            title={c.label}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdate} disabled={updateEtiqueta.isPending} className="text-xs">
                          {updateEtiqueta.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                          Salvar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(et)} disabled={deleteEtiqueta.isPending} className="text-xs">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={et.id} className="group relative">
                      <button
                        className={`w-full h-9 rounded-lg px-3 text-sm font-semibold text-white truncate ${etiquetaCorToBg(et.cor)} hover:opacity-90 transition-opacity`}
                      >
                        {et.nome}
                      </button>
                      <button
                        onClick={() => startEdit(et)}
                        className="absolute top-1 right-1 p-1 bg-black/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Create form */}
            {creating ? (
              <div className="bg-white/10 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Nova etiqueta</span>
                  <button onClick={cancel} className="text-white/50 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Nome da etiqueta..."
                  className="bg-white/10 border-white/20 text-white h-8 text-sm"
                  autoFocus
                />
                <Input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Descrição (opcional)..."
                  className="bg-white/10 border-white/20 text-white h-8 text-sm"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {ETIQUETA_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFormCor(c.value)}
                      className={`h-7 w-7 rounded-full ${c.bg} ${formCor === c.value ? "ring-2 ring-offset-1 ring-offset-[#0d1117] ring-white" : ""} hover:opacity-80 transition-all`}
                      title={c.label}
                    />
                  ))}
                </div>
                <Button size="sm" onClick={handleCreate} disabled={createEtiqueta.isPending} className="text-xs">
                  {createEtiqueta.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  Criar Etiqueta
                </Button>
              </div>
            ) : (
              <Button onClick={startCreate} variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova Etiqueta
              </Button>
            )}
          </TabsContent>

          <TabsContent value="historico">
            {loadingHist ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-white/50" />
              </div>
            ) : !historico?.length ? (
              <p className="text-white/40 text-sm text-center py-6">Nenhum registro no histórico</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {historico.map((h) => {
                  const info = acaoLabel[h.acao] || { text: h.acao, color: "bg-gray-100 text-gray-800" };
                  const dados = (h.dados_novos || h.dados_anteriores) as Record<string, unknown> | null;
                  return (
                    <div key={h.id} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                      <Badge className={`${info.color} text-[10px] shrink-0`}>{info.text}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {(dados?.nome as string) || "Etiqueta"}
                        </p>
                        {dados?.cor && (
                          <div className={`inline-block h-3 w-8 rounded mt-1 ${etiquetaCorToBg(dados.cor as string)}`} />
                        )}
                      </div>
                      <span className="text-white/40 text-[10px] shrink-0">
                        {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EtiquetasEditor;
