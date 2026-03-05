import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Heart,
  AlertTriangle,
  Upload,
  Send,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TIPOS_RELATO = [
  { id: "problema", label: "Problema", icon: AlertCircle, color: "text-red-500", borderColor: "border-red-500", glowColor: "shadow-red-500/25", bgActive: "bg-red-50" },
  { id: "sugestao", label: "Sugestão", icon: Lightbulb, color: "text-blue-500", borderColor: "border-blue-500", glowColor: "shadow-blue-500/25", bgActive: "bg-blue-50" },
  { id: "melhoria", label: "Melhoria", icon: TrendingUp, color: "text-green-500", borderColor: "border-green-500", glowColor: "shadow-green-500/25", bgActive: "bg-green-50" },
  { id: "elogio", label: "Elogio", icon: Heart, color: "text-purple-500", borderColor: "border-purple-500", glowColor: "shadow-purple-500/25", bgActive: "bg-purple-50" },
  { id: "alerta", label: "Alerta", icon: AlertTriangle, color: "text-orange-500", borderColor: "border-orange-500", glowColor: "shadow-orange-500/25", bgActive: "bg-orange-50" },
];

const CATEGORIAS = [
  "Almoxarifado", "Compras", "Conferência", "Denúncias",
  "Fechamento de arquivos e Projetos", "Financeiro", "Gestores",
  "Impressão", "Infraestrutura", "Instalação", "PDV", "RH", "Vendas",
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf", "video/mp4", "video/webm"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TITULO = 200;

const categoriaMap: Record<string, string> = {
  problema: "incidente_operacional",
  sugestao: "sugestao_estrategica",
  melhoria: "sugestao_estrategica",
  elogio: "clima_cultura",
  alerta: "incidente_critico",
};

const urgenciaMap: Record<string, string> = {
  baixa: "baixa",
  media: "media",
  alta: "alta",
};

const OuvidoriaForm = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipoRelato, setTipoRelato] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [anonimo, setAnonimo] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolo, setProtocolo] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast({ title: "Tipo não suportado", description: `${f.name} não é aceito.`, variant: "destructive" });
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "Arquivo muito grande", description: `${f.name} excede 20MB.`, variant: "destructive" });
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const valid = dropped.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const isFormValid = tipoRelato && titulo.trim().length >= 3 && descricao.trim().length >= 10 && categoria;

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast({ title: "Preencha todos os campos obrigatórios", description: "Tipo, título (mín. 3 chars), descrição (mín. 10 chars) e categoria são obrigatórios.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Autenticação necessária", description: "Faça login para enviar.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Upload files
      const anexoUrls: string[] = [];
      for (const file of files) {
        const path = `${user.id}/${crypto.randomUUID()}/${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("ouvidoria-anexos").upload(path, file);
        if (uploadErr) {
          toast({ title: "Erro no upload", description: `${file.name}: ${uploadErr.message}`, variant: "destructive" });
          setSubmitting(false);
          return;
        }
        anexoUrls.push(path);
      }

      const { data, error } = await supabase
        .from("ouvidoria_manifestacoes")
        .insert({
          unidade: "Geral",
          setor: categoria,
          categoria: categoriaMap[tipoRelato] || "clima_cultura",
          anonimo,
          nome: anonimo ? null : null,
          email: null,
          setor_identificacao: null,
          unidade_identificacao: null,
          descricao: `[Tipo: ${tipoRelato.charAt(0).toUpperCase() + tipoRelato.slice(1)}] [Título: ${titulo.trim()}]\n\n${descricao.trim()}${anexoUrls.length > 0 ? `\n\n[Anexos: ${anexoUrls.join(", ")}]` : ""}`,
          urgencia: urgenciaMap[prioridade] || "media",
          user_id: user.id,
          protocolo: "temp",
        } as any)
        .select("protocolo")
        .single();

      if (error) throw error;
      setProtocolo(data.protocolo);
      setSubmitted(true);
      toast({ title: "Relato enviado com sucesso!" });
    } catch (err: any) {
      console.error("Ouvidoria submit error:", err);
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setTipoRelato("");
    setTitulo("");
    setDescricao("");
    setCategoria("");
    setPrioridade("media");
    setAnonimo(false);
    setFiles([]);
    setProtocolo("");
  };

  if (submitted) {
    return (
      <section>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900">Relato Enviado</h3>
            <p className="text-gray-600">
              Protocolo: <span className="font-mono font-bold text-gray-900">{protocolo}</span>
            </p>
            <p className="text-sm text-gray-500">Seu relato foi registrado e será analisado pela equipe responsável.</p>
            <Button variant="outline" onClick={resetForm} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Novo Relato
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Novo Relato</h2>
              <p className="text-sm text-gray-400">
                Registre sua manifestação de forma segura e confidencial.
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-7">
          {/* Tipo do Relato */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-500">Tipo do Relato</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TIPOS_RELATO.map((tipo) => {
                const Icon = tipo.icon;
                const isActive = tipoRelato === tipo.id;
                return (
                  <button
                    key={tipo.id}
                    onClick={() => setTipoRelato(tipo.id)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                      isActive
                        ? `${tipo.borderColor} ${tipo.bgActive} shadow-lg ${tipo.glowColor}`
                        : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <Icon className={cn("h-7 w-7", isActive ? tipo.color : "text-gray-400")} />
                    <span className={cn("text-xs font-medium", isActive ? "text-gray-900" : "text-gray-500")}>
                      {tipo.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {!tipoRelato && (
              <p className="text-xs text-gray-400">Selecione o tipo do seu relato para continuar.</p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-500">Título</Label>
              <span className="text-xs text-gray-400">{titulo.length}/{MAX_TITULO}</span>
            </div>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.slice(0, MAX_TITULO))}
              placeholder="Resuma o relato em uma frase..."
              className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-500">Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a situação com o máximo de detalhes possível..."
              className="min-h-[140px] bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
              maxLength={5000}
            />
            <div className="flex justify-between text-xs">
              <span className={descricao.length < 10 ? "text-red-400" : "text-green-500"}>
                {descricao.length < 10 ? `Mínimo 10 caracteres` : "✓ OK"}
              </span>
              <span className="text-gray-400">{descricao.length}/5000</span>
            </div>
          </div>

          {/* Categoria + Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-500">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-500">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-500">Anexos (opcional)</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer bg-gray-50/50"
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF ou Vídeo (máx. 20MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <span className="truncate text-gray-700">{f.name} ({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 ml-2 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anonimato */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <Checkbox
              id="anonimo"
              checked={anonimo}
              onCheckedChange={(v) => setAnonimo(v === true)}
              className="mt-0.5"
            />
            <div>
              <label htmlFor="anonimo" className="text-sm font-medium text-gray-700 cursor-pointer">
                Enviar de forma anônima
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                Sua identidade ficará visível apenas para Admin e Segurança.
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={resetForm} disabled={submitting} className="border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !isFormValid}
              className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Relato
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default OuvidoriaForm;
