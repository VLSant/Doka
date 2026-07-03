# Tasks: Central de Tarefas, Rotinas Recorrentes e Estratégias Operacionais

**Input**: Design documents from `/specs/010-tarefas-rotinas/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: Obrigatórios por decisão da spec e do plano. Em cada história,
escrever os testes indicados antes da implementação e confirmar que falham pelo
motivo esperado.

**Organization**: Tarefas agrupadas por história de usuário para permitir
incrementos verificáveis. A migration é criada pelo CLI; todas as referências a
`supabase/migrations/<timestamp>_tarefas_rotinas.sql` significam o arquivo
efetivamente gerado por `supabase migration new tarefas_rotinas`.

**Claude handoff**: A Spec 010 já é o contexto ativo em `.specify/feature.json`
e `AGENTS.md`; comandos Spec Kit podem ser executados diretamente nesta
implantação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo porque atua em arquivos distintos e
  não depende de outra tarefa incompleta do mesmo grupo.
- **[Story]**: História da spec atendida pela tarefa.
- Todas as tarefas incluem o caminho exato do arquivo ou diretório afetado.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar os arquivos e componentes compartilhados sem alterar o
escopo da aplicação.

- [ ] T001 Executar `supabase migration new tarefas_rotinas` e criar o arquivo base em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T002 [P] Portar Select, Tabs e StatusPill do design system para `src/components/ui/Select.tsx`, `src/components/ui/Tabs.tsx`, `src/components/ui/StatusPill.tsx` e respectivos arquivos CSS
- [ ] T003 [P] Criar fixtures reutilizáveis de usuários, postos, tarefas, rotinas, relógio operacional e respostas RPC em `tests/helpers/tarefas-rotinas-fixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar schema, segurança e infraestrutura comum que bloqueiam todas
as histórias.

**CRITICAL**: Nenhuma história começa antes deste checkpoint.

- [ ] T004 [P] Escrever testes iniciais de tipos, tabelas, FKs, constraints, índices, soft delete e RLS em `supabase/tests/tarefas_rotinas_schema_rls.sql`
- [ ] T005 [P] Escrever testes iniciais de grants, funções privadas, ator derivado e ausência de auditoria falsa em `supabase/tests/tarefas_rotinas_auditoria.sql`
- [ ] T006 Criar enums e as tabelas `tarefas`, `tarefa_responsaveis`, `rotinas`, `rotina_responsaveis` e `rotina_execucoes` em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T007 Adicionar validações, FKs circulares controladas, unicidades parciais, versões monotônicas e índices de filtros/FKs/job em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T008 Implementar helpers privados de escopo, elegibilidade e capacidades por perfil/posto em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T009 Habilitar RLS nas cinco tabelas, criar policies de leitura e revogar mutações diretas de `anon` e `authenticated` em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T010 Implementar helpers comuns de auditoria, incremento de versão e validação de soft delete em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T011 [P] Definir tipos de domínio, filtros, cursores, capacidades, estados e códigos de erro em `src/modules/tarefas-rotinas/types.ts`
- [ ] T012 Implementar cliente RPC base e mapeamento seguro de erros em `src/modules/tarefas-rotinas/task-service.ts`
- [ ] T013 Implementar serialização de filtros, cursor, estados remotos e confirmação após resposta incerta em `src/modules/tarefas-rotinas/task-state.ts`
- [ ] T014 [P] Escrever testes unitários fundacionais de cursor, serialização, códigos de erro e confirmação após resposta incerta em `tests/unit/tarefas-rotinas/task-state.test.ts`

**Checkpoint**: Schema, RLS, auditoria base, tipos e fronteira de serviço prontos.

---

## Phase 3: User Story 1 - Cadastrar e atribuir uma atividade manual (Priority: P1) — MVP

**Goal**: Supervisão e Direção/Administração criam tarefas avulsas ou estratégias
com responsáveis elegíveis e as localizam na lista autorizada.

**Independent Test**: Criar uma tarefa completa, atribuir vários responsáveis,
localizá-la na lista e provar bloqueio de Operador, posto ou cadastro inválido.

### Tests for User Story 1

