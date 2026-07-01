# Implementation Plan: Central de Tarefas, Rotinas Recorrentes e Estratégias Operacionais

**Branch**: `main` | **Date**: 2026-07-01 | **Spec**: `specs/010-tarefas-rotinas/spec.md`

**Input**: Feature specification from `/specs/010-tarefas-rotinas/spec.md`

## Summary

Entregar a Central de Tarefas e Rotinas como módulo da SPA existente, com lista,
kanban, calendário, formulários e detalhe/histórico. A persistência ficará no
PostgreSQL do Supabase em cinco tabelas protegidas por RLS, usando RPCs estreitas
para consultas e mutações transacionais.

Rotinas serão materializadas em execuções previstas para uma janela móvel de 90
dias. Um único job Supabase Cron, executado a cada cinco minutos, chamará uma
função privada que repõe a janela, processa ocorrências vencidas em lotes e
recupera períodos perdidos. Restrições únicas, bloqueios de linha e versões
monotônicas garantem uma tarefa por ocorrência e acúmulo sobre a mesma tarefa
aberta. Não haverá Edge Function, backend separado ou dependência runtime nova.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2 e Node.js 24 LTS para SPA e
tooling; SQL PostgreSQL/PL/pgSQL no Supabase PostgreSQL 17.

**Primary Dependencies**: Vite 8.1, React Router 7.18,
`@supabase/supabase-js` 2.108.2, Supabase Cron/`pg_cron` e componentes/tokens
existentes do design system. Nenhuma dependência runtime nova.

**Storage**: PostgreSQL existente; novas tabelas `tarefas`,
`tarefa_responsaveis`, `rotinas`, `rotina_responsaveis` e
`rotina_execucoes`; reutilização de `usuarios`, `postos`, `usuarios_postos`,
`cargos_funcoes`, `prioridades` e `historico_auditoria`.

**Testing**: Vitest 4.1 e React Testing Library para unidade e integração;
testes SQL transacionais para schema, RLS, transições, concorrência,
recorrência e desempenho; Supabase lint e advisors. Navegação real, URL direta,
teclado, foco e layouts serão homologados manualmente pelo usuário.

**Target Platform**: Navegadores desktop modernos em 1280×720 e 1440×900;
SPA estática conectada diretamente ao Supabase sob RLS.

**Project Type**: Aplicação web SPA com fronteira transacional em funções
PostgreSQL expostas pela Data API.

**Performance Goals**: 95% das consultas e filtros com até 10.000 tarefas
apresentam resultado ou progresso em até 2 s; processamento de 1.000 ocorrências
sem duplicidade; cada execução do job permanece abaixo de 10 minutos.

**Constraints**: Cadastro manual como fonte oficial; horário operacional
`America/Bahia`; sem `service_role` no navegador; sem atualização direta das
tabelas pela SPA; RLS em todas as tabelas; soft delete; auditoria central;
Operador não cria tarefas, valida, reabre, remove ou administra rotinas; sem
dashboard funcional, notificações, anexos ou integrações automáticas.

**Scale/Scope**: Cinco tabelas, uma extensão de agendamento já suportada pelo
Supabase, um job, funções privadas de recorrência, RPCs públicas de leitura e
comando, um módulo frontend, seis rotas e cobertura de 10.000 tarefas.

## Constitution Check

*GATE: aprovado antes da pesquisa e revalidado após o design.*

- PASS: Cadastro manual permanece fonte oficial; a feature não lê nem altera
  MMS e não cria dependência com Assistências.
- PASS: Escopo limitado a tarefas, estratégias e rotinas do MVP; Dashboard,
  notificações, anexos, automações externas e aplicativo mobile permanecem fora.
- PASS: Persistência e autorização usam Supabase/PostgreSQL/Auth/RLS; a SPA usa
  somente sessão autenticada e chave publicável.
- PASS: Novas tabelas e campos usam português `snake_case`, soft delete e
  `historico_auditoria`; não existe histórico paralelo.
- PASS: Operador e Supervisão respeitam posto e vínculo; Direção/Administração
  mantém escopo global; mutações revalidam ator e estado no banco.
- PASS: Funções privilegiadas ficam mínimas, com `search_path = ''`, nomes
  qualificados, grants explícitos e nenhum perfil/ator aceito do cliente.
- PASS: Ocorrências, custos e importação MMS não são tocados; regras de
  assistência, `raw_json`, chave MMS e `removido` permanecem inalteradas.
- PASS: Frontend segue o design system Doka, PT-BR, acessibilidade e
  desktop-first.
- PASS: Nenhum conflito permanece entre constituição, README, documentos do MVP
  e contratos das Specs 001–008.

## Project Structure

### Documentation (this feature)

