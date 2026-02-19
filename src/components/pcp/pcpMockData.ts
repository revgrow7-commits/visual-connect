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

export const initialPcpColumns: PCPColumn[] = [
  {
    id: "aguardando",
    title: "AGUARDANDO/APROVADO",
    subSections: [
      {
        id: "ag-afazer",
        label: "A FAZER",
        color: "bg-red-400",
        cards: [],
      },
    ],
  },
  {
    id: "ocorrencias",
    title: "OCORRÊNCIAS",
    subSections: [
      {
        id: "oc-cards",
        label: "",
        color: "",
        cards: [
          {
            id: "oc1",
            title: "1774-Sicredi",
            description: "Job de sinalização para agência Sicredi",
            tags: [{ color: "bg-red-500", label: "Urgente" }, { color: "bg-orange-400", label: "Revisão" }],
            hasList: true,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "oc2",
            title: "1690 Dufrio MPDV Hulter",
            description: "Material PDV para Dufrio Hulter",
            tags: [{ color: "bg-red-500", label: "Urgente" }, { color: "bg-red-400", label: "Prioridade" }, { color: "bg-green-400", label: "Aprovado" }],
            comments: 2,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "oc3",
            title: "JOB 1713 COPA GÁS",
            description: "Produção de materiais Copa Gás",
            tags: [{ color: "bg-red-500", label: "Urgente" }, { color: "bg-orange-400", label: "Revisão" }],
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "oc4",
            title: "1823 Eletromídia",
            description: "Painéis digitais Eletromídia",
            tags: [{ color: "bg-red-500", label: "Urgente" }, { color: "bg-red-400", label: "Prioridade" }, { color: "bg-green-400", label: "Aprovado" }],
            comments: 2,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        id: "oc-fazendo",
        label: "FAZENDO",
        color: "bg-yellow-300",
        textColor: "text-yellow-900",
        cards: [],
      },
      {
        id: "oc-concluido",
        label: "CONCLUIDO",
        color: "bg-green-400",
        textColor: "text-green-900",
        cards: [],
      },
    ],
  },
  {
    id: "arte-final",
    title: "TIME FECHAMENTO - ARTE FINAL",
    subSections: [
      {
        id: "af-verificacao",
        label: "VERIFICAÇÃO",
        color: "bg-red-400",
        cards: [],
      },
      {
        id: "af-afazer",
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "af1",
            title: "1954 Asun loja Gravatai",
            description: "Arte final para loja Asun Gravatai",
            tags: [{ color: "bg-blue-500", label: "Design" }, { color: "bg-green-400", label: "Aprovado" }],
            date: "26 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "af2",
            title: "1955 - CESTTO 20.02",
            description: "Fechamento de arte CESTTO",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-green-400", label: "Aprovado" }],
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        id: "af-aprovacao",
        label: "AGUARDA APROVAÇÃO DE AMOSTRA (VIRTUAL/FÍSICA)",
        color: "bg-gray-300",
        textColor: "text-gray-800",
        cards: [
          {
            id: "af3",
            title: "1941 - SESC ANCHIETA - PEÇAS",
            description: "Peças para SESC Anchieta, aguardando aprovação de amostra",
            tags: [{ color: "bg-red-500", label: "Urgente" }, { color: "bg-pink-400", label: "Cliente" }],
            date: "26 de fev.",
            comments: 7,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
    ],
  },
  {
    id: "gerenciamento",
    title: "TIME GERENCIAMENTO DE MATERIAIS",
    subSections: [
      {
        id: "gm-afazer",
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "gm1",
            title: "1955 - CESTTO 20.02",
            description: "Gerenciamento de materiais CESTTO",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-blue-500", label: "Design" }],
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        id: "gm-estoque",
        label: "VALIDANDO ESTOQUE",
        color: "bg-orange-400",
        textColor: "text-orange-900",
        cards: [
          {
            id: "gm2",
            title: "CBF RIO BRANCO ACRE",
            description: "Validação de estoque para CBF Rio Branco",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-red-400", label: "Prioridade" }, { color: "bg-green-400", label: "Aprovado" }],
            hasList: true,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        id: "gm-aguardando",
        label: "AGUARDANDO MATERIAL",
        color: "bg-cyan-300",
        textColor: "text-cyan-900",
        cards: [
          {
            id: "gm3",
            title: "1812 - RAIZLER ( FITAS )",
            description: "Aguardando material - fitas para Raizler",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-red-400", label: "Prioridade" }],
            date: "9 de fev.",
            overdue: true,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
    ],
  },
  {
    id: "impressao",
    title: "TIME IMPRESSÃO - NINA CUT",
    subSections: [
      {
        id: "im-afazer",
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "im1",
            title: "1952 - SP POA",
            description: "Impressão SP POA",
            tags: [{ color: "bg-orange-400", label: "Revisão" }, { color: "bg-green-400", label: "Aprovado" }],
            done: true,
            date: "20 de fev.",
            comments: 1,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "im2",
            title: "1951 Art 7",
            description: "Impressão Art 7",
            tags: [{ color: "bg-orange-400", label: "Revisão" }, { color: "bg-orange-300", label: "Pendente" }],
            date: "23 de fev.",
            overdue: true,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "im3",
            title: "1949 Marcelo",
            description: "Job Marcelo impressão",
            tags: [{ color: "bg-orange-400", label: "Revisão" }, { color: "bg-orange-300", label: "Pendente" }],
            done: true,
            date: "19 de fev.",
            comments: 1,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        id: "im-fazendo",
        label: "FAZENDO",
        color: "bg-yellow-300",
        textColor: "text-yellow-900",
        cards: [
          {
            id: "im4",
            title: "1947 - ASR COMUNICAÇÃO",
            description: "Impressão ASR Comunicação",
            tags: [{ color: "bg-red-500", label: "Urgente" }, { color: "bg-red-400", label: "Prioridade" }],
            done: true,
            date: "19 de fev.",
            comments: 1,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
    ],
  },
  {
    id: "projetos",
    title: "TIME DE PROJETOS",
    subSections: [
      {
        id: "pj-afazer",
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "pj1",
            title: "1954 Asun loja Gravatai",
            description: "Projeto para loja Asun Gravatai",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-blue-500", label: "Design" }, { color: "bg-green-400", label: "Aprovado" }],
            date: "26 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "pj2",
            title: "1948 Colegio Maria Auxiliadora",
            description: "Projeto Colégio Maria Auxiliadora",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-blue-500", label: "Design" }, { color: "bg-green-400", label: "Aprovado" }],
            date: "27 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "pj3",
            title: "1945 - SESC EXPOSITOR CHUI",
            description: "Expositor SESC Chuí",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-red-400", label: "Prioridade" }],
            date: "24 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "pj4",
            title: "1923 - MUZZA - LETRA CAIXA",
            description: "Letra caixa para Muzza",
            tags: [{ color: "bg-blue-400", label: "Arte" }, { color: "bg-red-400", label: "Prioridade" }],
            date: "4 de mar.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
    ],
  },
];
