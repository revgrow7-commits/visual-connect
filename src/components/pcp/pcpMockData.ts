export interface PCPTag {
  color: string; // tailwind bg class
}

export interface PCPCard {
  id: string;
  title: string;
  tags: PCPTag[];
  date?: string;
  comments?: number;
  attachments?: number;
  hasWatcher?: boolean;
  hasLock?: boolean;
  hasList?: boolean;
  done?: boolean; // green checkmark
  overdue?: boolean; // red clock
}

export interface PCPSubSection {
  label: string;
  color: string; // tailwind bg class for the header
  textColor?: string;
  cards: PCPCard[];
}

export interface PCPColumn {
  id: string;
  title: string;
  subSections: PCPSubSection[];
}

export const pcpColumns: PCPColumn[] = [
  {
    id: "aguardando",
    title: "AGUARDANDO/APROVADO",
    subSections: [
      {
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
        label: "",
        color: "",
        cards: [
          {
            id: "oc1",
            title: "1774-Sicredi",
            tags: [{ color: "bg-red-500" }, { color: "bg-orange-400" }],
            hasList: true,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "oc2",
            title: "1690 Dufrio MPDV Hulter",
            tags: [{ color: "bg-red-500" }, { color: "bg-red-400" }, { color: "bg-green-400" }],
            comments: 2,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "oc3",
            title: "JOB 1713 COPA GÁS",
            tags: [{ color: "bg-red-500" }, { color: "bg-orange-400" }],
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "oc4",
            title: "1823 Eletromídia",
            tags: [{ color: "bg-red-500" }, { color: "bg-red-400" }, { color: "bg-green-400" }],
            comments: 2,
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        label: "FAZENDO",
        color: "bg-yellow-300",
        textColor: "text-yellow-900",
        cards: [],
      },
      {
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
        label: "VERIFICAÇÃO",
        color: "bg-red-400",
        cards: [],
      },
      {
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "af1",
            title: "1954 Asun loja Gravatai",
            tags: [{ color: "bg-blue-500" }, { color: "bg-green-400" }],
            date: "26 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "af2",
            title: "1955 - CESTTO 20.02",
            tags: [{ color: "bg-blue-400" }, { color: "bg-green-400" }],
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        label: "AGUARDA APROVAÇÃO DE AMOSTRA (VIRTUAL/FÍSICA)",
        color: "bg-gray-300",
        textColor: "text-gray-800",
        cards: [
          {
            id: "af3",
            title: "1941 - SESC ANCHIETA - PEÇAS",
            tags: [{ color: "bg-red-500" }, { color: "bg-pink-400" }],
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
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "gm1",
            title: "1955 - CESTTO 20.02",
            tags: [{ color: "bg-blue-400" }, { color: "bg-blue-500" }],
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        label: "VALIDANDO ESTOQUE",
        color: "bg-orange-400",
        textColor: "text-orange-900",
        cards: [
          {
            id: "gm2",
            title: "CBF RIO BRANCO ACRE",
            tags: [{ color: "bg-blue-400" }, { color: "bg-red-400" }, { color: "bg-green-400" }],
            hasList: true,
            hasWatcher: true,
            hasLock: true,
          },
        ],
      },
      {
        label: "AGUARDANDO MATERIAL",
        color: "bg-cyan-300",
        textColor: "text-cyan-900",
        cards: [
          {
            id: "gm3",
            title: "1812 - RAIZLER ( FITAS )",
            tags: [{ color: "bg-blue-400" }, { color: "bg-red-400" }],
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
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "im1",
            title: "1952 - SP POA",
            tags: [{ color: "bg-orange-400" }, { color: "bg-green-400" }],
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
            tags: [{ color: "bg-orange-400" }, { color: "bg-orange-300" }],
            date: "23 de fev.",
            overdue: true,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "im3",
            title: "1949 Marcelo",
            tags: [{ color: "bg-orange-400" }, { color: "bg-orange-300" }],
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
        label: "FAZENDO",
        color: "bg-yellow-300",
        textColor: "text-yellow-900",
        cards: [
          {
            id: "im4",
            title: "1947 - ASR COMUNICAÇÃO",
            tags: [{ color: "bg-red-500" }, { color: "bg-red-400" }],
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
        label: "A FAZER",
        color: "bg-red-400",
        cards: [
          {
            id: "pj1",
            title: "1954 Asun loja Gravatai",
            tags: [{ color: "bg-blue-400" }, { color: "bg-blue-500" }, { color: "bg-green-400" }],
            date: "26 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "pj2",
            title: "1948 Colegio Maria Auxiliadora",
            tags: [{ color: "bg-blue-400" }, { color: "bg-blue-500" }, { color: "bg-green-400" }],
            date: "27 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "pj3",
            title: "1945 - SESC EXPOSITOR CHUI",
            tags: [{ color: "bg-blue-400" }, { color: "bg-red-400" }],
            date: "24 de fev.",
            attachments: 1,
            hasWatcher: true,
            hasLock: true,
          },
          {
            id: "pj4",
            title: "1923 - MUZZA - LETRA CAIXA",
            tags: [{ color: "bg-blue-400" }, { color: "bg-red-400" }],
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
