# Redesign de interação do frontend

**Data:** 04/07/2026

## Objetivo

Evoluir a interface consistente da primeira rodada para uma arquitetura de
produto mais enxuta: conteúdo operacional acima da dobra, filtros sob demanda,
ações compactas e feedback vivo, sem alterar services, permissões, RLS ou
contratos de rota.

## Implementado

- shell com sidebar colapsável em rail de 68px, preferência persistida e logo
  adaptativo;
- topbar contextual com módulo e tipo de rota;
- primitives `Drawer`, `SearchInput`, `FilterChips`, `DropdownMenu`, `Toast`,
  `Skeleton` e `Pagination`;
- toolbar search-first e filtros em Drawer em Tarefas, Ocorrências,
  Assistências, Custos, Importações e Auditoria;
- filtros de período/posto do Dashboard em Drawer;
- Tarefas com chips de filtros ativos e paginação compacta;
- formulários de Tarefa, Rotina, Ocorrência e Lançamento apresentados em
  Drawer, preservando as URLs existentes;
- criação/edição de usuários, postos e vínculos da Administração em Drawer;
- menus compactos para ações secundárias de postos, vínculos e metas;
- toasts para mutações administrativas;
- skeletons nas listagens e Dashboard;
- métricas do Dashboard navegáveis;
- cabeçalhos sticky e suporte a linhas clicáveis/colunas numéricas no padrão de
  tabela;
- remoção das classes legadas e do CSS morto apontados na verificação.

## Decisões de escopo

- `NewImportPage` permanece página por ser um fluxo com preview e múltiplas
  etapas;
- deep-links de criar/editar continuam válidos e abrem a superfície lateral;
- recaptura de screenshots, browser, Playwright e E2E continuam adiados pela
  restrição vigente do `AGENTS.md`;
- a abertura de detalhe de Assistência sobre a lista dependerá da homologação
  do padrão de Drawer, pois exige composição de rotas em background e não deve
  ser simulada apenas visualmente.

## Validação técnica

- testes de contrato cobrem Drawer, chips, busca, paginação e persistência da
  sidebar;
- testes de integração cobrem as listas migradas, Dashboard, Administração e
  formulários;
- `typecheck`, lint de aplicação/design system e build permanecem obrigatórios.
