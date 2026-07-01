# Tasks: Administração, Cadastros, Usuários, Permissões e Auditoria

**Input**: Design documents from `/specs/014-administracao-cadastros-auditoria/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Obrigatórios para banco, serviços, componentes e integração porque a
especificação exige cobertura de RLS, perfis, posto, concorrência, soft delete,
auditoria, segurança, acessibilidade e desempenho. Testes automatizados de
navegador/E2E ficam fora; o usuário fará a homologação manual.

**Organization**: Tarefas agrupadas por história para permitir implementação e
validação incremental. As User Stories 1–4 formam o MVP mínimo aprovado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Executável em paralelo por atuar em arquivo independente e não
  depender de tarefa incompleta.
- **[Story]**: História da especificação atendida.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar arquivos e massa de validação sem alterar contratos de
domínio.

- [ ] T001 Criar a estrutura do módulo administrativo com arquivos-base em `src/modules/administracao/types.ts`, `src/modules/administracao/administration-state.ts` e `src/modules/administracao/administration-service.ts`
- [ ] T002 [P] Criar os diretórios de testes e arquivos de setup em `tests/unit/administracao/` e `tests/integration/administracao/`
- [ ] T003 [P] Criar a massa administrativa com dois administradores, uma Supervisão, dois Operadores, três postos e estados variados em `supabase/seed/administracao_cadastros_auditoria.sql`
- [ ] T004 Gerar a migration com `supabase migration new administracao_cadastros_auditoria`, registrar o caminho retornado como `MIGRATION_FILE` e usar somente esse arquivo dentro de `supabase/migrations/` durante a feature
- [ ] T005 [P] Criar a documentação inicial de policies e superfície RPC em `supabase/policies/administracao_cadastros_auditoria.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Versionamento, segurança, auditoria e primitives compartilhadas que
bloqueiam todas as histórias.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

### Tests First

- [ ] T006 [P] Escrever testes de schema para versões, controles de vínculo, contexto de auditoria, índices, FKs `ON DELETE RESTRICT` e ausência de tabelas paralelas em `supabase/tests/administracao_schema.sql`
- [ ] T007 [P] Escrever testes de RLS/grants para Operador, Supervisão, Direção/Administração, URL/RPC direta e ausência de escrita direta em `supabase/tests/administracao_consultas_rls.sql`
- [ ] T008 [P] Escrever testes unitários da serialização de filtros, cursores e máquina de estados em `tests/unit/administracao/administration-state.test.ts`
- [ ] T009 [P] Escrever testes unitários de mapeamento dos erros canônicos e validação local de entrada em `tests/unit/administracao/administration-service.test.ts`

### Database Foundation

- [ ] T010 Adicionar `versao_registro`, checks, trigger monotônico, `updated_at`/`updated_by` de `usuarios_postos` e substituir as três FKs administrativas `ON DELETE CASCADE` por `ON DELETE RESTRICT` no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T011 Estender `historico_auditoria` somente com colunas de contexto e índices de cursor/filtro no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T012 Implementar helpers internos de contexto, sanitização recursiva e capacidades com `search_path = ''` no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T013 Remover `postos_supervisao_update` e `usuarios_postos_supervisao_update`, revogar escrita direta administrativa e aplicar grants mínimos às RPCs no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T014 Endurecer helpers existentes contra execução por `PUBLIC`/`anon`, preservar execuções exigidas por policies e documentar a matriz final em `supabase/policies/administracao_cadastros_auditoria.md`

### Frontend Foundation