- [ ] T015 [P] [US1] Escrever testes SQL de criação/edição, responsáveis, opções elegíveis, lista e detalhe em `supabase/tests/tarefas_rotinas_comandos.sql`
- [ ] T016 [P] [US1] Escrever testes do contrato de lista, detalhe, opções e salvamento em `tests/integration/tarefas-rotinas/task-service.test.ts`
- [ ] T017 [P] [US1] Escrever testes de formulário, validação, permissões e lista mínima em `tests/integration/tarefas-rotinas/task-create-list.test.tsx`

### Implementation for User Story 1

- [ ] T018 [US1] Implementar `listar_opcoes_tarefa_rotina`, `listar_tarefas`, `obter_tarefa` e `salvar_tarefa` com grants explícitos em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T019 [P] [US1] Implementar métodos de opções, lista, detalhe e salvamento em `src/modules/tarefas-rotinas/task-service.ts`
- [ ] T020 [P] [US1] Implementar formulário acessível de tarefa avulsa/estratégia em `src/modules/tarefas-rotinas/components/TaskForm.tsx` e `src/modules/tarefas-rotinas/components/TaskForm.css`
- [ ] T021 [P] [US1] Implementar filtros básicos e sincronização inicial com URL em `src/modules/tarefas-rotinas/components/TaskFilters.tsx` e `src/modules/tarefas-rotinas/components/TaskFilters.css`
- [ ] T022 [P] [US1] Implementar lista mínima com prazo, prioridade, responsáveis e estados vazios/erro em `src/modules/tarefas-rotinas/components/TaskList.tsx` e `src/modules/tarefas-rotinas/components/TaskList.css`
- [ ] T023 [US1] Implementar página de criação/edição com conflito preservando rascunho em `src/modules/tarefas-rotinas/pages/TaskFormPage.tsx`
- [ ] T024 [US1] Implementar página central com aba Hoje/Pendentes e paginação por cursor em `src/modules/tarefas-rotinas/pages/TaskCenterPage.tsx` e `src/modules/tarefas-rotinas/pages/TaskCenterPage.css`
- [ ] T025 [US1] Tornar `tarefas-rotinas` disponível e registrar rotas de lista, nova tarefa, detalhe e edição em `src/app/routes.ts` e `src/app/router.tsx`

**Checkpoint**: Cadastro manual e lista autorizada funcionam como MVP
independente.

---

## Phase 4: User Story 2 - Executar, validar e reabrir uma tarefa (Priority: P1)

**Goal**: Responsáveis iniciam/concluem; Supervisão e Direção validam/reabrem
com transições, versão e auditoria corretas.

**Independent Test**: Percorrer tarefa simples e tarefa com validação, incluindo
múltiplos responsáveis, repetição, conflito, ator não autorizado e reabertura.

### Tests for User Story 2

- [ ] T026 [P] [US2] Estender testes SQL com todas as transições, múltiplos responsáveis e conclusões idempotentes em `supabase/tests/tarefas_rotinas_comandos.sql`
- [ ] T027 [P] [US2] Escrever testes SQL de dois concluintes, validação/reabertura concorrentes e versão antiga em `supabase/tests/tarefas_rotinas_concorrencia.sql`
- [ ] T028 [P] [US2] Escrever testes frontend de ações, capacidades, conflito e resposta incerta em `tests/integration/tarefas-rotinas/task-transitions.test.tsx`

### Implementation for User Story 2

- [ ] T029 [US2] Implementar `transicionar_tarefa` com lock, versão, matriz de estados e conclusão das execuções vinculadas em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T030 [P] [US2] Adicionar transição e releitura de confirmação ao serviço em `src/modules/tarefas-rotinas/task-service.ts`
- [ ] T031 [P] [US2] Implementar painel de detalhe com autoria, responsáveis, conclusão, validação e reabertura em `src/modules/tarefas-rotinas/components/TaskDetail.tsx` e `src/modules/tarefas-rotinas/components/TaskDetail.css`
- [ ] T032 [P] [US2] Implementar diálogo acessível de concluir, validar e reabrir com justificativa em `src/modules/tarefas-rotinas/components/TaskTransitionDialog.tsx`
- [ ] T033 [US2] Implementar página de detalhe e atualização após transição/conflito em `src/modules/tarefas-rotinas/pages/TaskDetailPage.tsx`
- [ ] T034 [US2] Integrar ações permitidas e fila de Validação na lista central em `src/modules/tarefas-rotinas/pages/TaskCenterPage.tsx`

