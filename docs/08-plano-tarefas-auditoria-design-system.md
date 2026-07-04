# Plano de tarefas da auditoria de design system

**Data da validação:** 04/07/2026  
**Fonte analisada:** `doka_auditoria_design_layout_v2.md`  
**Escopo da validação:** análise estática do código atual, sem navegador,
Playwright, screenshots ou homologação visual.

## 1. Parecer

O diagnóstico central da auditoria está correto: o projeto possui tokens e
primitives adequados, mas as telas dos módulos adotam essa fundação de forma
inconsistente. A maior parte da irregularidade vem de CSS local recriando
cores, tipografia, controles, botões, tabelas, abas, badges e estruturas de
página.

A auditoria não deve, porém, ser executada literalmente. O plano original
propõe componentes demais antes de validar sua necessidade, usa alguns
critérios absolutos que gerariam falsos positivos e inclui polimentos que não
são prioritários para o MVP interno.

### 1.1 Evidências confirmadas no código

Linha de base obtida em `src/modules`:

| Indicador                                         | Quantidade |
| ------------------------------------------------- | ---------: |
| Arquivos CSS de módulos                           |         14 |
| Usos de aliases inexistentes `var(--color-*)`     |         76 |
| Cores hexadecimais em CSS de módulos              |        142 |
| Declarações locais de `font-size`                 |         35 |
| Declarações de `font-size` que já usam `--text-*` |          7 |
| Declarações locais de `font-weight`               |         38 |
| Declarações de `font-weight` que já usam `--fw-*` |          4 |
| Controles nativos em TSX de módulos               |         99 |
| Declarações de `transition` em CSS de módulos     |          0 |
| Seletores `:hover` em CSS de módulos              |          1 |

Os maiores concentradores de aliases e cores locais são:

1. Tarefas e Rotinas;
2. Administração;
3. Deslocamentos e Custos;
4. Ocorrências;
5. Dashboard;
6. Assistências MMS.

Também foram confirmados:

- links com aparência de botão recriados em Tarefas, Ocorrências,
  Lançamentos e Importações;
- controles com altura, raio, borda, fonte e foco diferentes por módulo;
- cabeçalhos, tabelas, status e abas repetidos;
- `max-width` e padding de página duplicados em módulos;
- dois padrões de dialog sem um contrato compartilhado;
- `.doka-login-form` usado sem estilo correspondente;
- estratégia desktop-only já estabelecida em `src/styles/app.css` e
  `AppShell.css`, apesar de media queries menores espalhadas pelos módulos;
- tokens duplicados em `design-system/tokens/*` e
  `src/styles/design-system.css`, com risco de divergência manual.

### 1.2 Ajustes necessários na auditoria original

- **Manter desktop-only no MVP.** A decisão já está expressa no código:
  validação primária em 1440x900 e mínima em 1280x720. Não iniciar sidebar
  móvel, tabelas em cards ou responsividade completa nesta etapa.
- **Não exigir zero hex sem contexto.** Cores definidas como dado de negócio,
  valores de transparência tecnicamente justificados e a própria definição de
  tokens podem ser exceções. Hex visual em CSS de módulo deve ser eliminado ou
  explicitamente justificado.
- **Não proibir todo controle HTML nativo.** Os componentes oficiais devem ser
  o padrão, mas `input[type=file]`, controles ocultos e casos sem primitive
  equivalente podem permanecer com justificativa.
- **Não adicionar hover indiscriminadamente.** Hover, cursor e elevação devem
  existir somente em elementos interativos. Cards informativos e linhas não
  clicáveis não devem sugerir ação.
- **Não criar todos os componentes propostos antecipadamente.** `Stepper`,
  `ProgressBar`, `RowActions`, `MetadataGrid`, density toggle e ordenação
  genérica ficam condicionados a pelo menos dois usos reais.
- **Não copiar componentes diretamente da pasta `design-system`.** O app usa
  adaptações React/TypeScript em `src/components`; a pasta externa é referência
  de contrato visual, não API pronta do aplicativo.