- [ ] T015 Implementar tipos compartilhados, envelopes paginados, capacidades, cursores, estados e erros em `src/modules/administracao/types.ts`
- [ ] T016 Implementar filtros em URL, estados de lista/formulário, validação de cursor e detecção de filtro ativo em `src/modules/administracao/administration-state.ts`
- [ ] T017 Implementar cliente RPC compartilhado, mapeamento PT-BR de erros, limite 1–100 e releitura após resposta incerta em `src/modules/administracao/administration-service.ts`
- [ ] T018 [P] Implementar navegação interna dos recursos em `src/modules/administracao/components/AdminResourceNav.tsx`
- [ ] T019 [P] Implementar tabela administrativa acessível e estado de entidade em `src/modules/administracao/components/AdminTable.tsx` e `src/modules/administracao/components/EntityStateBadge.tsx`
- [ ] T020 [P] Implementar filtros compartilhados e diálogo de ação destrutiva com justificativa em `src/modules/administracao/components/AdminFilters.tsx` e `src/modules/administracao/components/DestructiveActionDialog.tsx`
- [ ] T021 Tornar as rotas-base `cadastros` e `historico-auditoria` disponíveis mantendo a matriz de perfis em `src/app/routes.ts`
- [ ] T022 Registrar subrotas lazy-loaded e preservar `ProtectedRoute` para todas as entradas administrativas em `src/app/router.tsx`
- [ ] T023 Atualizar testes de definição de rota, menu e acesso direto para a disponibilidade administrativa em `tests/unit/menu-config.test.ts` e `tests/integration/protected-routes.test.tsx`

**Checkpoint**: Fundação pronta; histórias 1–4 podem ser implementadas sobre os
mesmos contratos e a Story 5 pode endurecer os fluxos ao final.

---

## Phase 3: User Story 1 — Administrar usuários e permissões operacionais (Priority: P1)

**Goal**: Direção/Administração associa identidades Auth existentes e mantém
usuário, perfil, cargo, estado e histórico sem perder o último administrador;
Supervisão apenas consulta usuários do escopo.

**Independent Test**: Associar uma identidade pré-criada, editar usuário,
alterar perfil/cargo/estado, repetir pedidos e executar corrida entre dois
administradores, comprovando escopo e auditoria.

### Tests for User Story 1

- [ ] T024 [P] [US1] Escrever testes SQL da projeção mínima de Auth, associação, atualização, inativação, soft delete e idempotência de usuário em `supabase/tests/administracao_mutacoes.sql`
- [ ] T025 [P] [US1] Escrever testes SQL concorrentes que impedem remover ou inativar o último administrador em `supabase/tests/administracao_ultimo_admin.sql`
- [ ] T026 [P] [US1] Escrever testes de integração do serviço para lista, detalhe, identidades disponíveis e mutações de usuário em `tests/integration/administracao/users-service.test.ts`
- [ ] T027 [P] [US1] Escrever testes de interface para filtros, associação, edição, conflito e capacidades de Supervisão em `tests/integration/administracao/users-flow.test.tsx`

### Implementation for User Story 1

- [ ] T028 [US1] Implementar `listar_usuarios_administracao`, `obter_usuario_administracao` e `listar_identidades_auth_disponiveis` com projeção mínima no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T029 [US1] Implementar `salvar_usuario_administracao` com UUID idempotente, identidade Auth existente, allowlist e auditoria atômica no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T030 [US1] Implementar `alterar_estado_usuario_administracao` com versão esperada, advisory lock e proteção do último administrador no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T031 [US1] Adicionar métodos e tipos de lista, detalhe, associação e mutação de usuário em `src/modules/administracao/administration-service.ts` e `src/modules/administracao/types.ts`
- [ ] T032 [P] [US1] Implementar formulário de associação/edição sem campos de senha, token ou sessão em `src/modules/administracao/components/UserForm.tsx`
- [ ] T033 [US1] Implementar listagem pesquisável e filtrável de usuários em `src/modules/administracao/pages/UsersPage.tsx`
- [ ] T034 [US1] Implementar detalhe de usuário com perfil, cargo, estado, vínculos somente leitura e histórico contextual em `src/modules/administracao/pages/UserDetailPage.tsx`
- [ ] T035 [US1] Integrar as rotas de usuários e revalidação pós-mudança de perfil/estado em `src/app/router.tsx`

**Checkpoint**: Gestão de usuários funciona isoladamente e nunca provisiona
Auth nem deixa o sistema sem administrador.

---

## Phase 4: User Story 2 — Administrar postos e vínculos de acesso (Priority: P1)