**Checkpoint**: Fluxo completo de status funciona sem recorrência.

---

## Phase 5: User Story 3 - Gerar e acumular rotinas sem duplicação (Priority: P1)

**Goal**: Criar rotinas, materializar previsões, gerar tarefas uma vez,
recuperar atrasos e acumular ocorrências sobre a mesma tarefa aberta.

**Independent Test**: Criar rotina, repetir o processamento, acumular períodos,
concluir a tarefa compartilhada e gerar nova tarefa futura sem duplicidade.

### Tests for User Story 3

- [ ] T035 [P] [US3] Escrever testes SQL de frequências, último dia do mês, janela, versão, pausa e recuperação atrasada em `supabase/tests/tarefas_rotinas_recorrencia.sql`
- [ ] T036 [P] [US3] Estender testes SQL com job sobreposto, rotina alterada durante geração e falha intermediária em `supabase/tests/tarefas_rotinas_concorrencia.sql`
- [ ] T037 [P] [US3] Escrever testes unitários de validação/descrição das combinações de recorrência em `tests/unit/tarefas-rotinas/recurrence.test.ts`
- [ ] T038 [P] [US3] Escrever testes de formulário, estados e impactos futuros da rotina em `tests/integration/tarefas-rotinas/routine-form.test.tsx`

### Implementation for User Story 3

- [ ] T039 [US3] Implementar cálculo de elegibilidade, último dia mensal e materialização da janela de 90 dias em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T040 [US3] Implementar processamento em lote, trava do job, snapshot, geração atômica e acúmulo em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T041 [US3] Implementar `salvar_rotina`, `alterar_estado_rotina`, `listar_rotinas` e `obter_rotina` em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T042 [US3] Habilitar `pg_cron`, registrar o job `doka-processar-rotinas` de cinco minutos e endurecer grants da função privada em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T043 [P] [US3] Implementar validação e descrição legível de recorrências em `src/modules/tarefas-rotinas/recurrence.ts`
- [ ] T044 [P] [US3] Adicionar métodos de rotina e respostas de geração ao serviço em `src/modules/tarefas-rotinas/task-service.ts`
- [ ] T045 [P] [US3] Implementar formulário acessível de rotina e combinações condicionais em `src/modules/tarefas-rotinas/components/RoutineForm.tsx` e `src/modules/tarefas-rotinas/components/RoutineForm.css`
- [ ] T046 [P] [US3] Implementar lista/detalhe de rotinas, próxima ocorrência e ações de estado em `src/modules/tarefas-rotinas/components/RoutineList.tsx` e `src/modules/tarefas-rotinas/components/RoutineDetail.tsx`
- [ ] T047 [US3] Implementar página de criação/edição de rotina com aviso de impacto futuro em `src/modules/tarefas-rotinas/pages/RoutineFormPage.tsx`
- [ ] T048 [US3] Registrar rotas de nova rotina e detalhe/edição de rotina em `src/app/router.tsx`
- [ ] T049 [US3] Integrar aba Rotinas, indicadores de acúmulo e origem recorrente em `src/modules/tarefas-rotinas/pages/TaskCenterPage.tsx` e `src/modules/tarefas-rotinas/components/TaskList.tsx`

**Checkpoint**: Rotinas e acúmulo funcionam independentemente de kanban e
calendário.

---

## Phase 6: User Story 4 - Acompanhar o mesmo trabalho em três visualizações (Priority: P2)

**Goal**: Lista, kanban e calendário compartilham escopo, filtros, atraso,
acúmulo e transições.

**Independent Test**: Aplicar filtros idênticos nas três visões e comparar
conjunto, estados e ações, confirmando que consultar calendário não gera tarefa.

### Tests for User Story 4

- [ ] T050 [P] [US4] Escrever testes SQL de filtros combinados, cursores, calendário somente leitura e resumo futuro em `supabase/tests/tarefas_rotinas_desempenho.sql`
- [ ] T051 [P] [US4] Escrever testes frontend de equivalência entre lista, kanban, calendário e URL em `tests/integration/tarefas-rotinas/task-views.test.tsx`
- [ ] T052 [P] [US4] Escrever testes unitários de abas, filtros, atraso e serialização de período em `tests/unit/tarefas-rotinas/task-state.test.ts`

