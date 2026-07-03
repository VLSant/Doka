/**
 * Automated accessibility checks (T081) for public Auth pages, App Shell,
 * feedback states, and neutral destinations, using `@axe-core/playwright`
 * (WCAG 2.0/2.1 A/AA ruleset), per `design-system/readme.md` accessibility
 * guidance and the constitutional requirement that the frontend reuses the
 * official Doka design system primitives (labelled inputs, visible focus,
 * accessible disabled semantics).
 *
 * Requires a local Supabase project seeded with
 * `supabase/seed/fundacao_operacional_seed.sql` (active `operador@doka.test`
 * / `doka123`) for the authenticated-only scenarios (App Shell, module
 * placeholder). The public-page scenarios (login, recover-password,
 * not-found) require no backend and run unconditionally. See
 * `specs/005-fundacao-app-autenticacao/tasks.md` Phase 7 checkpoint for the
 * current local-execution status of this suite.
 *
 * Specs 007/008: adicional requer seeds de importação MMS e
 * interface_assistencias_mms para que as páginas de lista/detalhe
 * contenham dados reais.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VALID_EMAIL = "operador@doka.test";
const VALID_PASSWORD = "doka123";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(VALID_EMAIL);
  await page.getByLabel("Senha").fill(VALID_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function expectNoSeriousOrCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(
    seriousOrCritical,
    JSON.stringify(seriousOrCritical, null, 2),
  ).toEqual([]);
}

test.describe("Acessibilidade automatizada (axe-core)", () => {
  test("pagina publica de login nao tem violacoes serias/criticas", async ({ page }) => {
    await page.goto("/login");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("pagina publica de solicitacao de recuperacao de senha nao tem violacoes serias/criticas", async ({
    page,
  }) => {
    await page.goto("/recuperar-senha");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("pagina de recuperacao com link invalido (estado de feedback) nao tem violacoes serias/criticas", async ({
    page,
  }) => {
    await page.goto("/redefinir-senha");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("destino neutro de pagina nao encontrada (nao autenticado) nao tem violacoes serias/criticas", async ({
    page,
  }) => {
    await page.goto("/rota-que-nao-existe");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("App Shell autenticado (Dashboard) nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page);
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("destino neutro de modulo indisponivel (autenticado) nao tem violacoes serias/criticas", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/app/ocorrencias");
    await expect(page.getByRole("heading", { name: /Ocorrências ainda não disponível/i })).toBeVisible();
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("destino neutro de pagina nao encontrada (autenticado) nao tem violacoes serias/criticas", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/rota-que-nao-existe");
    await expectNoSeriousOrCriticalViolations(page);
  });

  // Spec 007 — Importações MMS
  test("lista de importacoes MMS nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page);
    await page.goto("/app/importacoes-mms");
    await expect(page.getByRole("table").or(page.getByRole("list")).or(
      page.getByText(/nenhuma importação|sem importações/i),
    )).toBeVisible();
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("detalhe de lote MMS nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page);
    await page.goto("/app/importacoes-mms/70000000-0000-4000-8000-000000000002");
    // Se o operador não tiver acesso a esse lote no seed, pula
    const denied = await page.getByText(/acesso negado|não autorizado/i).isVisible().catch(() => false);
    if (denied) {
      test.skip(true, "Operador sem acesso ao lote de referência no seed atual.");
    }
    await expectNoSeriousOrCriticalViolations(page);
  });

  // Spec 008 — Assistências MMS
  test("lista de assistencias MMS nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page);
    await page.goto("/app/assistencias-mms");
    await expect(page.getByRole("table").or(
      page.getByText(/nenhuma assistência/i),
    )).toBeVisible();
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("detalhe de assistencia MMS nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100").catch(() => undefined);
    await page.getByRole("button", { name: /aplicar/i }).click().catch(() => undefined);
    const link = page.getByRole("link", { name: "ASS-100" }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "ASS-100 não encontrada; seed interface_assistencias_mms não aplicado.");
    }
    await link.click();
    await expect(page).toHaveURL(/assistencias-mms\/.+/);
    await expectNoSeriousOrCriticalViolations(page);
  });
});