**Goal**: Direção/Administração mantém postos e vínculos com impacto,
concorrência e auditoria; Supervisão consulta seu escopo sem escrever.

**Independent Test**: Criar/editar/inativar posto, inspecionar dependências,
adicionar/mudar/remover vínculo e repetir operação concorrente, confirmando
revogação de acesso e ausência de cascade.

### Tests for User Story 2

- [ ] T036 [P] [US2] Escrever testes SQL de consultas/mutações de posto, dependências, ausência de cascade e bloqueio de Supervisão em `supabase/tests/administracao_mutacoes_postos.sql`
- [ ] T037 [P] [US2] Escrever testes SQL de duplicidade, versão, remoção e revogação de vínculos em `supabase/tests/administracao_concorrencia.sql`
- [ ] T038 [P] [US2] Escrever testes de integração do serviço para postos, detalhes, capacidades e vínculos em `tests/integration/administracao/posts-links-service.test.ts`
- [ ] T039 [P] [US2] Escrever testes de interface para impactos, vínculo, remoção e acesso read-only de Supervisão em `tests/integration/administracao/posts-links-flow.test.tsx`

### Implementation for User Story 2

- [ ] T040 [US2] Implementar `listar_postos_administracao` e `obter_posto_administracao` com resumo autorizado de usuários, metas e dependências no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T041 [US2] Implementar `salvar_posto_administracao` e `alterar_estado_posto_administracao` sem cascade, com versão e auditoria no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T042 [US2] Implementar `salvar_vinculo_usuario_posto_administracao` e `remover_vinculo_usuario_posto_administracao` com níveis oficiais, unicidade e soft delete no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T043 [US2] Adicionar métodos/tipos de postos, dependências e vínculos ao serviço em `src/modules/administracao/administration-service.ts` e `src/modules/administracao/types.ts`
- [ ] T044 [P] [US2] Implementar formulário de posto com validação de nome, código e descrição em `src/modules/administracao/components/PostForm.tsx`
- [ ] T045 [P] [US2] Implementar gestão de vínculos com níveis, versão e confirmação de remoção em `src/modules/administracao/components/UserPostLinks.tsx`
- [ ] T046 [US2] Implementar listagem de postos com busca e filtros de estado em `src/modules/administracao/pages/PostsPage.tsx`
- [ ] T047 [US2] Implementar detalhe de posto com usuários, metas, dependências, impactos e ações autorizadas em `src/modules/administracao/pages/PostDetailPage.tsx`
- [ ] T048 [US2] Integrar rotas de postos e detalhes protegidos em `src/app/router.tsx`

**Checkpoint**: Postos e vínculos funcionam isoladamente; Supervisão não possui
qualquer caminho de escrita.

---

## Phase 5: User Story 3 — Administrar cargos e cadastros auxiliares (Priority: P1)

**Goal**: Manter cargos/funções, prioridades, tipos de ocorrência e metas
reutilizando integralmente validações, escopo e histórico existentes.

**Independent Test**: Executar CRUD lógico e estados de cada cadastro,
duplicidades e sobreposição de metas com os três perfis, preservando consumidores
históricos.

### Tests for User Story 3

- [ ] T049 [P] [US3] Escrever testes SQL de cargos, prioridades e tipos para normalização, duplicidade, estados, soft delete e permissões em `supabase/tests/administracao_cadastros_auxiliares.sql`
- [ ] T050 [P] [US3] Escrever testes SQL de metas para percentual, vigência, sobreposição, posto e gestão scoped de Supervisão em `supabase/tests/administracao_metas_eficiencia.sql`
- [ ] T051 [P] [US3] Escrever testes de integração do serviço para os quatro cadastros auxiliares e erros canônicos em `tests/integration/administracao/registries-service.test.ts`
- [ ] T052 [P] [US3] Escrever testes de interface para formulários, filtros, capacidades e conflitos dos cadastros em `tests/integration/administracao/registries-flow.test.tsx`

### Implementation for User Story 3