### Implementation for User Story 4

- [ ] T053 [US4] Completar filtros/cursor de `listar_tarefas` e implementar `listar_calendario_tarefas_rotinas` e `resumir_tarefas_dashboard` em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T054 [P] [US4] Implementar kanban acessível com ação explícita equivalente à movimentação em `src/modules/tarefas-rotinas/components/TaskKanban.tsx` e `src/modules/tarefas-rotinas/components/TaskKanban.css`
- [ ] T055 [P] [US4] Implementar calendário diário/semanal/mensal e distinção de previsão/gerada/acumulada em `src/modules/tarefas-rotinas/components/TaskCalendar.tsx` e `src/modules/tarefas-rotinas/components/TaskCalendar.css`
- [ ] T056 [P] [US4] Completar filtros compartilhados e recortes Hoje/Pendentes/Atrasadas/Concluídas/Validação em `src/modules/tarefas-rotinas/components/TaskFilters.tsx`
- [ ] T057 [US4] Integrar Tabs, query string, paginação e as três visualizações no mesmo conjunto em `src/modules/tarefas-rotinas/pages/TaskCenterPage.tsx`

**Checkpoint**: As três visualizações são coerentes e completas.

---

## Phase 7: User Story 5 - Preservar segurança, histórico e remoção lógica (Priority: P2)

**Goal**: Completar histórico projetado, soft delete, URL direta e defesa em
profundidade para os três perfis.

**Independent Test**: Exercitar matriz perfil/posto por UI e RPC, remover
logicamente, consultar histórico permitido e provar ausência de vazamento ou
auditoria falsa.

### Tests for User Story 5

- [ ] T058 [P] [US5] Completar testes SQL da matriz RLS, grants, soft delete, histórico e automação sem ator humano em `supabase/tests/tarefas_rotinas_auditoria.sql`
- [ ] T059 [P] [US5] Escrever testes frontend de histórico, remoção lógica, URL direta e perda de permissão em `tests/integration/tarefas-rotinas/task-security-history.test.tsx`
- [ ] T060 [P] [US5] Estender teste de segredos do bundle para o novo módulo em `tests/integration/build-secrets.test.ts`

### Implementation for User Story 5

- [ ] T061 [US5] Implementar `listar_historico_tarefa_rotina`, `excluir_tarefa` e `excluir_rotina` com justificativa e resposta neutra em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T062 [US5] Completar eventos de auditoria de tarefa, responsáveis, rotina, execuções e soft delete em `supabase/migrations/<timestamp>_tarefas_rotinas.sql`
- [ ] T063 [P] [US5] Adicionar histórico e exclusões ao serviço com mapeamento de acesso negado/sessão expirada em `src/modules/tarefas-rotinas/task-service.ts`
- [ ] T064 [P] [US5] Implementar histórico paginado e origem automática/humana em `src/modules/tarefas-rotinas/components/TaskHistory.tsx`
- [ ] T065 [P] [US5] Implementar confirmação acessível de soft delete com justificativa em `src/modules/tarefas-rotinas/components/SoftDeleteDialog.tsx`
- [ ] T066 [US5] Integrar histórico, exclusão, perda de capacidade e retorno seguro nas páginas `src/modules/tarefas-rotinas/pages/TaskDetailPage.tsx` e `src/modules/tarefas-rotinas/pages/RoutineFormPage.tsx`
- [ ] T067 [US5] Documentar policies, grants, helpers e matriz final em `supabase/policies/tarefas_rotinas.md`

**Checkpoint**: Segurança, histórico e remoção lógica completos.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Homologação, desempenho, dados de teste e gates finais.