- **Não tratar a contagem “6 telas” ou “11 componentes” como critério de
  aceite.** Essas quantidades dependem do recorte adotado e não substituem a
  verificação por arquivo e comportamento.

## 2. Princípios de execução

- Preservar regras de negócio, RLS, permissões, rotas e contratos dos services.
- Trabalhar em fatias verticais pequenas: componente compartilhado, migração
  de uma tela, testes mínimos e verificações técnicas.
- Reutilizar os primitives existentes antes de criar novos.
- Manter CSS de módulo apenas para composição específica.
- Não transformar a correção visual em reescrita geral do frontend.
- Não executar browser, E2E ou homologação visual nesta etapa.
- Validar por testes de componente, typecheck, lint e build.

## 3. Tarefas

### Fase 1 — Governança e fundação mínima

#### DS-001 — Definir a fonte de verdade dos tokens

- [ ] Documentar `design-system/tokens/*` como referência de origem e
      `src/styles/design-system.css` como bundle consumido pelo app.
- [ ] Comparar nomes e valores duplicados e corrigir divergências reais.
- [ ] Definir um processo simples de sincronização ou verificação para evitar
      alterações manuais incompatíveis.

**Aceite:** não existem tokens com o mesmo nome e valores diferentes entre a
referência e o bundle do app; a regra de atualização está documentada.

#### DS-002 — Registrar regras obrigatórias de UI

- [ ] Acrescentar ao `AGENTS.md` uma seção curta de adoção do design system.
- [ ] Exigir tokens oficiais para cor, tipografia, espaçamento e raio.
- [ ] Exigir busca por componente existente antes de criar CSS local.
- [ ] Registrar as exceções permitidas para hex e controles nativos.
- [ ] Definir nomenclatura e localização dos componentes compartilhados.

**Aceite:** novas tarefas de frontend conseguem identificar, no próprio
repositório, quais primitives e tokens devem usar.

#### DS-003 — Criar verificação estática proporcional

- [ ] Integrar ao lint regras para detectar `var(--color-*)` em módulos.
- [ ] Detectar hex visual, fonte e peso fora de token em CSS de módulos.
- [ ] Adotar allowlist pequena e comentada para exceções legítimas.
- [ ] Fazer a verificação falhar somente depois de migrar o legado abrangido.

**Aceite:** uma nova infração simples é detectada automaticamente, sem bloquear
casos explicitamente permitidos.

#### DS-004 — Corrigir gaps pequenos dos primitives existentes

- [ ] Trocar o foreground hardcoded do `IconButton` primário pelo token
      semântico correto.
- [ ] Criar o estilo ausente de `.doka-login-form` ou remover a dependência da
      classe.
- [ ] Revisar estados `hover`, `active`, `focus-visible`, `disabled` e
      `prefers-reduced-motion` de `Button`, `IconButton`, `Input` e `Card`.
- [ ] Não alterar o comportamento funcional dos componentes.

**Aceite:** primitives existentes não dependem de cores visuais hardcoded e o
formulário de login possui composição consistente.

### Fase 2 — Componentes compartilhados necessários

Criar somente nesta ordem, com teste de contrato e CSS baseado em tokens:

#### DS-005 — Controles de formulário

- [ ] Criar `Field`, `Select` e `Textarea`.
- [ ] Garantir label associado, hint, erro, disabled e tamanhos oficiais.
- [ ] Reutilizar a composição visual do `Input` atual.
- [ ] Criar `Checkbox` somente ao migrar o primeiro uso real.

**Aceite:** `Input`, `Select` e `Textarea` compartilham altura, tipografia,
borda, radius, foco e mensagens.

#### DS-006 — Estrutura de página

- [ ] Criar `Page` com variantes `default`, `narrow` e `wide`.
- [ ] Criar `PageHeader` com eyebrow opcional, título, descrição e ações.
- [ ] Definir que `AppShell` controla o espaço externo e `Page` controla
      largura e ritmo vertical.