- [ ] T053 [US3] Implementar consultas paginadas de cargos, prioridades e tipos de ocorrência no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T054 [US3] Implementar consultas paginadas e scoped de metas de eficiência no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T055 [US3] Implementar RPCs de salvar/estado para cargos, prioridades e tipos preservando constraints da Spec 002 no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T056 [US3] Implementar RPCs de salvar/estado para metas com versão, sobreposição e autorização scoped no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T057 [US3] Adicionar métodos/tipos dos cadastros auxiliares e metas ao serviço em `src/modules/administracao/administration-service.ts` e `src/modules/administracao/types.ts`
- [ ] T058 [P] [US3] Implementar formulário tipado reutilizável para cargo, prioridade e tipo de ocorrência em `src/modules/administracao/components/AuxiliaryRegistryForm.tsx`
- [ ] T059 [P] [US3] Implementar formulário de meta com posto, tipo, percentual e vigência em `src/modules/administracao/components/EfficiencyGoalForm.tsx`
- [ ] T060 [US3] Implementar páginas de cargos, prioridades e tipos com configuração por entidade em `src/modules/administracao/pages/AuxiliaryRegistriesPage.tsx`
- [ ] T061 [US3] Implementar listagem/formulário de metas com escopo de Supervisão em `src/modules/administracao/pages/EfficiencyGoalsPage.tsx`
- [ ] T062 [US3] Integrar subrotas dos quatro cadastros em `src/app/router.tsx`

**Checkpoint**: Cadastros auxiliares e metas passam isoladamente pela matriz da
Spec 002 e não reescrevem referências existentes.

---

## Phase 6: User Story 4 — Consultar histórico e auditoria com segurança (Priority: P1)

**Goal**: Direção/Administração consulta auditoria global sanitizada; Supervisão
consulta somente eventos com contexto integral no escopo; Operador é negado.

**Independent Test**: Gerar eventos globais, scoped, multi-posto, removidos e
com chaves sensíveis; combinar filtros, abrir detalhes e navegar ao destino.

### Tests for User Story 4

- [ ] T063 [P] [US4] Escrever testes SQL de backfill/contexto, escopo vazio/multi-posto, filtros, paginação e imutabilidade em `supabase/tests/administracao_auditoria.sql`
- [ ] T064 [P] [US4] Escrever testes SQL de sanitização recursiva para senha, token, segredo, recovery e `raw_json` em `supabase/tests/administracao_auditoria_seguranca.sql`
- [ ] T065 [P] [US4] Escrever testes de integração do serviço para lista, detalhe, filtros, cursores e navegação relacionada em `tests/integration/administracao/audit-service.test.ts`
- [ ] T066 [P] [US4] Escrever testes de interface para escopo, comparação de valores, entidade ausente e metadata allowlisted em `tests/integration/administracao/audit-flow.test.tsx`

### Implementation for User Story 4

- [ ] T067 [US4] Implementar o trigger de normalização e executar o backfill conservador das colunas criadas em T011 para eventos existentes/novos no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T068 [US4] Implementar `listar_historico_auditoria` com filtros combináveis, cursor e regra integral de postos no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T069 [US4] Implementar `obter_evento_auditoria` com sanitização allowlisted e destino revalidável no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T070 [US4] Revogar SELECT direto de `authenticated` em `historico_auditoria` e comprovar que RPCs existentes de módulos continuam funcionais no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T071 [US4] Adicionar métodos/tipos de auditoria, filtros e cursores ao serviço em `src/modules/administracao/administration-service.ts` e `src/modules/administracao/types.ts`
- [ ] T072 [P] [US4] Implementar detalhe compreensível de valores anterior/novo e metadata permitida em `src/modules/administracao/components/AuditEventDetail.tsx`
- [ ] T073 [US4] Implementar página paginada de Histórico/Auditoria com filtros na URL em `src/modules/administracao/pages/AuditHistoryPage.tsx`
- [ ] T074 [US4] Integrar rota disponível de auditoria e navegação segura para entidades relacionadas em `src/app/router.tsx`

**Checkpoint**: O MVP das User Stories 1–4 está funcional, auditável e pode ser
homologado antes da Story 5.

---