- [ ] T068 [P] Criar massa determinística para três perfis, três postos, atrasos, validação, rotinas e acúmulo em `supabase/seed/tarefas_rotinas.sql`
- [ ] T069 Ajustar acessibilidade, foco, mensagens PT-BR e layouts 1280×720/1440×900 em `src/modules/tarefas-rotinas/pages/TaskCenterPage.css`, `src/modules/tarefas-rotinas/components/TaskList.css`, `src/modules/tarefas-rotinas/components/TaskKanban.css`, `src/modules/tarefas-rotinas/components/TaskCalendar.css`, `src/modules/tarefas-rotinas/components/TaskForm.css` e `src/modules/tarefas-rotinas/components/RoutineForm.css`
- [ ] T070 Executar e otimizar planos com 10.000 tarefas e 1.000 ocorrências usando `supabase/tests/tarefas_rotinas_desempenho.sql`
- [ ] T071 Executar typecheck, lint, Vitest e build definidos em `package.json` e corrigir somente falhas causadas pela feature
- [ ] T072 Executar lint/advisors Supabase, revisar RLS/grants/índices/job, concluir o Constitution Check técnico e registrar evidências automatizadas em `specs/010-tarefas-rotinas/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: inicia imediatamente.
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias.
- **US1 (Phase 3)**: começa após Foundational e entrega o MVP.
- **US2 (Phase 4)**: depende de US1 para tarefa, serviço e detalhe.
- **US3 (Phase 5)**: depende de US1 para gerar tarefas; pode avançar em paralelo
  com US2 após o contrato base de tarefa estar estável.
- **US4 (Phase 6)**: depende de US1; calendário completo depende das previsões
  de US3.
- **US5 (Phase 7)**: depende de US1 e US3 para cobrir todas as entidades; seus
  testes de segurança podem começar antes.
- **Polish (Phase 8)**: depende das histórias selecionadas para a entrega.

### User Story Dependency Graph

```text
Setup -> Foundational -> US1
                         |---> US2
                         |---> US3
                         `---> US4 (calendário completo após US3)

US1 + US3 -----------> US5
US1..US5 ------------> Polish
```

### Within Each User Story

- Escrever e executar testes antes da implementação.
- Schema/helpers antes de RPCs.
- RPCs e tipos antes da integração de serviço.
- Serviço e componentes antes das páginas.
- Página/rota antes do checkpoint independente.
- Não mover uma regra autoritativa do banco para a UI.

## Parallel Opportunities

### Setup e Foundational

- T002 e T003 podem avançar em paralelo com T001.
- T004, T005, T011 e T014 atuam em arquivos distintos.
- T006–T010 são sequenciais por compartilharem a migration.

### User Story 1

```text
T015 SQL tests
T016 service tests
T017 UI tests

Após T018/T019:
T020 TaskForm
T021 TaskFilters
T022 TaskList
```

### User Story 2

```text
T026 command tests
T027 concurrency tests
T028 UI tests

Após contrato da RPC:
T030 service
T031 detail
T032 transition dialog
```

### User Story 3

```text
T035 recurrence SQL tests
T036 concurrency SQL tests
T037 recurrence unit tests
T038 routine form tests

Após RPCs:
T043 recurrence client rules
T044 service
T045 form
T046 list/detail
```

### User Story 4

```text
T050 query/performance tests
T051 view integration tests
T052 state unit tests

Após T053:
T054 kanban
T055 calendar
T056 filters
```

### User Story 5

```text
T058 audit/RLS tests
T059 history/security UI tests
T060 bundle secret test

Após T061/T062:
T063 service
T064 history
T065 delete dialog
```

## Implementation Strategy

### MVP First

1. Concluir Setup.
2. Concluir Foundational.
3. Concluir US1.
4. Parar e validar criação, atribuição, lista e RLS.
5. Demonstrar o cadastro manual antes de recorrência.

### Incremental Delivery

1. **US1**: cadastro manual e lista.
2. **US2**: execução, validação e reabertura.
3. **US3**: rotinas, geração e acúmulo.
4. **US4**: kanban e calendário.
5. **US5**: histórico, soft delete e hardening completo.
6. **Polish**: escala, advisors e preparação da homologação manual.

## Notes

- Testes automatizados de navegador, Playwright e E2E não fazem parte desta
  execução; a homologação correspondente é responsabilidade manual do usuário.
- Não criar Edge Function, backend, tabela paralela de histórico ou dependência
  runtime nova.
- O job não substitui RLS nem aceita identidade do cliente.
- Commits devem agrupar tarefas concluídas por checkpoint lógico.
