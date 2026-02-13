import type { Budget, Customer, MonthlyData } from "./types";

export const mockBudgets: Budget[] = [
  {
    id: "bdg-001",
    publicId: "2024-089",
    budgetState: 1,
    customerName: "Premium Varejo LTDA",
    customerDocument: "12.345.678/0001-99",
    commercialResponsible: "Ana Paula Ferreira",
    creationDate: "2026-02-12T10:00:00Z",
    notes: "Cliente solicitou urgência na entrega",
    proposals: [
      {
        id: "prop-001", name: "Opção Premium", totalPrice: 28500, productionCost: 18525, sellingCost: 2850, totalProfitPercentual: 35,
        items: [
          { id: "item-001", productName: "Letras-caixa ACM iluminadas", description: "Letras em ACM 4mm com LED interno", quantity: 8, unitPrice: 1500, totalPrice: 12000, productionCost: 7800, totalProfit: 4200, profitPercentual: 35, checklists: [{ question: "Material", answer: "ACM 4mm branco" }, { question: "Acabamento", answer: "Pintura automotiva preto fosco" }, { question: "Iluminação", answer: "LED SMD interno 6500K" }] },
          { id: "item-002", productName: "Painel testeira backlight", description: "Painel luminoso com lona translúcida", quantity: 1, unitPrice: 8500, totalPrice: 8500, productionCost: 5525, totalProfit: 2975, profitPercentual: 35, checklists: [{ question: "Estrutura", answer: "Box truss alumínio" }, { question: "Face", answer: "Lona translúcida 550g" }, { question: "Medida", answer: "5000x800mm" }] },
          { id: "item-003", productName: "Aplicação adesivo fachada", description: "Vinil recortado eletronicamente para vidro fachada", quantity: 1, unitPrice: 8000, totalPrice: 8000, productionCost: 5200, totalProfit: 2800, profitPercentual: 35, checklists: [{ question: "Vinil", answer: "Avery MPI 1105 branco brilho" }, { question: "Laminação", answer: "Fosca protetora UV DOL 1080" }, { question: "Área total", answer: "12m²" }] },
        ],
      },
      {
        id: "prop-002", name: "Opção Econômica", totalPrice: 19200, productionCost: 13728, sellingCost: 1920, totalProfitPercentual: 28.5,
        items: [
          { id: "item-004", productName: "Letras-caixa ACM sem iluminação", description: "Letras em ACM 3mm sem LED", quantity: 8, unitPrice: 850, totalPrice: 6800, productionCost: 4760, totalProfit: 2040, profitPercentual: 30, checklists: [{ question: "Material", answer: "ACM 3mm branco" }, { question: "Acabamento", answer: "Vinil adesivo recortado" }] },
          { id: "item-005", productName: "Painel testeira lona simples", description: "Lona front-light 440g com bastões", quantity: 1, unitPrice: 5400, totalPrice: 5400, productionCost: 3888, totalProfit: 1512, profitPercentual: 28, checklists: [{ question: "Material", answer: "Lona Frontlight 440g" }, { question: "Acabamento", answer: "Bastão + corda" }] },
          { id: "item-006", productName: "Aplicação adesivo fachada", description: "Vinil recortado padrão", quantity: 1, unitPrice: 7000, totalPrice: 7000, productionCost: 5080, totalProfit: 1920, profitPercentual: 27.4, checklists: [{ question: "Vinil", answer: "Oracal 651 branco" }, { question: "Laminação", answer: "Sem" }] },
        ],
      },
    ],
  },
  {
    id: "bdg-002",
    publicId: "2024-085",
    budgetState: 3,
    customerName: "Construtora Verde LTDA",
    customerDocument: "98.765.432/0001-10",
    commercialResponsible: "Roberto Lima",
    creationDate: "2026-01-28T09:00:00Z",
    wonDate: "2026-02-05T14:00:00Z",
    notes: null,
    proposals: [
      {
        id: "prop-003", name: "Proposta Única", totalPrice: 15800, productionCost: 10270, sellingCost: 1580, totalProfitPercentual: 35,
        items: [
          { id: "item-007", productName: "Placas de sinalização ACM", description: "Impressão UV direta 4 cores em ACM 3mm", quantity: 45, unitPrice: 180, totalPrice: 8100, productionCost: 4860, totalProfit: 3240, profitPercentual: 40, checklists: [{ question: "Material", answer: "ACM 3mm branco" }, { question: "Impressão", answer: "UV direta 4 cores" }, { question: "Tamanho médio", answer: "400x300mm" }] },
          { id: "item-008", productName: "Totens de identificação", description: "Aço galvanizado + ACM com impressão UV", quantity: 3, unitPrice: 2200, totalPrice: 6600, productionCost: 4620, totalProfit: 1980, profitPercentual: 30, checklists: [{ question: "Estrutura", answer: "Metalon 50x50 galvanizado" }, { question: "Face", answer: "ACM 3mm com UV" }, { question: "Altura", answer: "2200mm" }] },
          { id: "item-009", productName: "Placa fachada portaria", description: "ACM com letras em relevo e iluminação LED", quantity: 1, unitPrice: 1100, totalPrice: 1100, productionCost: 790, totalProfit: 310, profitPercentual: 28.2, checklists: [{ question: "Material", answer: "ACM 4mm preto" }, { question: "Letras", answer: "Aço escovado em relevo 15mm" }] },
        ],
      },
    ],
  },
  {
    id: "bdg-003",
    publicId: "2024-082",
    budgetState: 3,
    customerName: "TransLog Logística SA",
    customerDocument: "33.444.555/0001-22",
    commercialResponsible: "Ana Paula Ferreira",
    creationDate: "2026-01-15T11:00:00Z",
    wonDate: "2026-01-20T10:00:00Z",
    notes: "Renovação contrato anual frota",
    proposals: [
      {
        id: "prop-004", name: "Envelopamento Frota Completa", totalPrice: 32000, productionCost: 20800, sellingCost: 3200, totalProfitPercentual: 35,
        items: [
          { id: "item-010", productName: "Envelopamento parcial veículos", description: "Vinil 3M IJ180 + laminação 8519 para frota", quantity: 12, unitPrice: 2666.67, totalPrice: 32000, productionCost: 20800, totalProfit: 11200, profitPercentual: 35, checklists: [{ question: "Vinil", answer: "3M IJ180Cv3" }, { question: "Laminação", answer: "3M 8519 brilho" }, { question: "Área por veículo", answer: "~8m²" }] },
        ],
      },
    ],
  },
  {
    id: "bdg-004",
    publicId: "2024-091",
    budgetState: 1,
    customerName: "Rede Farmácia Central",
    customerDocument: "55.666.777/0001-33",
    commercialResponsible: "Roberto Lima",
    creationDate: "2026-02-10T09:00:00Z",
    notes: "Aguardando aprovação matriz SP",
    proposals: [
      {
        id: "prop-005", name: "Totem + Fachada", totalPrice: 22500, productionCost: 13500, sellingCost: 2250, totalProfitPercentual: 40,
        items: [
          { id: "item-011", productName: "Totem luminoso dupla-face", description: "Estrutura metálica + faces backlight LED", quantity: 1, unitPrice: 8750, totalPrice: 8750, productionCost: 5250, totalProfit: 3500, profitPercentual: 40, checklists: [{ question: "Altura", answer: "4000mm" }, { question: "Iluminação", answer: "LED SMD 6500K" }, { question: "Face", answer: "Lona translúcida backlight" }] },
          { id: "item-012", productName: "Fachada completa ACM", description: "Revestimento ACM + letreiro + cruz farmácia", quantity: 1, unitPrice: 13750, totalPrice: 13750, productionCost: 8250, totalProfit: 5500, profitPercentual: 40, checklists: [{ question: "ACM", answer: "4mm verde (pantone da marca)" }, { question: "Letreiro", answer: "Letras-caixa acrílico iluminado" }, { question: "Cruz", answer: "LED programável RGB" }] },
        ],
      },
    ],
  },
  {
    id: "bdg-005",
    publicId: "2024-088",
    budgetState: 2,
    customerName: "Rede Academia FitMax",
    customerDocument: "77.888.999/0001-55",
    commercialResponsible: "Ana Paula Ferreira",
    creationDate: "2026-02-01T14:00:00Z",
    lostDate: "2026-02-10T16:00:00Z",
    lostReason: "Preço acima do concorrente",
    notes: "Concorrente ofereceu 22% mais barato com materiais inferiores",
    proposals: [
      {
        id: "prop-006", name: "Comunicação Visual Completa", totalPrice: 45000, productionCost: 29250, sellingCost: 4500, totalProfitPercentual: 35,
        items: [
          { id: "item-013", productName: "Fachada ACM com painel LED", description: "Revestimento completo 12x4m + painel LED P10", quantity: 1, unitPrice: 32000, totalPrice: 32000, productionCost: 22400, totalProfit: 9600, profitPercentual: 30, checklists: [{ question: "ACM", answer: "4mm preto fosco" }, { question: "Painel LED", answer: "P10 outdoor 3x1.5m" }] },
          { id: "item-014", productName: "Sinalização interna", description: "Placas ACM + adesivos de ambientação", quantity: 1, unitPrice: 13000, totalPrice: 13000, productionCost: 6850, totalProfit: 6150, profitPercentual: 47.3, checklists: [] },
        ],
      },
    ],
  },
  {
    id: "bdg-006",
    publicId: "2024-086",
    budgetState: 2,
    customerName: "Colégio São Francisco",
    customerDocument: "88.999.111/0001-66",
    commercialResponsible: "Roberto Lima",
    creationDate: "2026-01-22T10:00:00Z",
    lostDate: "2026-02-08T09:00:00Z",
    lostReason: "Projeto cancelado pelo cliente",
    notes: null,
    proposals: [
      {
        id: "prop-007", name: "Sinalização Escolar", totalPrice: 9800, productionCost: 5880, sellingCost: 980, totalProfitPercentual: 40,
        items: [
          { id: "item-015", productName: "Kit sinalização escolar", description: "30 placas + 2 totens + faixa fachada", quantity: 1, unitPrice: 9800, totalPrice: 9800, productionCost: 5880, totalProfit: 3920, profitPercentual: 40, checklists: [] },
        ],
      },
    ],
  },
  {
    id: "bdg-007",
    publicId: "2024-092",
    budgetState: 1,
    customerName: "Lojas Renner SA",
    customerDocument: "44.555.666/0001-88",
    commercialResponsible: "Ana Paula Ferreira",
    creationDate: "2026-02-13T08:00:00Z",
    notes: "Campanha Outono/Inverno 2026 - 15 lojas RS",
    proposals: [
      {
        id: "prop-008", name: "Pacote 15 Lojas", totalPrice: 67500, productionCost: 40500, sellingCost: 6750, totalProfitPercentual: 40,
        items: [
          { id: "item-016", productName: "Adesivagem vitrines (15 lojas)", description: "Vinil jateado + cores recortadas por loja", quantity: 15, unitPrice: 3700, totalPrice: 55500, productionCost: 33300, totalProfit: 22200, profitPercentual: 40, checklists: [{ question: "Vinil", answer: "Oracal 8510 jateado" }, { question: "Cores", answer: "Recorte 651 (paleta sazonal)" }, { question: "Área por loja", answer: "~18m²" }] },
          { id: "item-017", productName: "Banners internos PDV", description: "Impressão lona com acabamento bastão", quantity: 60, unitPrice: 200, totalPrice: 12000, productionCost: 7200, totalProfit: 4800, profitPercentual: 40, checklists: [{ question: "Material", answer: "Lona Frontlight 440g" }, { question: "Tamanho", answer: "600x900mm" }] },
        ],
      },
      {
        id: "prop-009", name: "Pacote 5 Lojas (fase 1)", totalPrice: 24500, productionCost: 14700, sellingCost: 2450, totalProfitPercentual: 40,
        items: [
          { id: "item-018", productName: "Adesivagem vitrines (5 lojas)", description: "Vinil jateado + cores para 5 lojas fase 1", quantity: 5, unitPrice: 3700, totalPrice: 18500, productionCost: 11100, totalProfit: 7400, profitPercentual: 40, checklists: [] },
          { id: "item-019", productName: "Banners internos PDV (5 lojas)", description: "Impressão lona", quantity: 20, unitPrice: 200, totalPrice: 4000, productionCost: 2400, totalProfit: 1600, profitPercentual: 40, checklists: [] },
        ],
      },
    ],
  },
  {
    id: "bdg-008",
    publicId: "2024-090",
    budgetState: 3,
    customerName: "Banco XP Eventos",
    customerDocument: "66.777.888/0001-44",
    commercialResponsible: "Roberto Lima",
    creationDate: "2026-02-06T15:00:00Z",
    wonDate: "2026-02-08T09:00:00Z",
    notes: "Evento dia 11/02 - produção urgente",
    proposals: [
      {
        id: "prop-010", name: "Kit Evento Corporativo", totalPrice: 12300, productionCost: 7380, sellingCost: 1230, totalProfitPercentual: 40,
        items: [
          { id: "item-020", productName: "Backdrop evento 5x3m", description: "Lona blackout + estrutura box truss", quantity: 1, unitPrice: 6500, totalPrice: 6500, productionCost: 3900, totalProfit: 2600, profitPercentual: 40, checklists: [{ question: "Material", answer: "Lona Blackout 550g" }, { question: "Estrutura", answer: "Box truss Q25 alumínio" }] },
          { id: "item-021", productName: "Banners roll-up 0.8x2m", description: "Eco-solvente + estrutura retrátil", quantity: 8, unitPrice: 725, totalPrice: 5800, productionCost: 3480, totalProfit: 2320, profitPercentual: 40, checklists: [{ question: "Impressão", answer: "Eco-solvente 720dpi" }, { question: "Estrutura", answer: "Roll-up alumínio retrátil" }] },
        ],
      },
    ],
  },
];

