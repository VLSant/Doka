# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Doka is an internal operations platform (PT-BR) for a delivery + furniture-assembly company: it mirrors assistências imported from spreadsheets of the external MMS system and adds ocorrências, tarefas/rotinas, deslocamentos/custos extras, administração and dashboards for 5–10 internal users. **Doka does not replace MMS** — MMS stays the official source; Doka imports its spreadsheets as an operational mirror.

Read `AGENTS.md` first — it defines the current lean-MVP workflow and mandatory design-system rules. `docs/07-plano-execucao-mvp-enxuto.md` is the living progress/continuity document; update it after each relevant step. Product/business references: `docs/01-prd-mvp.md` (PRD), `docs/02-regras-negocio.md` (business rules), `docs/04-importacao-mms.md` (MMS import spec), `docs/05-banco-dados.md` (database). Feature specs live in `specs/` (Spec Kit format), but the current phase does **not** require the full Spec Kit cycle — work in vertical slices (DB → service → pages → routes → minimal tests → build).

## Commands

Node 24 is required (`.nvmrc`). Language of code identifiers, DB objects, UI copy and commit messages is Portuguese.

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # tsc -b && vite build (SPA output in dist/)
npm run typecheck    # tsc -b --noEmit
npm run lint         # eslint . + design-system adherence check
npm run lint:design-system   # scripts/check-design-system.mjs alone
npm run format       # prettier --write .
npm run test         # vitest run (tests/unit + tests/integration, jsdom)
npm run test:watch   # vitest watch mode
npm run test:e2e     # playwright (builds + previews on :4173) — see restriction below
```

Single test file: `npx vitest run tests/unit/route-guard.test.ts` (or `npm test -- tests/unit/route-guard.test.ts`); filter by name with `-t "pattern"`.

**Do not run Playwright/E2E, browser automation, or visual homologation in the current MVP phase** (per `AGENTS.md`); the e2e suite belongs to Spec 005's foundation and manual homologation. The default verification loop is: `npm run typecheck && npm run lint && npm run test && npm run build`.

Database (requires Supabase CLI + Docker for local stack):

```bash
supabase start       # local stack incl. Mailpit at :54324 (password-recovery e-mails)
supabase db reset    # apply migrations from scratch
supabase migration up
```

SQL tests in `supabase/tests/*.sql` are run against the remote dev project, each file wrapped in `BEGIN`/`ROLLBACK` — there is no `supabase test db` harness wired into npm.

## Architecture

React 19 + TypeScript + Vite 8 SPA with **no backend of its own** — the browser talks directly to Supabase (PostgreSQL, Auth, Storage) and all authorization is enforced by Row Level Security. Deployment is static `dist/` with SPA fallback to `index.html`.

### Frontend layout

- `src/app/` — composition root. `routes.ts` is the single source of truth for route IDs, paths, allowed profiles and menu order (feeds both `router.tsx` and `modules/navigation/menu-config.ts` so they can't diverge). `router.tsx` builds the React Router Data Mode tree; all `/app/*` routes are lazy-loaded and wrapped in `ProtectedRoute`.
- `src/modules/<dominio>/` — vertical slices (auth, access, navigation, dashboard, importacoes-mms, assistencias-mms, ocorrencias, tarefas-rotinas, lancamentos-operacionais, administracao, auditoria). The recurring pattern per module: `*-service.ts` (Supabase queries/RPCs + error mapping to PT-BR user messages with typed error codes), `*-state.ts` (state logic), `types.ts`, `pages/`, `components/`, optional module CSS containing only screen-specific composition.
- `src/lib/env.ts` — the only env reader; accepts exactly `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`. `src/lib/supabase.ts` — lazy singleton browser client using only the publishable key.
- `src/services/` — cross-module services (`audit-service.ts`, `catalog-service.ts`).
- `src/components/` — shared `ui/`, `feedback/`, `layout/` (includes `AppShell`). Look here before writing any local component or CSS.

### Auth and access control

`AuthProvider` wraps the tree; `ProtectedRoute` + `route-guard.ts`/`protected-loader.ts` only render protected content when the guard outcome is exactly `autorizado` — every other outcome redirects to a neutral page (`/acesso-negado`, `/configuracao-operacional`, `/sessao-expirada`, `/falha-temporaria`) so protected UI never flashes and error pages never leak permission detail. Access is profile + posto: Operador (only linked postos), Supervisão (own scope, validates/corrects/soft-deletes), Direção/Administração (everything). Password recovery flows through `/recuperar-senha` → e-mail → `/redefinir-senha` (guarded by the `PASSWORD_RECOVERY` auth event, not a route guard).

### Database layer (`supabase/`)

- `migrations/` — timestamped, PT-BR snake_case tables/columns. Migrations are already applied remotely; reconcile, never rewrite applied history.
- `policies/` — markdown documentation of the RLS contracts per area; `seed/` — per-area seeds; `tests/` — SQL tests per area (RLS, auditoria, validações, atomicidade, concorrência...).
- Invariants baked into the schema: centralized audit in `historico_auditoria`; soft delete via `deleted_at`/`deleted_by`/`delete_reason`; MMS imports preserve `raw_json`; operational dedup key `posto_id + data_atividade + numero_assistencia + parte_conjunto`; records absent from a re-import become status `Removido`. Prefer direct CRUD under RLS; use small RPCs (`SECURITY DEFINER`) only for critical/atomic operations (import processing, validation completion, undo).

### Design system (mandatory)

`design-system/tokens/*` is the reference; `src/styles/design-system.css` is the bundle the app consumes (the lint script verifies they don't diverge). Brand: Poppins only, orange `#F09018` + purple `#602860`, rounded, Lucide line icons, no emoji, PT-BR copy. In module CSS you may not use `--color-*` aliases, local hex colors, or raw `font-size`/`font-weight` values — `npm run lint:design-system` fails the build on these. Hex is allowed only as documented business data. Native controls only when no primitive exists (e.g. `input[type=file]` inside `FileDropzone`). Run the design-system lint after any UI change.

## Closed decisions — do not change without explicit approval

- Doka does not replace MMS; imports can repeat for the same posto/date; no `file_hash` in the MVP.
- Absent records on re-import become `Removido`; `raw_json` is preserved.
- Rotina acumulada keeps the same open task (never duplicates it).
- Deslocamentos live in a separate table from custos extras; custos extras are manual and require an assistência; ocorrências always require an assistência; reclamação is a type of ocorrência.
- Supabase Auth + RLS with profile + posto permissions; centralized audit; soft delete; PT-BR snake_case naming.
- Out of MVP scope: deep MMS integration, WhatsApp/e-mail automation, mobile app, montador portal, advanced BI, comissão/repasse/NF, general attachments, automatic posto name matching. Also defer kanban, calendars, automations and speculative abstractions.

## Secrets

Only publishable values may be `VITE_`-prefixed. `SUPABASE_SERVICE_ROLE_KEY` and other server-side variables in `.env.example` must never reach the browser bundle, `.env.local` of the web app, or version control (`tests/integration/build-secrets.test.ts` guards this).
