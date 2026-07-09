# Plano: trazer o estilo e a experiência do Dracma para o Doka-Sistema_Interno

> Baseado em: screenshots da auditoria visual do Doka (`docs/auditoria-visual/screenshots/2026-07-05-pos-redesign/`), tokens atuais (`design-system/tokens/*.css`), código (`src/app/router.tsx`, `src/components/ui/`, páginas dos módulos) e na análise do Dracma (`dracma-cash-flow/docs/design-system/ANALISE-DESIGN-SYSTEM.md` + 56 screenshots).
> **Premissa:** manter as cores da marca Doka (laranja `#F09018` e roxo `#602860`), importando do Dracma a *fórmula* visual e os padrões de interação.

---

## Como usar este documento (instruções para o agente implementador)

- **Repositório de referência (Dracma)**: `C:\Users\vinic\Projetos coding\Empresas\Doka\dracma-cash-flow` — leia livremente:
  - `docs/design-system/ANALISE-DESIGN-SYSTEM.md` — tokens e padrões completos;
  - `docs/design-system/screenshots/` — 56 screenshots (INDEX.md descreve cada uma);
  - `src/pages/DesignSystem.tsx` — spec viva de componentes;
  - `src/components/shared/` — `AppModal`, `TableCardRow`, `StatusChip`, `SummaryInfoCard`, `SidebarActionList`, `GlobalSearchDialog` etc.
- **Execute uma fase por vez**, na ordem da seção 6. Cada fase é independente e entregável. Não misture fases num mesmo PR/commit.
- **Valide visualmente**: compare o resultado com as screenshots do Dracma correspondentes e com as do Doka em `docs/auditoria-visual/screenshots/2026-07-05-pos-redesign/` (antes/depois).
- **Respeite o lint do design system** (`npm run lint:design-system`) — novos valores visuais entram como tokens em `design-system/tokens/*.css`, nunca hardcoded nos componentes.
- Decisões já tomadas (não reabrir): **manter sidebar escurecida para roxo** (seção 5) e manter laranja/roxo como cores de marca (seção 2).
- Decisão pendente (perguntar ao usuário só quando chegar na fase 3): introduzir Tailwind + shadcn/ui vs. continuar com CSS puro.

---

## 0. Diagnóstico honesto: o que já está bom

- **Já é SPA**: Vite + React Router 7 (data router), lazy loading por página. A lentidão percebida não é arquitetura — é padrão de UX (seção 3).
- **Já usa Poppins** (mesma fonte do Dracma).
- **Tokens bem organizados** (`design-system/tokens/colors.css` com ramps e aliases semânticos) — melhor estruturados que os do Dracma, que tem muito hex hardcoded.
- Já existem `Dialog.tsx` e `Drawer.tsx` em `src/components/ui/` — o problema é que os fluxos de criação/edição **não os usam**.

O gap não é de fundação, é de **aparência (camada de composição)** e **coreografia de navegação**.

---

## 1. Por que o Dracma "parece melhor" — as 5 diferenças estruturais

| # | Dracma | Doka hoje | Impacto |
|---|---|---|---|
| 1 | **Topbar escura de marca** (navy + dourado) — o app tem "rosto" | Sidebar branca + topbar branca — tudo neutro, marca só no logo | Identidade |
| 2 | **Tudo é card**: linhas de tabela são cards individuais (raio 15px, sombra `0 2px 8px`, hover eleva) | Tabela tradicional com divisores de linha dentro de um card único | Percepção de polimento |
| 3 | **Criação/edição em modal/drawer sobre a lista** — contexto nunca some | Rota nova (`/app/ocorrencias/nova`) — a lista desmonta, fundo fica vazio, breadcrumb muda | Sensação de MPA |
| 4 | **Tipografia densa** (corpo 12–13px, bold só em números/títulos) + micro-headers uppercase | Corpo ~14–16px, tudo meio do mesmo peso | Densidade profissional |
| 5 | **Controles customizados** (Radix: select, date picker, tabs animadas) | `<select>` e `<input type="date">` nativos do browser | Acabamento |

## 2. Design System — mapeamento de tokens (laranja/roxo no lugar de navy/gold)

A fórmula do Dracma é: **1 cor escura de autoridade (topbar, botão primário) + 1 cor quente de acento (logo, item ativo, chips) + fundo cinza + cards brancos**. Traduzindo para a marca Doka:

