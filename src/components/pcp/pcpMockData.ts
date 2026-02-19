export interface PCPTag {
  color: string;
  label?: string;
}

export interface PCPCard {
  id: string;
  title: string;
  description?: string;
  tags: PCPTag[];
  date?: string;
  comments?: number;
  attachments?: number;
  hasWatcher?: boolean;
  hasLock?: boolean;
  hasList?: boolean;
  done?: boolean;
  overdue?: boolean;
  responsible?: string;
  subSectionId?: string;
  columnId?: string;
}

export interface PCPSubSection {
  id: string;
  label: string;
  color: string;
  textColor?: string;
  cards: PCPCard[];
}

export interface PCPColumn {
  id: string;
  title: string;
  subSections: PCPSubSection[];
}

// Empty columns — Holdprint data fills these at runtime
export const initialPcpColumns: PCPColumn[] = [
  {
    id: "aguardando",
    title: "AGUARDANDO/APROVADO",
    subSections: [
      { id: "ag-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
      { id: "ag-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
      { id: "ag-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
    ],
  },
  {
    id: "ocorrencias",
    title: "OCORRÊNCIAS",
    subSections: [
      { id: "oc-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
      { id: "oc-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
      { id: "oc-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
    ],
  },
  {
    id: "arte-final",
    title: "TIME FECHAMENTO - ARTE FINAL",
    subSections: [
      { id: "af-verificacao", label: "VERIFICAÇÃO", color: "bg-red-400", cards: [] },
      { id: "af-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
      { id: "af-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
      { id: "af-aprovacao", label: "AGUARDA APROVAÇÃO DE AMOSTRA", color: "bg-gray-300", textColor: "text-gray-800", cards: [] },
      { id: "af-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
    ],
  },
  {
    id: "gerenciamento",
    title: "TIME GERENCIAMENTO DE MATERIAIS",
    subSections: [
      { id: "gm-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
      { id: "gm-estoque", label: "VALIDANDO ESTOQUE", color: "bg-orange-400", textColor: "text-orange-900", cards: [] },
      { id: "gm-aguardando", label: "AGUARDANDO MATERIAL", color: "bg-cyan-300", textColor: "text-cyan-900", cards: [] },
      { id: "gm-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
      { id: "gm-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
    ],
  },
  {
    id: "impressao",
    title: "TIME IMPRESSÃO - NINA CUT",
    subSections: [
      { id: "im-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
      { id: "im-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
      { id: "im-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
    ],
  },
  {
    id: "projetos",
    title: "TIME DE PROJETOS",
    subSections: [
      { id: "pj-afazer", label: "A FAZER", color: "bg-red-400", cards: [] },
      { id: "pj-fazendo", label: "FAZENDO", color: "bg-yellow-300", textColor: "text-yellow-900", cards: [] },
      { id: "pj-concluido", label: "CONCLUÍDO", color: "bg-green-400", textColor: "text-green-900", cards: [] },
    ],
  },
];
