import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  descricao: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EtiquetaHistorico {
  id: string;
  etiqueta_id: string | null;
  acao: string;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  executado_por: string | null;
  created_at: string;
}

const AVAILABLE_COLORS = [
  { value: "green", label: "Verde", bg: "bg-green-500" },
  { value: "yellow", label: "Amarelo", bg: "bg-yellow-400" },
  { value: "orange", label: "Laranja", bg: "bg-orange-500" },
  { value: "red", label: "Vermelho", bg: "bg-red-500" },
  { value: "purple", label: "Roxo", bg: "bg-purple-500" },
  { value: "blue", label: "Azul", bg: "bg-blue-500" },
  { value: "sky", label: "Celeste", bg: "bg-sky-400" },
  { value: "lime", label: "Lima", bg: "bg-lime-500" },
  { value: "pink", label: "Rosa", bg: "bg-pink-500" },
  { value: "black", label: "Preto", bg: "bg-gray-800" },
];

export const ETIQUETA_COLORS = AVAILABLE_COLORS;

export function etiquetaCorToBg(cor: string): string {
  const found = AVAILABLE_COLORS.find((c) => c.value === cor);
  return found?.bg || "bg-gray-400";
}

export function useEtiquetas() {
  return useQuery({
    queryKey: ["etiquetas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("etiquetas")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Etiqueta[];
    },
  });
}

export function useEtiquetasHistorico(limit = 50) {
  return useQuery({
    queryKey: ["etiquetas-historico", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("etiquetas_historico")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as EtiquetaHistorico[];
    },
  });
}

export function useCreateEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; cor: string; descricao?: string }) => {
      const { data, error } = await (supabase as any)
        .from("etiquetas")
        .insert({ nome: input.nome, cor: input.cor, descricao: input.descricao || null })
        .select()
        .single();
      if (error) throw error;

      // Log history
      await (supabase as any).from("etiquetas_historico").insert({
        etiqueta_id: data.id,
        acao: "criada",
        dados_novos: { nome: data.nome, cor: data.cor, descricao: data.descricao },
      });

      return data as Etiqueta;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etiquetas"] });
      qc.invalidateQueries({ queryKey: ["etiquetas-historico"] });
      toast.success("Etiqueta criada com sucesso");
    },
    onError: (e: Error) => toast.error("Erro ao criar etiqueta: " + e.message),
  });
}

export function useUpdateEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados_anteriores, ...updates }: { id: string; dados_anteriores: Partial<Etiqueta>; nome?: string; cor?: string; descricao?: string; ativa?: boolean }) => {
      const { data, error } = await (supabase as any)
        .from("etiquetas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      await (supabase as any).from("etiquetas_historico").insert({
        etiqueta_id: id,
        acao: "editada",
        dados_anteriores,
        dados_novos: updates,
      });

      return data as Etiqueta;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etiquetas"] });
      qc.invalidateQueries({ queryKey: ["etiquetas-historico"] });
      toast.success("Etiqueta atualizada");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
}

export function useDeleteEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (etiqueta: Etiqueta) => {
      // Log before delete
      await (supabase as any).from("etiquetas_historico").insert({
        etiqueta_id: etiqueta.id,
        acao: "excluida",
        dados_anteriores: { nome: etiqueta.nome, cor: etiqueta.cor, descricao: etiqueta.descricao },
      });

      const { error } = await (supabase as any)
        .from("etiquetas")
        .delete()
        .eq("id", etiqueta.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etiquetas"] });
      qc.invalidateQueries({ queryKey: ["etiquetas-historico"] });
      toast.success("Etiqueta excluída");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
