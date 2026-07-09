# Plano de padronizacao de componentes profissionais

**Data:** 06/07/2026
**Escopo:** design system, componentes compartilhados e telas operacionais do
MVP Doka.

## Objetivo

Elevar a qualidade visual e comportamental dos componentes sem trocar a
arquitetura do frontend, sem introduzir uma biblioteca visual pesada e sem
furar as restricoes atuais do MVP. Radix UI e React Aria entram como checklist
de comportamento esperado, nao como dependencia obrigatoria.

## Referencias praticas

- **Radix UI:** semantica correta para dialog, tabs, menu, tooltip, popover,
  foco visivel, retorno de foco, fechamento por Escape e navegacao por teclado.
- **React Aria:** associacao de label/descricao/erro, estados disabled,
  invalid, busy, teclado previsivel e internacionalizacao sem depender de
  estilos prontos.
- **shadcn/ui:** referencia visual de densidade, hierarquia, borda, sombra e
  composicao, adaptada para CSS/tokens Doka em vez de Tailwind.
- **Tailwind Application UI:** referencia de estruturas de app interno:
  filtros, tabelas, toolbars, dialogs e formularios densos.

## Ferramentas disponiveis

- **Lint/design-system:** obrigatorio apos alteracoes de UI.
- **Vitest/RTL/jsdom:** validar contratos de componentes e fluxos principais.
- **Node REPL MCP:** util para auditorias estaticas rapidas de CSS/tokens.
- **Canva MCP:** util para moodboards e referencias visuais, nao para gerar UI
  diretamente dentro do app.
- **imagegen:** util para assets bitmap e empty states, nao para primitives.
- **Browser/Playwright/computer use:** adiados enquanto o plano vivo proibir
  navegacao automatizada, screenshots e homologacao visual.

## Principios de UI para este MVP

- App operacional desktop-first, denso, silencioso e facil de escanear.
- Cards com raio compacto; cards dentro de cards continuam proibidos.
- Tabelas, filtros e formularios priorizam leitura e repeticao de uso.
- Cores de marca aparecem como acento e acao primaria, nao como fundo dominante.
- Feedback deve cobrir loading, vazio, erro, disabled, focus-visible e busy.
- CSS de modulo compoe layout especifico; primitives ficam em
  `src/components/ui`, feedback em `src/components/feedback` e estrutura em
  `src/components/layout`.

## Checklist comportamental obrigatorio

### Controles

- Label associado ao controle sempre que houver texto visivel.
- `aria-describedby` para hint e erro.
- `aria-invalid` quando houver erro.
- Estado disabled com cursor, contraste e bloqueio de interacao.
- Foco visivel por token `--ring`.
- Texto nao pode quebrar o layout em botoes, badges e abas.

### Dialogs e drawers

- `role="dialog"` e `aria-modal="true"` quando modal.
- `aria-labelledby` unico por instancia.
- `aria-describedby` quando houver descricao.
- Foco inicial no primeiro controle util.
- Escape fecha quando permitido.
- Tab fica contido dentro da superficie.
- Foco retorna para o disparador.

### Tabs e menus

- `role="tablist"` e `role="tab"` nas abas.
- `aria-selected` e roving tabindex.
- Setas, Home e End movem selecao e foco.
- Estados hover/focus/selected distintos.

### Tabelas e listas

- Cabecalho sticky somente quando ajuda a operacao.
- Hover apenas em linha clicavel.
- Numeros com tabular nums.
- Estado vazio dentro da mesma estrutura visual da lista.
- Overflow horizontal permitido no desktop minimo.

## Fases

### Fase 1 - Fundacao visual

- Reduzir raios padrao para uma linguagem operacional.
- Remover tracking negativo dos tokens e headings.
- Reforcar foco visivel em botoes, icon buttons, campos, cards interativos e
  abas.
- Garantir que tokens de origem e bundle do app continuem sincronizados.

### Fase 2 - Contratos dos primitives