export const mockCustomers: Customer[] = [
  { id: 789, name: "Premium Varejo LTDA", document: "12.345.678/0001-99", contact_person: "Marcos Oliveira", email: "marcos@premiumvarejo.com.br", phone: "(51) 3333-4444", address: { street: "Av. Nilo Peçanha, 1600", city: "Porto Alegre", state: "RS", zip: "90470-001" }, active: true, notes: "Cliente premium - atendimento prioritário" },
  { id: 790, name: "Construtora Verde LTDA", document: "98.765.432/0001-10", contact_person: "Fernanda Ribeiro", email: "fernanda@construtora-verde.com.br", phone: "(51) 3222-5555", address: { street: "Rua Voluntários da Pátria, 800", city: "Porto Alegre", state: "RS", zip: "90230-010" }, active: true, notes: "Parceria para projetos de sinalização predial" },
  { id: 791, name: "TransLog Logística SA", document: "33.444.555/0001-22", contact_person: "Ricardo Mendes", email: "ricardo@translog.com.br", phone: "(51) 3111-6666", address: { street: "Rod BR-116, km 255", city: "Canoas", state: "RS", zip: "92420-000" }, active: true, notes: "Contrato anual renovável - frota 45 veículos" },
  { id: 792, name: "FastFood Franchising", document: "44.555.666/0001-88", contact_person: "Juliana Costa", email: "juliana@fastfood-br.com.br", phone: "(11) 4444-7777", address: { street: "Rua Augusta, 2200", city: "São Paulo", state: "SP", zip: "01412-100" }, active: true, notes: "Contrato recorrente manutenção sinalização" },
  { id: 793, name: "Rede Farmácia Central", document: "55.666.777/0001-33", contact_person: "Paulo Andrade", email: "paulo@farmaciacentral.com.br", phone: "(51) 3555-8888", address: { street: "Av. Ipiranga, 5200", city: "Porto Alegre", state: "RS", zip: "90610-000" }, active: true, notes: null },
  { id: 794, name: "Banco XP Eventos", document: "66.777.888/0001-44", contact_person: "Camila Rodrigues", email: "eventos@xp.com.br", phone: "(11) 5555-9999", address: { street: "Av. Faria Lima, 3400", city: "São Paulo", state: "SP", zip: "04538-132" }, active: true, notes: "Eventos corporativos trimestrais" },
  { id: 795, name: "Lojas Renner SA", document: "44.555.666/0001-88", contact_person: "Patrícia Lima", email: "trade-marketing@lojasrenner.com.br", phone: "(51) 3666-1111", address: { street: "Av. Assis Brasil, 3940", city: "Porto Alegre", state: "RS", zip: "91060-000" }, active: true, notes: "Campanhas sazonais - 4x ao ano" },
  { id: 796, name: "Rede Academia FitMax", document: "77.888.999/0001-55", contact_person: "Eduardo Santos", email: "eduardo@fitmax.com.br", phone: "(51) 3777-2222", address: { street: "Av. Protásio Alves, 3000", city: "Porto Alegre", state: "RS", zip: "90410-006" }, active: true, notes: "Orçamento perdido em fev/2026 por preço" },
  { id: 797, name: "Colégio São Francisco", document: "88.999.111/0001-66", contact_person: "Sra. Marta Vieira", email: "direcao@colegiosf.edu.br", phone: "(51) 3888-3333", address: { street: "Rua Ramiro Barcelos, 1200", city: "Porto Alegre", state: "RS", zip: "90035-001" }, active: false, notes: "Projeto cancelado - reativar em 2027" },
  { id: 798, name: "Supermercados BomPreço (ex-cliente)", document: "99.111.222/0001-77", contact_person: "Carlos Brito", email: "carlos@bompreco.com.br", phone: "(51) 3999-4444", address: { street: "Av. Sertório, 5800", city: "Porto Alegre", state: "RS", zip: "91060-290" }, active: false, notes: "Inativo desde jul/2025 - migrou para concorrente" },
];

export const monthlyData: MonthlyData[] = [
  { month: "Set/25", created: 18, won: 7, lost: 5, revenue: 98500 },
  { month: "Out/25", created: 22, won: 9, lost: 6, revenue: 125300 },
  { month: "Nov/25", created: 15, won: 5, lost: 4, revenue: 82100 },
  { month: "Dez/25", created: 12, won: 4, lost: 3, revenue: 67800 },
  { month: "Jan/26", created: 20, won: 8, lost: 5, revenue: 142000 },
  { month: "Fev/26", created: 24, won: 10, lost: 4, revenue: 168500 },
];