## Phase 7: User Story 5 — Operar formulários e listagens confiáveis (Priority: P2)

**Goal**: Endurecer todas as telas para teclado, foco, erros, conflito, sessão,
clique duplo, resposta incerta e estados completos.

**Independent Test**: Na homologação manual do usuário, percorrer todas as telas
nos dois viewports, somente por teclado, simulando cada estado remoto,
concorrência e perda de autorização.

### Tests for User Story 5

- [ ] T075 [P] [US5] Escrever testes de integração dos estados loading, vazio, filtro vazio, erro, conflito, sessão expirada e acesso negado em `tests/integration/administracao/admin-states.test.tsx`
- [ ] T076 [P] [US5] Escrever testes unitários de foco inicial, associação de labels, diálogo e bloqueio de envio duplicado em `tests/unit/administracao/accessibility.test.tsx`

### Implementation for User Story 5

- [ ] T077 [US5] Completar estados remotos e preservação segura de rascunho em `src/modules/administracao/administration-state.ts`
- [ ] T078 [US5] Endurecer filtros, tabela, badges e diálogo para foco, teclado, ARIA, loading e repetição em `src/modules/administracao/components/AdminFilters.tsx`, `src/modules/administracao/components/AdminTable.tsx`, `src/modules/administracao/components/EntityStateBadge.tsx` e `src/modules/administracao/components/DestructiveActionDialog.tsx`
- [ ] T079 [US5] Aplicar conflito, sessão expirada, perda de autorização e releitura pós-resposta incerta em todas as páginas de `src/modules/administracao/pages/`
- [ ] T080 [US5] Criar estilos desktop-first e estados visuais sem dependência exclusiva de cor em `src/modules/administracao/administracao.css`
- [ ] T081 [US5] Integrar revalidação de contexto após mutação crítica sem manter dados protegidos antigos em `src/modules/administracao/administration-service.ts` e `src/modules/auth/AuthProvider.tsx`

**Checkpoint**: Todos os fluxos administrativos atendem confiabilidade e
acessibilidade transversal.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Fechar desempenho, documentação, regressões e gates.

- [ ] T082 [P] Escrever teste de desempenho com 10.000 registros/eventos e inspeção de cursores/filtros em `supabase/tests/administracao_desempenho.sql`
- [ ] T083 [P] Atualizar documentação final de RLS, RPCs, grants, índices e rollback em `supabase/policies/administracao_cadastros_auditoria.md`
- [ ] T084 [P] Atualizar fixtures/mocks compartilhados do Supabase para todas as RPCs administrativas em `tests/helpers/supabase-mocks.ts` e `tests/helpers/administracao-fixtures.ts`
- [ ] T085 Executar e corrigir regressões em `supabase/tests/fundacao_operacional_rls.sql`, `supabase/tests/cadastros_base_rls.sql`, `supabase/tests/autenticacao_web_auditoria.sql`, `supabase/tests/gestao_importacoes_mms_auditoria.sql` e `supabase/tests/assistencias_mms_interface_historico.sql`
- [ ] T086 Executar `npm run typecheck`, `npm run lint`, `npm run test` e `npm run build` conforme `specs/014-administracao-cadastros-auditoria/quickstart.md`
- [ ] T087 Executar testes SQL transacionais, `supabase db lint` e advisors, corrigindo achados no `MIGRATION_FILE` criado em T004 dentro de `supabase/migrations/`
- [ ] T088 Validar que bundle, respostas e eventos não contêm senha, token, segredo, chave privilegiada, recovery ou `raw_json` conforme `specs/014-administracao-cadastros-auditoria/contracts/audit-contract.md`
- [ ] T089 Revisar o checklist dos sete cenários, registrar ambiente/commit e marcar `Aguardando homologação manual do usuário`, sem executar automação de navegador, em `specs/014-administracao-cadastros-auditoria/quickstart.md`
- [ ] T090 Revalidar os gates constitucionais de RLS/perfil/posto, soft delete, auditoria central, preservação MMS e desktop-first em `specs/014-administracao-cadastros-auditoria/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: início imediato.
- **Phase 2 — Foundational**: depende da Phase 1 e bloqueia todas as histórias.
- **US1, US2, US3 e US4**: dependem da Phase 2; podem ser desenvolvidas por
  frentes distintas, mas alterações no mesmo arquivo de migration devem ser
  serializadas na ordem US1 → US2 → US3 → US4.
- **US5**: depende das telas escolhidas de US1–US4 para aplicar endurecimento
  transversal.
- **Polish**: depende das histórias incluídas na entrega; para o MVP, depende de
  US1–US4.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 ─┐
                     -> US2 ├-> MVP validation -> US5 -> Polish
                     -> US3 ┤
                     -> US4 ┘
```