- Revisar `Button`, `ButtonLink`, `IconButton`, `Input`, `Select`,
  `Textarea`, `Checkbox`, `Tabs`, `Dialog`, `Card` e `StatusBadge`.
- Adicionar ou ajustar testes de contrato quando houver logica React.
- Manter APIs pequenas, coerentes com o uso real das telas.

### Fase 3 - Migracao por tela

- Priorizar telas com maior repeticao operacional: listas, filtros, formularios
  e dialogs.
- Remover CSS local que recria primitives.
- Migrar uma tela por vez e rodar validacoes permitidas.
- Registrar progresso neste documento e no plano vivo.

### Fase 4 - Homologacao visual posterior

- Quando a restricao de browser/Playwright for removida, revisar rotas em
  1440x900 e 1280x720.
- Capturar evidencias das telas principais.
- Ajustar densidade, alinhamento e estados reais com base no uso.

## Primeira fatia aplicada em 06/07/2026

- Tokens de raio compactados em `design-system/tokens/spacing.css` e
  `src/styles/design-system.css`.
- Tracking negativo removido em `design-system/tokens/typography.css`,
  `design-system/tokens/base.css` e `src/styles/design-system.css`.
- Estados de foco e hover reforcados em `Button`, `IconButton`, `Card`,
  `FormControls`, `Tabs` e `Dialog`.
- `Tabs` passou a usar roving tabindex e teclado Arrow/Home/End.
- `Dialog` passou a gerar ids unicos para titulo/descricao.

## Segunda fatia aplicada em 06/07/2026

- `TaskForm` e `RoutineForm` deixaram de usar controles nativos diretamente e
  passaram a usar `Input`, `Select`, `Textarea` e `Checkbox`.
- A listagem de rotinas passou a usar `Page`, `PageHeader`, `TableFrame` e
  `StatusBadge`.
- O detalhe de tarefa passou a usar `Page`, `PageHeader` e `StatusBadge`.
- Regras locais antigas de tabela, status, campos e responsividade movel foram
  removidas de `src/modules/tarefas-rotinas/tasks.css`.
- O CSS local de Tarefas/Rotinas ficou restrito a composicao especifica:
  grid de formulario, metadados da tabela, atraso, grupos de responsaveis e
  layout do detalhe.

## Terceira fatia aplicada em 06/07/2026

- `OccurrenceForm` deixou de usar `select`, `input` e `textarea` nativos
  diretamente e passou a usar `Input`, `Select` e `Textarea`.
- `OccurrenceDetailPage` passou a usar `Page`, `PageHeader`, `StatusBadge`,
  `Input`, `Select` e `Textarea`.
- `OccurrenceTable` passou a usar o contrato visual de `TableFrame` sem classes
  locais de tabela.
- `src/modules/ocorrencias/pages/Occurrences.css` foi reduzido a composicao
  especifica de pagina, grids, status em linha, comentarios e dados.
- Teste focado criado em `tests/integration/occurrence-form.test.tsx`.

## Quarta fatia aplicada em 06/07/2026

- `RadioOption` foi adicionado aos primitives compartilhados para evitar radio
  nativo estilizado localmente.
- `LancamentoForm` passou a usar `RadioOption`, `Select`, `Input` e `Textarea`.
- `LancamentoTable` passou a usar `TableFrame` sem classes locais de tabela.
- `LancamentoDetailPage` passou a usar `Page`, `PageHeader`, `StatusBadge` e
  `Textarea`.
- `src/modules/lancamentos-operacionais/lancamentos-operacionais.css` foi
  reduzido a composicao especifica de resumo, formulario, detalhe e acoes.
- A varredura de controles nativos em `src/modules` ficou restrita a
  `importacoes-mms`: `FileDropzone` (`input[type=file]`, excecao permitida) e
  `CorrectionEditor`.

## Quinta fatia aplicada em 06/07/2026

- `CorrectionEditor` passou a usar `Input` em vez de `input` nativo inline.
- A varredura de controles nativos em `src/modules` ficou restrita a
  `FileDropzone`, que encapsula `input[type=file]` e permanece como excecao
  permitida pelas regras do projeto.
