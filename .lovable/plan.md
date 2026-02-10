
# Redesign: Login + Home -- Estilo Limpo e Moderno

## Visao Geral
Redesenhar ambas as telas (Login e Home) seguindo o estilo visual da referencia: limpo, minimalista, centralizado, com a identidade da Industria Visual (logo, gradientes bordo/roxo, tagline C.R.I.E.).

---

## 1. Tela de Login (src/pages/Login.tsx)

Redesign completo inspirado na referencia:

- **Layout**: Centralizado verticalmente, fundo branco limpo
- **Logo**: Logo da Industria Visual centralizado no topo, maior (h-16)
- **Titulo**: "Bem-vindo ao Portal" em negrito + subtitulo "Acesse a intranet da Industria Visual"
- **Formulario**: Manter campos email/senha com visual mais clean (bordas suaves, sem labels externas - usar placeholders)
- **Botao Google**: Adicionar botao "Entrar com Google" com icone G, estilo outline, como na referencia
- **Botao principal**: "Entrar" com gradiente bordo
- **Rodape**: Tagline "C.R.I.E. Criar . Relevancia . Inovacao . Eficiencia" com fundo rosa suave, centralizado na parte inferior
- **Remover**: Card com bordas visíveis -- usar visual mais fluido sem bordas duras

## 2. Tela Home (src/pages/Index.tsx)

Redesign para visual mais limpo e organizado:

- **Saudacao**: Buscar o nome do usuario logado via AuthContext (em vez de "Joao" fixo). Exibir saudacao dinamica (Bom dia/Boa tarde/Boa noite)
- **Banner de boas-vindas**: Card com gradiente bordo sutil, logo pequeno, mensagem de boas-vindas
- **Atalhos Rapidos**: Manter mas com visual mais refinado -- icones em circulos com fundo gradiente suave, texto mais limpo
- **Grid de conteudo**: Manter layout 2+1 colunas mas com cards mais limpos, bordas mais suaves, espacamento maior
- **Tagline C.R.I.E.**: Adicionar no rodape da home tambem, como elemento de identidade

## 3. Componentes Atualizados

- **AtalhosRapidos.tsx**: Icones com fundo circular gradiente, hover mais suave
- **ComunicadosFeed.tsx**: Cards com visual mais limpo
- **AniversariantesWidget.tsx**: Sem alteracoes significativas
- **NovosColaboradores.tsx**: Sem alteracoes significativas

---

## Detalhes Tecnicos

### Login.tsx - Mudancas principais:
- Remover wrapper `Card` -- usar div simples com max-w-sm
- Adicionar botao Google OAuth (usando `supabase.auth.signInWithOAuth`)
- Adicionar div com tagline C.R.I.E. no rodape (position fixed bottom)
- Visual: fundo branco, sombras suaves, bordas arredondadas maiores

### Index.tsx - Mudancas principais:
- Importar `useAuth` para pegar nome do usuario
- Criar logica de saudacao baseada no horario
- Adicionar banner hero com gradiente
- Manter estrutura existente de widgets

### Nenhuma alteracao em:
- AppLayout.tsx, Topbar.tsx, SidebarNav.tsx
- Supabase, banco de dados ou RLS
- Dependencias (tudo ja disponivel)
