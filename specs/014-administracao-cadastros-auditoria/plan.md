# Implementation Plan: Administração, Cadastros, Usuários, Permissões e Auditoria

**Branch**: `main` | **Date**: 2026-07-01 | **Spec**: `specs/014-administracao-cadastros-auditoria/spec.md`

**Input**: Feature specification from `specs/014-administracao-cadastros-auditoria/spec.md`

## Summary

Transformar os placeholders de Cadastros e Histórico/Auditoria em uma área
administrativa sobre as entidades já existentes das Specs 001 e 002. A SPA
ganhará um módulo `administracao` com rotas internas para usuários, postos,
vínculos, cargos/funções, prioridades, tipos de ocorrência, metas e auditoria.

Uma migration única estenderá as sete entidades mutáveis com versão monotônica,
completará controles de atualização de vínculos, retirará escritas antigas de
Supervisão em postos/vínculos e publicará RPCs estreitas para consultas e
mutações atômicas. A auditoria continuará em `historico_auditoria`, com contexto
normalizado, projeção sanitizada e paginação por cursor. Identidades serão
criadas previamente no Supabase Auth; a aplicação apenas listará identidades
elegíveis por projeção mínima e associará o cadastro operacional. Nenhuma chave
privilegiada ficará no navegador.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2 e Node.js 24 LTS para SPA e
tooling; SQL PostgreSQL/PL/pgSQL no Supabase PostgreSQL 17.

**Primary Dependencies**: Vite 8.1, React Router 7.18,
`@supabase/supabase-js` 2.108.2, Vitest 4.1, React Testing Library 16.3,
e componentes/tokens existentes do design system Doka. Nenhuma dependência
runtime nova.

**Storage**: PostgreSQL existente para `usuarios`, `postos`,
`usuarios_postos`, `cargos_funcoes`, `prioridades`, `tipos_ocorrencia`,
`metas_eficiencia`, `historico_auditoria`, tabelas MMS e futuras entidades
operacionais. Não haverá tabela de domínio nem histórico paralelo.

**Testing**: Vitest/React Testing Library para estados, serviços, formulários e
rotas; testes SQL transacionais para schema, RPCs, RLS, concorrência, soft
delete, último administrador, sanitização e desempenho; `supabase db lint` e
advisors. Jornadas reais, URL direta, teclado e viewports serão homologados
manualmente pelo usuário, sem automação de navegador/E2E nesta feature.

**Target Platform**: Navegadores desktop modernos em 1280×720 e 1440×900; SPA
estática conectada diretamente ao Supabase hospedado.

**Project Type**: Aplicação web SPA com backend transacional PostgreSQL exposto
por Data API/RPC autenticada.

**Performance Goals**: 95% das listas/filtros exibem resultado ou progresso em
até 2 s com 10.000 registros/eventos no escopo; páginas padrão de 50 e máximo
100; consultas usam cursor estável; mutações comuns concluem sem manter locks
durante interação externa.

**Constraints**: somente três perfis; Supervisão é leitura para usuários,
postos, vínculos e cargos, mas gerencia metas no próprio escopo; Auth é
pré-provisionado; sem `service_role` no navegador; RLS e checagem interna nas
RPCs; sem DELETE físico/restauração; concorrência otimista; último
`direcao_admin` protegido; metadata e valores auditados sanitizados; `raw_json`
não é exposto; PT-BR, acessível e desktop-first.

**Scale/Scope**: Oito telas administrativas, uma migration, sete entidades
existentes versionadas, uma fonte de auditoria estendida, aproximadamente 25
RPCs públicas agrupadas em consulta/mutação, cinco contratos e cobertura de
10.000 itens por consulta de aceite.

## Constitution Check

*GATE: aprovado antes da pesquisa e revalidado após o design.*

- PASS: O Doka não substitui MMS; postos MMS, `raw_json`, chave operacional,
  importação e regra de `removido` não são alterados.
- PASS: O escopo permanece no MVP administrativo aprovado; não cria perfis,
  permissões por campo, status genérico, responsáveis paralelos, dashboard,
  SSO, convite ou provisionamento Auth.
- PASS: Persistência e autorização reutilizam Supabase Auth, PostgreSQL, RLS,
  funções vigentes e perfis/postos das Specs 001, 002 e 005.
- PASS: As entidades existentes permanecem em português `snake_case`; soft
  delete continua distinto de inativação/status e toda ação crítica usa
  `historico_auditoria`.
- PASS: Operador não acessa administração; Supervisão é somente leitura nas
  entidades fundacionais e mantém gestão de metas restrita aos próprios postos;
  Direção/Administração possui gestão global.
- PASS: Ocorrências e custos não são implementados; seus vínculos obrigatórios
  com assistência não são alterados.
- PASS: A interface reutiliza o design system Doka, PT-BR, foco visível,
  teclado, estados explícitos e abordagem desktop-first.
- PASS: O conflito entre policies antigas e `Q2: A` foi identificado: a
  migration removerá `postos_supervisao_update` e
  `usuarios_postos_supervisao_update`.

## Project Structure

### Documentation (this feature)