- Testes focados de correcao e selecao de arquivo em Importacoes MMS passaram.

## Sexta fatia aplicada em 06/07/2026

- Tabelas administrativas de usuarios, postos, vinculos e metas passaram a usar
  `TableFrame`.
- CSS local de tabela/status/campo legado em Administracao foi removido.
- `AdminFields.Field` foi removido por nao ter mais uso real.
- O hexadecimal restante em Administracao permanece como dado de negocio do
  cadastro de prioridade (`cor`), nao como cor estrutural de UI.
- Testes focados de Administracao e design system passaram.

## Setima fatia aplicada em 06/07/2026

- `AssistanceTable` passou a delegar borda, raio, overflow e cabecalho para
  `TableFrame`, mantendo no modulo apenas a largura minima e o codigo tabular.
- Badges locais de Assistencias foram substituidos por `StatusBadge` em resumo,
  partes removidas e origem dos valores efetivos.
- `AssistanceDetailPage` passou a usar o container compartilhado `Page`.
- CSS de Assistencias MMS foi reduzido a composicao especifica de filtros,
  cabecalho legado do detalhe, grids de fatos/valores e linha do historico.
- Testes focados de Assistencias MMS e design system passaram.

## Oitava fatia aplicada em 06/07/2026

- A tabela de produtividade por posto do Dashboard passou a usar `TableFrame`.
- Colunas numericas do resumo por posto foram marcadas com `data-numeric` para
  herdar alinhamento e numerais tabulares do primitive compartilhado.
- CSS legado de filtros nativos, tabela propria e counters antigos do Dashboard
  foi removido.
- O CSS local do Dashboard ficou restrito a composicao de grid, links de
  metricas, comparativo de produtividade e alertas.
- Testes focados de Dashboard e design system passaram.

## Nona fatia aplicada em 06/07/2026

- `LotsTable` deixou de usar wrapper visual local e passou a depender
  integralmente de `TableFrame` para borda, raio, overflow e cabecalho.
- Tabelas de erros/alertas do preview de importacao passaram a usar
  `TableFrame`.
- Colunas numericas em lotes e issues foram marcadas com `data-numeric`.
- CSS legado de tabela, tabs e inputs antigos em Importacoes MMS foi removido.
- O CSS local de Importacoes MMS ficou restrito a filtros, resumo do lote,
  largura minima de tabelas e visualizacao dos itens brutos.
- Testes focados de Importacoes MMS e design system passaram.

## Decima fatia aplicada em 06/07/2026

- Eventos da auditoria passaram a usar `Card` em vez de recriar cartoes no CSS
  local.
- CSS de auditoria foi reduzido a composicao da timeline, filtros e area de
  comparacao JSON.
- `Avatar`, `Button`, `Drawer`, `Input` e `LoadingState` foram ajustados para
  remover valores visuais literais remanescentes e usar tokens oficiais de cor,
  raio, borda, sombra e espacamento.
- Testes focados de rotas protegidas, route guard e design system passaram.

## Decima primeira fatia aplicada em 06/07/2026

- `DropdownMenu` recebeu contrato comportamental mais proximo de Radix/React
  Aria: `aria-haspopup`, `aria-controls`, foco inicial no primeiro item,
  fechamento por Escape com retorno de foco ao disparador e navegacao por
  ArrowUp/ArrowDown/Home/End.
- Estados `focus-visible` foram adicionados ao disparador e aos itens do menu.
- Teste unitario de design system passou a cobrir foco, teclado, fechamento e
  chamada de item do menu.

## Validacao esperada

- `npm run lint:design-system`
- `npm run typecheck`
- `npm run test -- --runInBand` somente se necessario ajustar instabilidade;
  caso contrario `npm run test`
- `npm run build`

Enquanto o plano vivo proibir browser/E2E, a conclusao tecnica desta frente nao
inclui clique real, screenshot ou homologacao visual automatizada.