### User Story Dependencies

- **US1 (P1)**: sem dependência funcional de outra história após Foundation.
- **US2 (P1)**: usa usuários existentes, mas pode ser testada com seed sem a UI
  de US1.
- **US3 (P1)**: independente após Foundation; reutiliza postos do seed.
- **US4 (P1)**: independente após Foundation; usa eventos gerados por seed/teste.
- **US5 (P2)**: transversal e executada após as telas a endurecer.

### Within Each User Story

- Escrever testes primeiro e confirmar falha pelo comportamento ausente.
- Implementar RPCs antes do serviço.
- Implementar serviço/tipos antes das páginas.
- Integrar rotas após a página existir.
- Executar o teste independente no checkpoint da história.

## Parallel Opportunities

- T002, T003 e T005 podem executar em paralelo após T001/T004 conforme o arquivo.
- T006–T009 são paralelas por arquivo.
- T018–T020 são paralelas.
- Em cada história, tarefas de testes marcadas [P] são paralelas.
- Componentes marcados [P] podem avançar enquanto RPC/serviço é implementado
  contra os contratos tipados.
- US1–US4 podem avançar em paralelo com migrations temporárias separadas; antes
  de concluir, consolidar na única migration da feature em ordem determinística.

## Parallel Examples

### User Story 1

```text
T024 SQL de mutações de usuário
T025 SQL do último administrador
T026 integração do serviço de usuários
T027 interface do fluxo de usuários
T032 componente UserForm
```

### User Story 2

```text
T036 SQL de postos
T037 SQL de vínculos/concorrência
T038 integração do serviço
T039 interface do fluxo
T044 PostForm
T045 UserPostLinks
```

### User Story 3

```text
T049 SQL de cadastros globais
T050 SQL de metas
T051 integração do serviço
T052 interface dos cadastros
T058 AuxiliaryRegistryForm
T059 EfficiencyGoalForm
```

### User Story 4

```text
T063 SQL de escopo/contexto
T064 SQL de sanitização
T065 integração do serviço
T066 interface de auditoria
T072 AuditEventDetail
```

### User Story 5

```text
T075 estados de interface
T076 acessibilidade unitária
```

## Implementation Strategy

### MVP First — User Stories 1–4

1. Concluir Setup.
2. Concluir Foundation e passar T006–T009.
3. Implementar US1 e validar associação/último administrador.
4. Implementar US2 e validar postos/vínculos.
5. Implementar US3 e validar cadastros/metas.
6. Implementar US4 e validar auditoria sanitizada/scoped.
7. Parar e executar T085–T089 antes de considerar o MVP pronto para a
   homologação manual do usuário.

### Incremental Delivery

1. Foundation segura.
2. US1 entrega identidade e administração de acesso.
3. US2 entrega escopo por posto.
4. US3 entrega cadastros consumidores.
5. US4 fecha rastreabilidade central.
6. US5 melhora confiabilidade e acessibilidade sem mudar regras.

## Notes

- Nenhuma tarefa cria perfil, tabela de histórico, cadastro de responsável ou
  status genérico.
- Nenhuma tarefa implementa convite/criação Auth; identidades são pré-criadas.
- Nenhuma tarefa usa `service_role` no navegador.
- Restauração e DELETE físico permanecem fora do escopo.
- Commits devem agrupar tarefas por contrato/história e preservar mudanças
  alheias já existentes no worktree.
