import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Upload, FileText, Image, Table2, Loader2, Trash2, Database, File,
  CheckCircle2, Clock
} from "lucide-react";

interface SectorDadosProps {
  sector: string;
  sectorLabel: string;
}

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.txt";

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: Table2,
  xlsx: Table2,
  csv: Table2,
  png: Image,
  jpg: Image,
  jpeg: Image,
  webp: Image,
  txt: File,
};

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const SectorDados = ({ sector, sectorLabel }: SectorDadosProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch RAG files for this sector
  const { data: ragFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ["rag-files", sector],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rag_files")
        .select("*")
        .eq("sector", sector)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch holdprint cache for this sector
  const { data: holdprintData, isLoading: loadingHoldprint } = useQuery({
    queryKey: ["holdprint-sector", sector],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("holdprint_cache")
        .select("endpoint, content_text, last_synced", { count: "exact" })
        .order("last_synced", { ascending: false })
        .limit(20);
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
  });

  // Upload file
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = getExt(file.name);
        const path = `${sector}/${user.id}/${Date.now()}-${file.name}`;

        // Upload to storage
        const { error: uploadErr } = await supabase.storage
          .from("rag-documents")
          .upload(path, file);

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("rag-documents")
          .getPublicUrl(path);

        // Register in rag_files
        const { error: insertErr } = await supabase.from("rag_files").insert({
          filename: file.name,
          file_type: ext,
          file_url: urlData.publicUrl || path,
          sector,
          file_size: file.size,
          uploaded_by: user.id,
          tags: [sector],
        });

        if (insertErr) throw insertErr;
      }

      toast({ title: "Upload concluído", description: `${files.length} arquivo(s) enviados para base RAG.` });
      queryClient.invalidateQueries({ queryKey: ["rag-files", sector] });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload de Documentos — Base RAG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Envie PDFs, planilhas, documentos Word ou imagens para alimentar a base de conhecimento do agente de {sectorLabel}.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !user}
            className="w-full border-dashed"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Selecionar arquivos</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs: RAG docs vs Holdprint */}
      <Tabs defaultValue="rag" className="w-full">
        <TabsList>
          <TabsTrigger value="rag" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Documentos RAG ({ragFiles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="holdprint" className="gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5" /> Holdprint ({holdprintData?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rag" className="mt-3">
          {loadingFiles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ragFiles && ragFiles.length > 0 ? (
            <div className="space-y-2">
              {ragFiles.map((f) => {
                const Icon = FILE_ICONS[f.file_type] || File;
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.file_size ? formatSize(f.file_size) : "—"} · {new Date(f.created_at!).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={f.processed ? "default" : "secondary"} className="text-[10px] shrink-0">
                      {f.processed ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Processado</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                      )}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum documento enviado para {sectorLabel}.</p>
              <p className="text-xs mt-1">Faça upload acima para alimentar o agente.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="holdprint" className="mt-3">
          {loadingHoldprint ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : holdprintData && holdprintData.items.length > 0 ? (
            <div className="space-y-2">
              {holdprintData.items.map((item, i) => (
                <div
                  key={i}
                  className="text-xs bg-muted/50 rounded-lg px-3 py-2 flex items-start gap-2"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                    {item.endpoint}
                  </Badge>
                  <span className="text-muted-foreground">{item.content_text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum dado Holdprint sincronizado ainda.</p>
              <p className="text-xs mt-1">A sincronização automática populará os dados aqui.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SectorDados;
