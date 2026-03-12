import React, { useState } from "react";
import { Archive, Trash2, Pencil, X, CheckSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useActiveBoards } from "@/hooks/useBoards";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Job } from "./types";

interface Props {
  selectedIds: Set<string>;
  allJobs: Job[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalVisible: number;
  onBulkArchive: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onRename: (id: string, newTitle: string) => void;
  isArchiving?: boolean;
  isDeleting?: boolean;
}

const BulkActionBar: React.FC<Props> = ({
  selectedIds, allJobs, onClearSelection, onSelectAll, totalVisible,
  onBulkArchive, onBulkDelete, onRename, isArchiving, isDeleting,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showMirrorDialog, setShowMirrorDialog] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [mirrorBoardIds, setMirrorBoardIds] = useState<Set<string>>(new Set());
  const [isMirroring, setIsMirroring] = useState(false);

  const { data: activeBoards = [] } = useActiveBoards();
  const queryClient = useQueryClient();

  const selectedArr = Array.from(selectedIds);
  const count = selectedArr.length;
  if (count === 0) return null;

  const singleJob = count === 1 ? allJobs.find(j => j.id === selectedArr[0]) : null;

  const handleRenameOpen = () => {
    if (singleJob) {
      setRenameValue(singleJob.description || "");
    }
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = () => {
    if (singleJob && renameValue.trim()) {
      onRename(singleJob.id, renameValue.trim());
    }
    setShowRenameDialog(false);
    setRenameValue("");
  };

  const toggleMirrorBoard = (boardId: string) => {
    setMirrorBoardIds(prev => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  };

  const handleMirrorOpen = () => {
    setMirrorBoardIds(new Set());
    setShowMirrorDialog(true);
  };

  const handleMirrorConfirm = async () => {
    if (mirrorBoardIds.size === 0) return;
    setIsMirroring(true);

    try {
      const selectedJobs = allJobs.filter(j => selectedIds.has(j.id));
      const targetBoards = activeBoards.filter(b => mirrorBoardIds.has(b.id));

      const rows = selectedJobs.flatMap(job =>
        targetBoards.map(board => ({
          job_id: job.id,
          job_code: job.code || null,
          job_title: job.description || job.title || null,
          customer_name: job.client_name || null,
          board_id: board.id,
          board_name: board.name,
          stage_id: board.stages[0]?.id || null,
          stage_name: board.stages[0]?.name || null,
          assigned_by: "Sistema",
          is_active: true,
        }))
      );

      // Check existing active assignments to avoid duplicates
      const { data: existing } = await supabase
        .from("job_board_assignments")
        .select("job_id, board_id")
        .eq("is_active", true)
        .in("job_id", selectedJobs.map(j => j.id))
        .in("board_id", targetBoards.map(b => b.id));

      const existingSet = new Set(
        (existing || []).map(e => `${e.job_id}__${e.board_id}`)
      );
      const newRows = rows.filter(r => !existingSet.has(`${r.job_id}__${r.board_id}`));

      if (newRows.length > 0) {
        const { error } = await supabase
          .from("job_board_assignments")
          .insert(newRows);
        if (error) throw error;
      }

      const skipped = rows.length - newRows.length;
      toast({
        title: "Espelhamento concluído",
        description: `${newRows.length} atribuição(ões) criada(s)${skipped > 0 ? `, ${skipped} já existiam` : ""}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["all-board-assignments-badges"] });
      queryClient.invalidateQueries({ queryKey: ["board-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["job-assignments"] });

      setShowMirrorDialog(false);
      onClearSelection();
    } catch (err) {
      console.error("Mirror error:", err);
      toast({ title: "Erro ao espelhar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsMirroring(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="bg-[#1a2332] text-white rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-white/10">
          {/* Count + selection controls */}
          <div className="flex items-center gap-2 border-r border-white/20 pr-3">
            <span className="bg-[#1DB899] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {count}
            </span>
            <span className="text-xs text-white/80">selecionado{count > 1 ? "s" : ""}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={onSelectAll}
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 gap-1 text-xs">
            <CheckSquare className="h-3.5 w-3.5" />
            {selectedIds.size === totalVisible ? "Desel. todos" : "Sel. todos"}
          </Button>

          <div className="w-px h-6 bg-white/20" />

          {/* Actions */}
          <Button variant="ghost" size="sm" onClick={handleMirrorOpen}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 gap-1 text-xs">
            <Copy className="h-3.5 w-3.5" />
            Espelhar Board
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onBulkArchive(selectedArr)}
            disabled={isArchiving}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 gap-1 text-xs">
            <Archive className="h-3.5 w-3.5" />
            Arquivar
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 gap-1 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Deletar
          </Button>

          <Button variant="ghost" size="sm" onClick={handleRenameOpen}
            disabled={count !== 1}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 gap-1 text-xs disabled:opacity-30">
            <Pencil className="h-3.5 w-3.5" />
            Renomear
          </Button>

          <div className="w-px h-6 bg-white/20" />

          <Button variant="ghost" size="icon" onClick={onClearSelection}
            className="text-white/50 hover:text-white hover:bg-white/10 h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar {count} job{count > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá os jobs selecionados do cache local. Como a integração é somente leitura, eles poderão reaparecer na próxima sincronização. Para ocultá-los permanentemente, use "Arquivar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => { onBulkDelete(selectedArr); setShowDeleteConfirm(false); }}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              Altere o título do job localmente. A alteração não será enviada ao ERP (somente leitura).
            </p>
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              placeholder="Novo título do job"
              onKeyDown={e => { if (e.key === "Enter") handleRenameConfirm(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancelar</Button>
            <Button onClick={handleRenameConfirm} disabled={!renameValue.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mirror Board Dialog */}
      <Dialog open={showMirrorDialog} onOpenChange={setShowMirrorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Espelhar para Boards</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Selecione os boards para onde os {count} job{count > 1 ? "s" : ""} selecionado{count > 1 ? "s" : ""} serão espelhados. Os jobs aparecerão na primeira etapa de cada board selecionado.
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {activeBoards.map(board => (
                <label
                  key={board.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={mirrorBoardIds.has(board.id)}
                    onCheckedChange={() => toggleMirrorBoard(board.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: board.color }}
                  />
                  <span className="text-sm font-medium">{board.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {board.stages.length} etapas
                  </span>
                </label>
              ))}
              {activeBoards.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum board ativo encontrado.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMirrorDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleMirrorConfirm}
              disabled={mirrorBoardIds.size === 0 || isMirroring}
            >
              {isMirroring ? "Espelhando..." : `Espelhar para ${mirrorBoardIds.size} board${mirrorBoardIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActionBar;