```text
specs/014-administracao-cadastros-auditoria/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
`-- contracts/
    |-- query-contract.md
    |-- mutation-contract.md
    |-- authorization-contract.md
    |-- audit-contract.md
    `-- ui-workflow-contract.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- router.tsx
|   `-- routes.ts
`-- modules/
    `-- administracao/
        |-- components/
        |   |-- AdminResourceNav.tsx
        |   |-- AdminFilters.tsx
        |   |-- AdminTable.tsx
        |   |-- EntityStateBadge.tsx
        |   |-- DestructiveActionDialog.tsx
        |   |-- UserForm.tsx
        |   |-- PostForm.tsx
        |   |-- UserPostLinks.tsx
        |   |-- AuxiliaryRegistryForm.tsx
        |   |-- EfficiencyGoalForm.tsx
        |   `-- AuditEventDetail.tsx
        |-- pages/
        |   |-- AdminHomePage.tsx
        |   |-- UsersPage.tsx
        |   |-- UserDetailPage.tsx
        |   |-- PostsPage.tsx
        |   |-- PostDetailPage.tsx
        |   |-- AuxiliaryRegistriesPage.tsx
        |   |-- EfficiencyGoalsPage.tsx
        |   `-- AuditHistoryPage.tsx
        |-- administration-service.ts
        |-- administration-state.ts
        `-- types.ts

tests/
|-- unit/
|   `-- administracao/
`-- integration/
    `-- administracao/

supabase/
|-- migrations/
|   `-- <timestamp>_administracao_cadastros_auditoria.sql
|-- policies/
|   `-- administracao_cadastros_auditoria.md
|-- seed/
|   `-- administracao_cadastros_auditoria.sql
`-- tests/
    |-- administracao_schema.sql
    |-- administracao_consultas_rls.sql
    |-- administracao_mutacoes.sql
    |-- administracao_concorrencia.sql
    |-- administracao_ultimo_admin.sql
    |-- administracao_auditoria.sql
    `-- administracao_desempenho.sql
```

**Structure Decision**: Manter a SPA única e substituir os dois placeholders por
um módulo `src/modules/administracao`. Cadastros compartilham primitives de
lista/formulário, mas preservam tipos e validações por entidade. O banco expõe
RPCs públicas estreitas e mantém helpers em `app_private`; não haverá backend,
Edge Function ou cliente privilegiado.

## Phase 0: Research

Pesquisa consolidada em
`specs/014-administracao-cadastros-auditoria/research.md`.

Decisões principais:

- Reutilizar as oito entidades existentes; apenas estender controles técnicos.
- Associar identidades Auth já criadas por uma projeção mínima exclusiva de
  Direção/Administração.
- Revogar escrita direta nas entidades administrativas e concentrar mutações em
  RPCs transacionais com ator derivado e allowlists.
- Usar UUID fornecido pelo cliente em criações, versão esperada em alterações e
  releitura do estado para resposta incerta.
- Substituir FKs legadas `ON DELETE CASCADE` de `usuarios.auth_user_id` e
  `usuarios_postos` por `ON DELETE RESTRICT`, impedindo exclusão física indireta
  pela remoção de identidade Auth, usuário ou posto.
- Serializar mudanças que afetem o último administrador com advisory lock
  transacional.
- Normalizar contexto dentro de `historico_auditoria`, sem tabela paralela, e
  expor somente projeções sanitizadas.
- Usar paginação por cursor `(created_at desc, id desc)` na auditoria e cursores
  estáveis específicos nas demais listas.

## Phase 1: Design

Artefatos:

- `specs/014-administracao-cadastros-auditoria/data-model.md`
- `specs/014-administracao-cadastros-auditoria/contracts/query-contract.md`
- `specs/014-administracao-cadastros-auditoria/contracts/mutation-contract.md`
- `specs/014-administracao-cadastros-auditoria/contracts/authorization-contract.md`
- `specs/014-administracao-cadastros-auditoria/contracts/audit-contract.md`
- `specs/014-administracao-cadastros-auditoria/contracts/ui-workflow-contract.md`
- `specs/014-administracao-cadastros-auditoria/quickstart.md`

## Post-Design Constitution Check

- PASS: Nenhuma entidade oficial, perfil, helper de escopo, histórico ou modelo
  de soft delete é recriado.
- PASS: A extensão de auditoria mantém `historico_auditoria` como única fonte e
  acrescenta somente contexto consultável e sanitização.
- PASS: RPCs `SECURITY DEFINER` justificadas revalidam `auth.uid()`, perfil,
  posto e estado persistido; usam `search_path` vazio e grants explícitos.
- PASS: A remoção das duas policies antigas fecha a divergência de permissão da
  Supervisão sem reduzir sua gestão de metas aprovada na Spec 002.
- PASS: Versionamento, locks curtos, unicidade existente e UUID idempotente
  cobrem concorrência sem tabela técnica paralela.
- PASS: FKs administrativas usam `ON DELETE RESTRICT`; exclusão de identidade
  Auth, usuário ou posto não pode apagar fisicamente cadastros ou vínculos.
- PASS: Rotas, menu e botões refletem capacidades, mas a autorização continua
  no banco e é revalidada antes de cada mutação.
- PASS: A projeção Auth não cria contas nem retorna senha, token, sessão,
  metadata ou credencial.
- PASS: Nenhuma violação constitucional ou `NEEDS CLARIFICATION` permanece.

## Complexity Tracking

Nenhuma violação constitucional requer justificativa.