**Aceite:** uma tela migrada não define padding externo, `max-width` ou
`margin: 0 auto` localmente.

#### DS-007 — Ações de navegação

- [ ] Criar `ButtonLink` compatível com React Router e variantes do `Button`.
- [ ] Remover o uso manual de classes `.doka-button` em elementos `Link`.
- [ ] Preservar semântica de link para navegação e de botão para ação.

**Aceite:** CTAs de navegação não recriam estilo local nem simulam botão por
concatenação manual de classes.

#### DS-008 — Status e abas

- [ ] Criar `StatusBadge` com tones semânticos e mapeamento explícito dos
      estados de domínio.
- [ ] Criar `Tabs` nas variantes `underline` e `segmented` somente se ambas
      forem necessárias durante a migração.
- [ ] Garantir foco visível e navegação por teclado.

**Aceite:** a mesma intenção semântica usa a mesma cor em todos os módulos
migrados.

#### DS-009 — Tabela operacional mínima

- [ ] Padronizar wrapper, cabeçalho, células, coluna numérica, estado vazio e
      overflow horizontal.
- [ ] Preferir componentes de estrutura (`Table`, `TableHead`, `TableRow`,
      `TableCell`) a uma API genérica de colunas se isso preservar melhor as
      células específicas atuais.
- [ ] Aplicar hover apenas a linhas clicáveis.
- [ ] Não implementar ordenação, seleção, paginação ou density toggle sem uso
      atual.

**Aceite:** duas listagens reais compartilham estrutura visual sem perder
conteúdo ou ações específicas.

#### DS-010 — Dialog acessível

- [ ] Criar `Dialog` com backdrop, título, descrição, ações e tamanhos.
- [ ] Implementar foco inicial, contenção/retorno de foco e fechamento por
      Escape.
- [ ] Exigir confirmação explícita nas ações destrutivas.
- [ ] Respeitar `prefers-reduced-motion`.

**Aceite:** os dialogs de Importações e Assistências usam o mesmo contrato e
passam por testes de teclado e acessibilidade disponíveis em jsdom.

### Fase 3 — Migração incremental das telas

Cada item inclui: trocar aliases e valores visuais locais por tokens, substituir
primitives duplicados, preservar comportamento, atualizar testes afetados e
remover CSS morto.

#### DS-011 — Piloto em Ocorrências

- [ ] Migrar lista, filtros, tabs, tabela, status e CTA.
- [ ] Migrar formulário e páginas de detalhe para controles oficiais.
- [ ] Usar o piloto para ajustar as APIs compartilhadas antes dos demais
      módulos.

**Aceite:** zero `var(--color-*)` em Ocorrências; hex visual apenas em allowlist
justificada; fluxo principal e testes existentes preservados.

#### DS-012 — Tarefas e Rotinas

- [ ] Migrar cabeçalhos, CTAs, tabs, filtros, formulários, tabelas e status.
- [ ] Preservar recortes operacionais, permissões e transições.
- [ ] Remover largura de página e estilos locais equivalentes aos componentes.

**Aceite:** mesmos critérios do piloto, sem regressão das regras de perfil e
posto.

#### DS-013 — Deslocamentos e Custos

- [ ] Migrar lista, filtros, formulários, detalhe, CTAs, tabela e status.
- [ ] Reservar vermelho para perigo/erro, não para ação primária.
- [ ] Preservar totais, validação, soft delete e auditoria.

**Aceite:** mesmos critérios do piloto e CTA primária usando a marca oficial.

#### DS-014 — Administração

- [ ] Migrar tabs, fields, tabelas, status e cards de seção.
- [ ] Manter o seletor de cor de prioridade como dado de negócio justificado,
      sem confundi-lo com cor estrutural da UI.
- [ ] Preservar proteção do último administrador e escopos atuais.

**Aceite:** CSS de página trata composição, não recria primitives.

#### DS-015 — Dashboard e Assistências MMS