| Papel (Dracma) | Valor Dracma | Valor Doka proposto |
|---|---|---|
| Topbar / autoridade | navy `#142a5c` | **roxo profundo `--purple-600` `#4F204E`** |
| Acento / item ativo / logo | gold `#c9a227` | **laranja `#F09018`** (`--orange-500`) |
| Botão primário | navy, texto branco | Duas opções: roxo `--purple-600` texto branco (mais "Dracma") ou manter laranja com texto escuro (mais "Doka", já é AA). Sugestão: **primário roxo, CTA de página laranja** — replica a hierarquia navy/gold |
| Fundo de página | `#f3f3f4` | `--neutral-100` `#F4F2F4` (trocar o atual `--surface-page: neutral-50`, que é branco demais — cards não descolam do fundo) |
| Card | `#ffffff` | mantém `--neutral-0` |
| Borda | `#e5e7eb` / `#EAECF0` | mantém `--neutral-200` |
| Texto muted | `#667085` | `--neutral-600` |
| Chip de categoria (borda dourada) | borda+texto gold sobre branco | borda+texto laranja `--orange-600` sobre branco |
| Pastel de status | `#D1FADF/#067647` etc. | já existe (`--status-*-soft`) ✓ — só padronizar o formato chip 5px/11px |
| Avatar / FAB | dourado / navy | laranja / roxo |

### Demais fundações a importar
- **Radius**: adotar a escala Dracma — 5px chips, 8px inputs/botões de modal, 12px cards/modais, 15px card-rows, full em badges/avatar.
- **Sombras**: `0 2px 8px rgb(17 24 39 / 0.08)` (card), hover `0 6px 14px / 0.12`, painéis `0 4px 12px / 0.08`.
- **Tipografia**: escala px do Dracma — H1 32/bold, modal 28/bold, seção 20/semibold, card 16/semibold, corpo 13, células/labels 12, chips 11/semibold, micro-headers 10–12 uppercase tracking-wide `--neutral-500`.

## 3. "Virar SPA de verdade" — por que o Doka parece lento e como consertar

O Doka já é SPA; o que cria a sensação de recarga de página:

1. **Full-screen spinner em toda navegação** — `RootLayout` renderiza `<LoadingState message="Carregando..." />` substituindo a tela INTEIRA quando `navigation.state === "loading"`, e cada rota lazy tem `Suspense` full-page ("Carregando ocorrências..."). Resultado: tela branca + spinner = cara de MPA.
   → **Fix**: layout (`AppShell`, sidebar, topbar) permanece SEMPRE montado; loading vira **skeleton local** na área de conteúdo (o Dracma usa `skeleton.tsx` nos cards). Remover o full-screen do RootLayout.
2. **Refetch em toda visita** — páginas carregam com `useEffect(() => load(), [])` sem cache; voltar para a lista refaz a query no Supabase.
   → **Fix**: adotar **TanStack Query** (o Dracma usa) com `staleTime` — voltar à lista renderiza dados do cache instantaneamente e revalida em background. É a mudança de maior impacto na percepção de velocidade.
3. **Guard assíncrono por rota** (`ProtectedRoute`/loader valida autorização a cada navegação).
   → **Fix**: cachear o resultado da autorização por sessão/escopo em memória; validar em background.
4. **Chunks lazy carregados só no clique**.
   → **Fix**: prefetch do chunk no hover/focus do link da sidebar (`import()` antecipado), padrão barato que elimina o delay do primeiro clique.

## 4. Padrões de interação a importar (o "jeito Dracma")

### 4.1 Criar/editar em modal — não em rota
Hoje: `Nova ocorrência` → navega para `/app/ocorrencias/nova` (a lista some; o screenshot `03-ocorrencias-nova.png` mostra o drawer sobre fundo vazio porque a lista desmontou).
Dracma: botão abre `AppModal` **sobre a lista montada**; fechar (Esc/X) volta instantaneamente sem refetch.

- Converter `OccurrenceFormPage`, `TaskFormPage`, `RoutineFormPage`, `LancamentoFormPage` (e os cadastros) em **componentes de modal/drawer** controlados por estado da página de lista (ou query param `?novo=1` para deep-link, se quiser URL).
- Formulários longos: usar o padrão de **abas dentro do modal** do Dracma (ExpenseFormTabs: Dados Gerais / Pagamento / ... com underline navy→roxo).
- Manter rotas de detalhe para deep-link, mas o *fluxo normal* de inspeção vira **drawer lateral direito** (Dracma: drawer de detalhe de carteira / sidebar de inspeção) — clicar na linha abre o drawer, a lista continua visível atrás.
- Exclusão: `AlertDialog` de confirmação (Dracma `24-contas-pagar-modal-exclusao.png`), nunca página.

### 4.2 Anatomia de modal Dracma
Raio 12px, **barra lateral esquerda de 8px na cor de autoridade** (→ roxa), título 28px bold com ícone colorido, subtítulo muted, footer com divider + botão primário à direita e "Cancelar" ghost. Tamanhos xs→lg padronizados (portar o `AppModal` do Dracma adaptando ao CSS puro do Doka).

### 4.3 Listas como card-rows
Substituir `<table>` por: header de colunas "solto" (12px, muted) + **cada linha um card branco** (raio 15px, sombra sutil, hover eleva) com checkbox à esquerda, chip de categoria com borda laranja, valores bold à direita, datas vencidas em vermelho. Portar `TableCardRow` + `SortableHeaderButton` do Dracma. Em mobile, virar cards empilhados com accordion (List-to-Card).

