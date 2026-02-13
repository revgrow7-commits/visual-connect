import { Job } from "./types";

export const mockJobs: Job[] = [
  {
    id: "68dc37559556f3500c1ad7c0",
    code: 1234,
    title: "Fachada ACM completa - Loja Premium Shopping Iguatemi",
    customerName: "Premium Varejo LTDA",
    responsibleName: "João Silva",
    commercialResponsibleName: "Ana Paula Ferreira",
    creationTime: "2026-02-01T10:00:00Z",
    deliveryNeeded: "2026-02-25T10:00:00Z",
    deliveryExpected: "2026-02-23T10:00:00Z",
    totalPrice: 28500.00,
    paymentOption: "30/60 dias",
    jobChargeStatus: "Pending",
    jobInvoiceStatus: "NotIssued",
    isFinalized: false,
    costs: {
      budgeted: { TotalPrice: 28500, ProductionCost: 18525, SellingCost: 9975, Profit: 9975, ProfitPercentual: 35.0 },
      approved: { TotalPrice: 27000, ProductionCost: 17550, SellingCost: 9450, Profit: 9450, ProfitPercentual: 35.0 },
      planned: { TotalPrice: 27000, ProductionCost: 17000, SellingCost: 10000, Profit: 10000, ProfitPercentual: 37.0 },
      realized: { TotalPrice: 25800, ProductionCost: 16200, SellingCost: 9600, Profit: 9600, ProfitPercentual: 37.2 }
    },
    production: {
      status: "Started",
      progressPercentage: 62.5,
      startDate: "2026-02-05T08:00:00Z",
      endDate: null,
      items: [{
        tasks: [
          { publicId: 1, name: "Arte-final e aprovação cliente", productionStatus: "Finalized", duration: 30, scheduleStartDate: "2026-02-05T08:00:00Z", finalizedDate: "2026-02-05T10:00:00Z" },
          { publicId: 2, name: "Impressão vinil para fachada", productionStatus: "Finalized", duration: 120, scheduleStartDate: "2026-02-06T08:00:00Z", finalizedDate: "2026-02-06T12:00:00Z" },
          { publicId: 3, name: "Laminação fosca protetora", productionStatus: "Finalized", duration: 45, scheduleStartDate: "2026-02-06T14:00:00Z", finalizedDate: "2026-02-06T15:30:00Z" },
          { publicId: 4, name: "Corte CNC das peças ACM", productionStatus: "Finalized", duration: 180, scheduleStartDate: "2026-02-07T08:00:00Z", finalizedDate: "2026-02-07T14:00:00Z" },
          { publicId: 5, name: "Pintura eletrostática estrutura", productionStatus: "Finalized", duration: 90, scheduleStartDate: "2026-02-10T08:00:00Z", finalizedDate: "2026-02-10T12:00:00Z" },
          { publicId: 6, name: "Montagem e solda estrutura", productionStatus: "InProgress", duration: 240, scheduleStartDate: "2026-02-11T08:00:00Z", finalizedDate: null },
          { publicId: 7, name: "Instalação na fachada (NR-35)", productionStatus: "NotStarted", duration: 360, scheduleStartDate: "2026-02-18T08:00:00Z", finalizedDate: null },
          { publicId: 8, name: "Acabamento final e limpeza", productionStatus: "NotStarted", duration: 60, scheduleStartDate: "2026-02-19T08:00:00Z", finalizedDate: null }
        ],
        feedstocks: [
          { feedstockId: "fs001", publicId: 101, comercialId: 201, options: { "Material": "Vinil Avery MPI 1105", "Largura": "1520mm", "Comprimento": "25m" } },
          { feedstockId: "fs002", publicId: 102, comercialId: 202, options: { "Material": "ACM Alucobond 4mm", "Cor": "Branco", "Chapa": "1220x5000mm" } },
          { feedstockId: "fs003", publicId: 103, comercialId: 203, options: { "Material": "Perfil alumínio box", "Tamanho": "3m", "Qtd": "12" } },
          { feedstockId: "fs004", publicId: 104, comercialId: 204, options: { "Material": "LED módulo SMD", "Cor": "Branco frio 6500K", "Qtd": "48" } }
        ]
      }]
    },
    products: [
      { Name: "Letras-caixa em ACM iluminadas", Description: "8 unidades com LED interno", Quantity: 8, UnitPrice: 1500, TotalValue: 12000, ProductionCost: 7800 },
      { Name: "Painel testeira iluminado", Description: "Backlight com lona translúcida", Quantity: 1, UnitPrice: 8500, TotalValue: 8500, ProductionCost: 5500 },
      { Name: "Aplicação adesivo fachada", Description: "Vinil recortado eletronicamente", Quantity: 1, UnitPrice: 8000, TotalValue: 8000, ProductionCost: 5200 }
    ]
  },
  {
    id: "690cb92346104f911b4c9417",
    code: 1235,
    title: "Sinalização completa Condomínio Parque Verde",
    customerName: "Construtora Verde LTDA",
    responsibleName: "Maria Santos",
    commercialResponsibleName: "Roberto Lima",
    creationTime: "2026-02-03T09:00:00Z",
    deliveryNeeded: "2026-02-28T10:00:00Z",
    deliveryExpected: "2026-02-26T10:00:00Z",
    totalPrice: 15800.00,
    paymentOption: "À Vista",
    jobChargeStatus: "Paid",
    jobInvoiceStatus: "Issued",
    isFinalized: false,
    costs: {
      budgeted: { TotalPrice: 15800, ProductionCost: 10270, SellingCost: 5530, Profit: 5530, ProfitPercentual: 35.0 },
      approved: { TotalPrice: 15800, ProductionCost: 10270, SellingCost: 5530, Profit: 5530, ProfitPercentual: 35.0 },
      planned: { TotalPrice: 15800, ProductionCost: 9800, SellingCost: 6000, Profit: 6000, ProfitPercentual: 38.0 },
      realized: { TotalPrice: 15800, ProductionCost: 9500, SellingCost: 6300, Profit: 6300, ProfitPercentual: 39.9 }
    },
    production: {
      status: "Started",
      progressPercentage: 40.0,
      startDate: "2026-02-07T08:00:00Z",
      endDate: null,
      items: [{
        tasks: [
          { publicId: 10, name: "Layout e aprovação sinalização", productionStatus: "Finalized", duration: 60, scheduleStartDate: "2026-02-07T08:00:00Z", finalizedDate: "2026-02-07T12:00:00Z" },
          { publicId: 11, name: "Impressão UV em rígido (ACM)", productionStatus: "Finalized", duration: 180, scheduleStartDate: "2026-02-10T08:00:00Z", finalizedDate: "2026-02-10T14:00:00Z" },
          { publicId: 12, name: "Corte e acabamento placas", productionStatus: "InProgress", duration: 120, scheduleStartDate: "2026-02-11T08:00:00Z", finalizedDate: null },
          { publicId: 13, name: "Fabricação suportes metálicos", productionStatus: "NotStarted", duration: 240, scheduleStartDate: "2026-02-14T08:00:00Z", finalizedDate: null },
          { publicId: 14, name: "Instalação no condomínio", productionStatus: "NotStarted", duration: 480, scheduleStartDate: "2026-02-20T08:00:00Z", finalizedDate: null }
        ],
        feedstocks: [
          { feedstockId: "fs010", publicId: 110, comercialId: 210, options: { "Material": "ACM 3mm branco", "Tamanho": "1220x2440mm", "Qtd": "15" } },
          { feedstockId: "fs011", publicId: 111, comercialId: 211, options: { "Material": "Tubo metalon 30x30", "Comprimento": "6m", "Qtd": "20" } }
        ]
      }]
    },
    products: [
      { Name: "Placas de sinalização ACM", Description: "Impressão UV direta 4 cores", Quantity: 45, UnitPrice: 180, TotalValue: 8100, ProductionCost: 4860 },
      { Name: "Totens de identificação", Description: "Aço galvanizado + ACM", Quantity: 3, UnitPrice: 2200, TotalValue: 6600, ProductionCost: 4100 },
      { Name: "Placa fachada portaria", Description: "ACM com letras em relevo", Quantity: 1, UnitPrice: 1100, TotalValue: 1100, ProductionCost: 540 }
    ]
  },
  {
    id: "6983a5c88c3f7152c87b98cb",
    code: 1236,
    title: "Plotagem frota 12 veículos TransLog",
    customerName: "TransLog Logística SA",
    responsibleName: "Carlos Almeida",
    commercialResponsibleName: "Ana Paula Ferreira",
    creationTime: "2026-01-20T11:00:00Z",
    deliveryNeeded: "2026-02-15T10:00:00Z",
    deliveryExpected: "2026-02-14T10:00:00Z",
    totalPrice: 32000.00,
    paymentOption: "30 dias",
    jobChargeStatus: "Overdue",
    jobInvoiceStatus: "Issued",
    isFinalized: true,
    costs: {
      budgeted: { TotalPrice: 32000, ProductionCost: 20800, SellingCost: 11200, Profit: 11200, ProfitPercentual: 35.0 },
      approved: { TotalPrice: 32000, ProductionCost: 20800, SellingCost: 11200, Profit: 11200, ProfitPercentual: 35.0 },
      planned: { TotalPrice: 32000, ProductionCost: 19500, SellingCost: 12500, Profit: 12500, ProfitPercentual: 39.1 },
      realized: { TotalPrice: 32000, ProductionCost: 21200, SellingCost: 10800, Profit: 10800, ProfitPercentual: 33.8 }
    },
    production: {
      status: "Started",
      progressPercentage: 100,
      startDate: "2026-01-25T08:00:00Z",
      endDate: "2026-02-14T17:00:00Z",
      items: [{
        tasks: [
          { publicId: 20, name: "Design arte frota (12 layouts)", productionStatus: "Finalized", duration: 480, scheduleStartDate: "2026-01-25T08:00:00Z", finalizedDate: "2026-01-28T17:00:00Z" },
          { publicId: 21, name: "Impressão vinil veicular", productionStatus: "Finalized", duration: 360, scheduleStartDate: "2026-01-29T08:00:00Z", finalizedDate: "2026-01-31T16:00:00Z" },
          { publicId: 22, name: "Laminação protetora UV", productionStatus: "Finalized", duration: 120, scheduleStartDate: "2026-02-03T08:00:00Z", finalizedDate: "2026-02-03T12:00:00Z" },
          { publicId: 23, name: "Corte recorte eletrônico", productionStatus: "Finalized", duration: 240, scheduleStartDate: "2026-02-03T13:00:00Z", finalizedDate: "2026-02-04T16:00:00Z" },
          { publicId: 24, name: "Aplicação nos 12 veículos", productionStatus: "Finalized", duration: 720, scheduleStartDate: "2026-02-05T08:00:00Z", finalizedDate: "2026-02-14T17:00:00Z" }
        ],
        feedstocks: [
          { feedstockId: "fs020", publicId: 120, comercialId: 220, options: { "Material": "Vinil 3M IJ180Cv3", "Largura": "1370mm", "Comprimento": "50m" } },
          { feedstockId: "fs021", publicId: 121, comercialId: 221, options: { "Material": "Laminação 3M 8519", "Largura": "1370mm" } }
        ]
      }]
    },
    products: [
      { Name: "Envelopamento parcial veículos", Description: "Vinil 3M série IJ180 + laminação 8519", Quantity: 12, UnitPrice: 2666.67, TotalValue: 32000, ProductionCost: 21200 }
    ]
  },
  {
    id: "68dc338d9556f3500c1ad304",
    code: 1237,
    title: "Banner + Backdrop Evento Corporativo Banco XP",
    customerName: "Banco XP Eventos",
    responsibleName: "João Silva",
    commercialResponsibleName: "Roberto Lima",
    creationTime: "2026-02-08T14:00:00Z",
    deliveryNeeded: "2026-02-12T08:00:00Z",
    deliveryExpected: "2026-02-11T17:00:00Z",
    totalPrice: 12300.00,
    paymentOption: "PIX antecipado",
    jobChargeStatus: "Paid",
    jobInvoiceStatus: "Issued",
    isFinalized: true,
    costs: {
      budgeted: { TotalPrice: 12300, ProductionCost: 7380, SellingCost: 4920, Profit: 4920, ProfitPercentual: 40.0 },
      approved: { TotalPrice: 12300, ProductionCost: 7380, SellingCost: 4920, Profit: 4920, ProfitPercentual: 40.0 },
      planned: { TotalPrice: 12300, ProductionCost: 7000, SellingCost: 5300, Profit: 5300, ProfitPercentual: 43.1 },
      realized: { TotalPrice: 12300, ProductionCost: 6800, SellingCost: 5500, Profit: 5500, ProfitPercentual: 44.7 }
    },
    production: {
      status: "Started",
      progressPercentage: 100,
      startDate: "2026-02-09T08:00:00Z",
      endDate: "2026-02-11T16:00:00Z",
      items: [{
        tasks: [
          { publicId: 30, name: "Impressão lona backdrop 5x3m", productionStatus: "Finalized", duration: 60, scheduleStartDate: "2026-02-09T08:00:00Z", finalizedDate: "2026-02-09T10:00:00Z" },
          { publicId: 31, name: "Impressão banners (8un)", productionStatus: "Finalized", duration: 90, scheduleStartDate: "2026-02-09T10:00:00Z", finalizedDate: "2026-02-09T14:00:00Z" },
          { publicId: 32, name: "Acabamento (ilhóses, bastões)", productionStatus: "Finalized", duration: 60, scheduleStartDate: "2026-02-10T08:00:00Z", finalizedDate: "2026-02-10T10:00:00Z" },
          { publicId: 33, name: "Montagem estrutura backdrop", productionStatus: "Finalized", duration: 120, scheduleStartDate: "2026-02-10T13:00:00Z", finalizedDate: "2026-02-10T16:00:00Z" },
          { publicId: 34, name: "Entrega e montagem no local", productionStatus: "Finalized", duration: 180, scheduleStartDate: "2026-02-11T07:00:00Z", finalizedDate: "2026-02-11T16:00:00Z" }
        ],
        feedstocks: [
          { feedstockId: "fs030", publicId: 130, comercialId: 230, options: { "Material": "Lona Frontlight 440g", "Largura": "3200mm" } },
          { feedstockId: "fs031", publicId: 131, comercialId: 231, options: { "Material": "Lona Blackout 550g", "Largura": "5000mm" } }
        ]
      }]
    },
    products: [
      { Name: "Backdrop evento 5x3m", Description: "Lona blackout + estrutura box truss", Quantity: 1, UnitPrice: 6500, TotalValue: 6500, ProductionCost: 3800 },
      { Name: "Banners roll-up 0.8x2m", Description: "Impressão eco-solvente + estrutura", Quantity: 8, UnitPrice: 725, TotalValue: 5800, ProductionCost: 3000 }
    ]
  },
  {
    id: "68ed072b086a3a543abe1c37",
    code: 1238,
    title: "Totem luminoso LED dupla-face Farmácia Central",
    customerName: "Rede Farmácia Central",
    responsibleName: "Maria Santos",
    commercialResponsibleName: "Ana Paula Ferreira",
    creationTime: "2026-02-10T09:00:00Z",
    deliveryNeeded: "2026-03-05T10:00:00Z",
    deliveryExpected: "2026-03-03T10:00:00Z",
    totalPrice: 8750.00,
    paymentOption: "50% + 50% entrega",
    jobChargeStatus: "Partial",
    jobInvoiceStatus: "Partial",
    isFinalized: false,
    costs: {
      budgeted: { TotalPrice: 8750, ProductionCost: 5250, SellingCost: 3500, Profit: 3500, ProfitPercentual: 40.0 },
      approved: { TotalPrice: 8750, ProductionCost: 5250, SellingCost: 3500, Profit: 3500, ProfitPercentual: 40.0 },
      planned: { TotalPrice: 8750, ProductionCost: 5000, SellingCost: 3750, Profit: 3750, ProfitPercentual: 42.9 },
      realized: { TotalPrice: 0, ProductionCost: 0, SellingCost: 0, Profit: 0, ProfitPercentual: 0 }
    },
    production: {
      status: "NotStarted",
      progressPercentage: 0,
      startDate: null,
      endDate: null,
      items: [{
        tasks: [
          { publicId: 40, name: "Projeto estrutural totem", productionStatus: "NotStarted", duration: 120, scheduleStartDate: "2026-02-17T08:00:00Z", finalizedDate: null },
          { publicId: 41, name: "Corte e dobra chapa galvanizada", productionStatus: "NotStarted", duration: 240, scheduleStartDate: "2026-02-19T08:00:00Z", finalizedDate: null },
          { publicId: 42, name: "Solda e estrutura interna", productionStatus: "NotStarted", duration: 180, scheduleStartDate: "2026-02-21T08:00:00Z", finalizedDate: null },
          { publicId: 43, name: "Pintura eletrostática", productionStatus: "NotStarted", duration: 120, scheduleStartDate: "2026-02-24T08:00:00Z", finalizedDate: null },
          { publicId: 44, name: "Impressão e aplicação faces", productionStatus: "NotStarted", duration: 90, scheduleStartDate: "2026-02-25T08:00:00Z", finalizedDate: null },
          { publicId: 45, name: "Instalação elétrica LED", productionStatus: "NotStarted", duration: 120, scheduleStartDate: "2026-02-26T08:00:00Z", finalizedDate: null },
          { publicId: 46, name: "Instalação no local + aterramento", productionStatus: "NotStarted", duration: 300, scheduleStartDate: "2026-03-02T08:00:00Z", finalizedDate: null }
        ],
        feedstocks: [
          { feedstockId: "fs040", publicId: 140, comercialId: 240, options: { "Material": "Chapa galvanizada #18", "Tamanho": "1200x3000mm" } },
          { feedstockId: "fs041", publicId: 141, comercialId: 241, options: { "Material": "Lona translúcida backlight", "Largura": "1520mm" } },
          { feedstockId: "fs042", publicId: 142, comercialId: 242, options: { "Material": "Módulo LED SMD", "Cor": "6500K", "Qtd": "64" } }
        ]
      }]
    },
    products: [
      { Name: "Totem luminoso dupla-face", Description: "Estrutura metálica + faces backlight + LED", Quantity: 1, UnitPrice: 8750, TotalValue: 8750, ProductionCost: 5250 }
    ]
  },
  {
    id: "69abc123def456789abcdef0",
    code: 1239,
    title: "Adesivagem vitrine campanha Verão - Rede Renner (5 lojas)",
    customerName: "Lojas Renner SA",
    responsibleName: "Carlos Almeida",
    commercialResponsibleName: "Roberto Lima",
    creationTime: "2026-02-05T10:00:00Z",
    deliveryNeeded: "2026-02-20T10:00:00Z",
    deliveryExpected: "2026-02-18T10:00:00Z",
    totalPrice: 18500.00,
    paymentOption: "30 dias",
    jobChargeStatus: "Pending",
    jobInvoiceStatus: "NotIssued",
    isFinalized: false,
    costs: {
      budgeted: { TotalPrice: 18500, ProductionCost: 11100, SellingCost: 7400, Profit: 7400, ProfitPercentual: 40.0 },
      approved: { TotalPrice: 18500, ProductionCost: 11100, SellingCost: 7400, Profit: 7400, ProfitPercentual: 40.0 },
      planned: { TotalPrice: 18500, ProductionCost: 10500, SellingCost: 8000, Profit: 8000, ProfitPercentual: 43.2 },
      realized: { TotalPrice: 18500, ProductionCost: 8200, SellingCost: 10300, Profit: 10300, ProfitPercentual: 55.7 }
    },
    production: {
      status: "Started",
      progressPercentage: 75.0,
      startDate: "2026-02-07T08:00:00Z",
      endDate: null,
      items: [{
        tasks: [
          { publicId: 50, name: "Design vitrines (5 layouts)", productionStatus: "Finalized", duration: 240, scheduleStartDate: "2026-02-07T08:00:00Z", finalizedDate: "2026-02-08T16:00:00Z" },
          { publicId: 51, name: "Impressão vinil jateado + recorte", productionStatus: "Finalized", duration: 180, scheduleStartDate: "2026-02-10T08:00:00Z", finalizedDate: "2026-02-10T16:00:00Z" },
          { publicId: 52, name: "Aplicação Loja 1 - Shopping Iguatemi", productionStatus: "Finalized", duration: 120, scheduleStartDate: "2026-02-11T08:00:00Z", finalizedDate: "2026-02-11T14:00:00Z" },
          { publicId: 53, name: "Aplicação Loja 2 - Shopping Praia de Belas", productionStatus: "Paused", duration: 120, scheduleStartDate: "2026-02-12T08:00:00Z", finalizedDate: null },
          { publicId: 54, name: "Aplicação Loja 3 - Shopping Bourbon Wallig", productionStatus: "NotStarted", duration: 120, scheduleStartDate: "2026-02-17T08:00:00Z", finalizedDate: null },
          { publicId: 55, name: "Aplicação Lojas 4 e 5 - Interior", productionStatus: "NotStarted", duration: 240, scheduleStartDate: "2026-02-18T08:00:00Z", finalizedDate: null }
        ],
        feedstocks: [
          { feedstockId: "fs050", publicId: 150, comercialId: 250, options: { "Material": "Vinil jateado Oracal 8510", "Largura": "1260mm", "Comprimento": "50m" } },
          { feedstockId: "fs051", publicId: 151, comercialId: 251, options: { "Material": "Vinil colorido Oracal 651", "Cores": "Vermelho, Branco, Preto" } }
        ]
      }]
    },
    products: [
      { Name: "Adesivo vitrine recorte eletrônico", Description: "Vinil jateado + cores recortadas", Quantity: 5, UnitPrice: 3700, TotalValue: 18500, ProductionCost: 11100 }
    ]
  }
];