- [ ] Migrar filtros, cards, tabelas, status, headers e detalhes.
- [ ] Substituir aliases frágeis por tokens semânticos.
- [ ] Aplicar interatividade apenas aos cards e linhas que realmente navegam
      ou executam ação.
- [ ] Unificar o dialog de correção de Assistências.

**Aceite:** métricas e dados exibidos permanecem idênticos; não há
`var(--color-*)` nesses módulos.

#### DS-016 — Importações MMS

- [ ] Preservar a base já alinhada de `NewImportPage`.
- [ ] Migrar a listagem antiga, filtros, tabs, tabela, status e CTAs.
- [ ] Migrar reprocessamento e desfazer importação para o `Dialog` oficial.
- [ ] Manter `input[type=file]` como exceção encapsulada no `FileDropzone`.

**Aceite:** os fluxos novo e legado compartilham a mesma linguagem visual e os
dialogs possuem backdrop e comportamento de foco.

#### DS-017 — Histórico/Auditoria e Login

- [ ] Migrar filtros e lista de eventos da Auditoria.
- [ ] Manter blocos técnicos de valores anteriores/novos legíveis, sem criar
      uma abstração genérica prematura.
- [ ] Aplicar a composição corrigida ao Login e demais formulários públicos.

**Aceite:** Auditoria usa tokens e controles oficiais; Login não possui classes
sem definição.

### Fase 4 — Fechamento técnico

#### DS-018 — Limpeza e verificações

- [ ] Remover CSS morto e aliases legados abrangidos.
- [ ] Executar a verificação estática final.
- [ ] Executar testes unitários e de componentes relevantes.
- [ ] Executar `npm run typecheck`.
- [ ] Executar `npm run lint`.
- [ ] Executar `npm run build`.
- [ ] Registrar exceções restantes e justificativas.

**Aceite mínimo:**

- zero `var(--color-*)` em `src/modules`;
- zero hex visual não justificado em CSS de módulos;
- `font-size` e `font-weight` estruturais usando tokens;
- links de ação usando `ButtonLink`;
- controles oficiais usados quando houver equivalente;
- dialogs de Importações e Assistências unificados;
- typecheck, lint, testes essenciais e build aprovados.

## 4. Itens explicitamente adiados

- Responsividade mobile/tablet real;
- sidebar colapsável ou drawer;
- tabelas convertidas em cards;
- skeleton universal;
- tooltips universais;
- chips de filtros aplicados;
- ordenação e paginação genéricas;
- density toggle;
- `Stepper` e `ProgressBar` genéricos;
- gráficos ou alterações de produto no Dashboard;
- homologação visual automatizada.

Esses itens só devem entrar após homologação operacional ou quando um fluxo
real demonstrar necessidade.

## 5. Ordem recomendada de execução

1. DS-001 a DS-004;
2. DS-005 a DS-010 conforme exigidos pelo piloto;
3. DS-011;
4. DS-012 a DS-014;
5. DS-015 a DS-017;
6. DS-018.

A migração deve ocorrer por módulo completo, evitando uma etapa global de
“criar todos os componentes” sem consumo real.

## 6. Resultado da execução

Implementação concluída em 04/07/2026:

- fonte de verdade e verificação de sincronização dos tokens documentadas;
- lint estático adicionado para aliases, hex visual e tipografia local;
- primitives e composição pública corrigidas;
- componentes compartilhados de página, navegação, formulário, abas, status,
  tabela, dialog e métricas criados com consumo real;
- módulos operacionais, administrativos e estados públicos migrados;
- zero `var(--color-*)`, hex visual, `font-size` numérico ou `font-weight`
  numérico em CSS de `src/modules`;
- dialogs de Assistências e Importações consolidados, com Escape, contenção e
  retorno de foco;
- multiselects nativos de responsáveis substituídos por grupos de checkbox;
- homologação visual e recaptura de screenshots mantidas para etapa posterior,
  pois browser, Playwright e E2E estão proibidos nesta fase.