### 4.4 Ações contextuais
- **Sidebar direita de ações em lote** (Dracma Contas a Pagar): selecionar linhas revela card flutuante com ações (Inspecionar/Duplicar/Aprovar/Exportar/Excluir) + card "Resumo do período".
- **Menu ⋮ por linha** (DropdownMenu — o Doka já tem o componente).

### 4.5 Outros detalhes que fazem a "cara Dracma"
- **Busca global Ctrl+K** (painel escuro, pills de escopo, hints ↑↓/esc) — portar `GlobalSearchDialog` (cmdk).
- **Toasts Sonner** no lugar do Toast custom atual.
- **Filtro global persistente na topbar** (pill "Todos os centros" → no Doka: "Todos os postos" — já existe o conceito `posto_id`, elevar para a topbar).
- **Selects e date pickers customizados** (Radix Select + calendário) no lugar dos nativos.
- **KPI cards** com CardDescription 12px muted / valor 24px bold com ícone colorido / detalhe 12px (substituir os stat cards atuais de borda lateral roxa).
- **Cards de alerta pastel** no dashboard (fundo+borda pastel, número 24px).
- **FAB + bottom-nav** no mobile.

## 5. Layout: sidebar escura ✅ DECIDIDO

**Decisão do usuário (2026-07-09): manter a sidebar esquerda, escurecida para roxo.** Não migrar para topbar.

Spec da nova sidebar (aplicar em `AppShell` + CSS correspondente):

| Elemento | Spec |
|---|---|
| Fundo | `--purple-700` `#401A3F` (se ficar pesado, testar `--purple-600` `#4F204E`) |
| Logo no topo | versão laranja/branca (`design-system/assets/logos/doka-logo-orange.png` ou `doka-icon-white.png`) — nunca a roxa sobre fundo roxo |
| Item inativo | texto/ícone branco ~80% (`rgba(255,255,255,.8)`), 14px medium |
| Item ativo | fundo translúcido claro (`rgba(255,255,255,.10)`), raio 8px, **texto e ícone laranja `--orange-400` `#F29E30`** (400 em vez de 500 para contraste sobre roxo) |
| Hover | fundo `rgba(255,255,255,.06)` |
| Micro-headers de grupo (se houver) | 10–11px uppercase tracking-wide, branco 50% |
| Divider | `rgba(255,255,255,.12)` |
| Botão "Recolher" | mesmo tratamento de item inativo |
| Topbar | vira barra fina branca (borda inferior `--neutral-200`) contendo: breadcrumb/título, **filtro global de posto em pill** (equivalente ao "Todos os centros" do Dracma), busca, avatar **laranja** com iniciais |

Referência visual: topbar do Dracma (`02-dashboard.png`) — replicar a *fórmula* (superfície escura de marca + acento quente no item ativo) na vertical.

## 6. Roteiro de implementação (ordem de impacto ÷ esforço)

| Fase | Entrega | Esforço |
|---|---|---|
| **1. Percepção de velocidade** | TanStack Query com cache; layout persistente; skeletons locais em vez de spinner full-screen; prefetch on-hover | 2–3 dias |
| **2. Casca de marca** | Sidebar roxa com acento laranja (spec na seção 5); topbar fina branca com filtro global; fundo `#F4F2F4`; sombras e raios Dracma; tipografia densa | 1–2 dias |
| **3. Modais** | `AppModal` (barra roxa lateral) + converter os 5 fluxos de criação/edição de rota→modal; detalhe→drawer; confirmação→AlertDialog | 3–5 dias |
| **4. Listas** | Card-rows nas 6 listas + chips padronizados + menu ⋮ + ações em lote | 3–4 dias |
| **5. Refinos** | Selects/date Radix, busca global Ctrl+K, Sonner, KPI/alert cards, filtro global na topbar | 2–3 dias |

### Notas técnicas
- O Doka usa CSS puro por componente (sem Tailwind). Duas opções: portar os padrões reescrevendo os `.css` (mantém o lint `check-design-system.mjs`), ou introduzir Tailwind + shadcn/ui como no Dracma (migração maior, porém copia componentes prontos). Para as fases 1–2 o CSS puro basta; decidir antes da fase 3, pois `AppModal`/Radix ficam muito mais baratos com shadcn.
- React 19 no Doka: TanStack Query v5 e Radix são compatíveis.
- A página `/design-system` do Dracma ([DesignSystem.tsx](../../dracma-cash-flow/src/pages/DesignSystem.tsx)) é a spec de referência — criar o equivalente `/app/design-system` no Doka e validar cada fase contra ela.

---
*Referências visuais: Dracma `docs/design-system/screenshots/` (56 imagens) vs Doka `docs/auditoria-visual/screenshots/2026-07-05-pos-redesign/`.*