```text
specs/010-tarefas-rotinas/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
`-- contracts/
    |-- query-ui-contract.md
    |-- task-command-contract.md
    |-- recurrence-contract.md
    `-- security-audit-contract.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- router.tsx
|   `-- routes.ts
|-- components/ui/
|   |-- Select.tsx
|   |-- Tabs.tsx
|   `-- StatusPill.tsx
`-- modules/tarefas-rotinas/
    |-- components/
    |   |-- TaskFilters.tsx
    |   |-- TaskList.tsx
    |   |-- TaskKanban.tsx
    |   |-- TaskCalendar.tsx
    |   |-- TaskForm.tsx
    |   |-- RoutineForm.tsx
    |   |-- TaskDetail.tsx
    |   `-- TaskHistory.tsx
    |-- pages/
    |   |-- TaskCenterPage.tsx
    |   |-- TaskDetailPage.tsx
    |   |-- TaskFormPage.tsx
    |   `-- RoutineFormPage.tsx
    |-- task-service.ts
    |-- task-state.ts
    |-- recurrence.ts
    `-- types.ts

tests/
|-- integration/tarefas-rotinas/
`-- unit/tarefas-rotinas/

supabase/
|-- migrations/
|   `-- <timestamp>_tarefas_rotinas.sql
|-- policies/
|   `-- tarefas_rotinas.md
|-- seed/
|   `-- tarefas_rotinas.sql
`-- tests/
    |-- tarefas_rotinas_schema_rls.sql
    |-- tarefas_rotinas_comandos.sql
    |-- tarefas_rotinas_recorrencia.sql
    |-- tarefas_rotinas_concorrencia.sql
    |-- tarefas_rotinas_auditoria.sql
    `-- tarefas_rotinas_desempenho.sql
```

**Structure Decision**: Manter a SPA e o banco existentes. O novo módulo
`src/modules/tarefas-rotinas` substitui o placeholder de
`/app/tarefas-rotinas`; componentes genéricos que já existem no design system
são portados para `src/components/ui`. Toda lógica autoritativa de transição,
acúmulo e recorrência fica no PostgreSQL; o frontend mantém filtros, apresentação
e estado de interação.

## Phase 0: Research

Pesquisa consolidada em `specs/010-tarefas-rotinas/research.md`.

Decisões principais:

- RPCs estreitas com ator derivado e tabelas sem mutação direta pela SPA.
- Cinco entidades do domínio e versões monotônicas para concorrência otimista.
- Execuções futuras persistidas em janela móvel de 90 dias.
- Job único a cada cinco minutos, com lotes, recuperação atrasada e trava para
  impedir sobreposição.
- Geração no início do dia operacional e prazo na data prevista.
- Restrição única de ocorrência ativa e de tarefa originária; acúmulo referencia
  a tarefa aberta anterior.
- Alteração da rotina incrementa versão, cancela previsões futuras antigas e
  materializa a nova regra sem reescrever o passado.
- Lista por cursor, calendário por intervalo limitado e contrato agregado para
  futuros dashboards.
- UI sem biblioteca nova de kanban ou calendário.

## Phase 1: Design

Artefatos:

- `specs/010-tarefas-rotinas/data-model.md`
- `specs/010-tarefas-rotinas/contracts/query-ui-contract.md`
- `specs/010-tarefas-rotinas/contracts/task-command-contract.md`
- `specs/010-tarefas-rotinas/contracts/recurrence-contract.md`
- `specs/010-tarefas-rotinas/contracts/security-audit-contract.md`
- `specs/010-tarefas-rotinas/quickstart.md`

## Post-Design Constitution Check

- PASS: Modelo contém somente entidades manuais de tarefas/rotinas e referências
  a cadastros existentes.
- PASS: RLS e contratos de comando revalidam perfil, vínculo, posto,
  responsabilidade, versão e estado persistido.
- PASS: Job e funções privadas não ficam executáveis por `PUBLIC`, `anon` ou
  `authenticated`; RPCs públicas recebem apenas grants mínimos.
- PASS: Restrições, locks e transação impedem execução sem tarefa, tarefas
  duplicadas e auditoria de falso sucesso.
- PASS: Auditoria permanece central em `historico_auditoria`; execuções são
  domínio de recorrência, não histórico paralelo.
- PASS: Soft delete é independente de status e preserva tarefas, execuções e
  eventos anteriores.
- PASS: Consultas futuras de dashboard respeitam o mesmo escopo e não entregam
  uma tela de Dashboard.
- PASS: Rotas, estados, componentes e validação visual seguem o design system e
  a fundação da Spec 005.
- PASS: Nenhuma violação constitucional ou `NEEDS CLARIFICATION` permanece.

## Complexity Tracking

Nenhuma violação constitucional requer justificativa.
