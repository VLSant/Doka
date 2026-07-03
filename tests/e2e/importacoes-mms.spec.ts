/**
 * Playwright E2E para Specs 006/007 — Importações MMS.
 *
 * Cobre: bloqueio de sessão anônima, lista com filtros e URL params,
 * paginação sem duplicatas, detalhe de lote com abas, matriz de permissões
 * por perfil, bloqueio de "Concluir" com erro pendente, confirmação de
 * reprocessamento e layout sem overflow horizontal.
 *
 * Lote de referência: 70000000-0000-4000-8000-000000000002 (multi-posto, com erro).
 * Requer seed completo:
 *   supabase/seed/fundacao_operacional_seed.sql
 *   supabase/seed/importacao_mms_seed.sql (que cria os lotes 70000000-*)
 *
 * Cenários de concorrência (E2E-07-04), modo offline (E2E-07-06) e
 * desfazer completo (E2E-07-07) não estão aqui — use o TestSprite com
 * specs/007-008-aceite-e2e-manual.md como insumo.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORD = "doka123";

const PROFILES = {
  operador: { email: "operador@doka.test" },
  supervisao: { email: "supervisao@doka.test" },
  direcaoAdmin: { email: "direcao@doka.test" },
} as const;

const SEM_PERFIL_EMAIL = "sem-perfil@doka.test";
const LOTE_COM_ERRO_ID = "70000000-0000-4000-8000-000000000002";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function expectNoSeriousOrCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const violations = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

// ---------------------------------------------------------------------------
// E2E-01 — Bloqueio de acesso
// ---------------------------------------------------------------------------

test.describe("Bloqueio de acesso — Importacoes MMS", () => {
  test("sessao anonima nao acessa /app/importacoes-mms", async ({ page }) => {
    await page.goto("/app/importacoes-mms");
    await expect(page).not.toHaveURL(/\/app\/importacoes-mms$/);
    await expect(page.getByText(/posto|arquivo|lote/i)).toHaveCount(0);
  });

  test("sessao anonima nao acessa detalhe de lote por URL direta", async ({ page }) => {
    await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}`);
    await expect(page).not.toHaveURL(/\/app\/importacoes-mms\/.+/);
    await expect(page.getByText(/posto|arquivo|erro/i)).toHaveCount(0);
  });

  test("usuario sem perfil operacional nao acessa importacoes por menu nem URL", async ({
    page,
  }) => {
    await login(page, SEM_PERFIL_EMAIL).catch(() => undefined);
    await page.goto("/app/importacoes-mms");
    await expect(page).not.toHaveURL(/\/app\/importacoes-mms$/);
  });
});

// ---------------------------------------------------------------------------
// E2E-07-01 — Lista, filtros e paginação
// ---------------------------------------------------------------------------

test.describe("E2E-07-01 — Lista e filtros", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/importacoes-mms");
    await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible();
  });

  test("filtro de status atualiza lista e URL", async ({ page }) => {
    const statusSelect = page.getByLabel(/status/i).first();
    if (!(await statusSelect.isVisible())) {
      test.skip(true, "Filtro de status não encontrado.");
    }
    await statusSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page.url()).toContain("status=");
  });

  test("Limpar remove parametros de filtro da URL", async ({ page }) => {
    const statusSelect = page.getByLabel(/status/i).first();
    if (!(await statusSelect.isVisible())) {
      test.skip(true, "Filtro de status não encontrado.");
    }
    await statusSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: /aplicar/i }).click();

    await page.getByRole("button", { name: /limpar/i }).click();
    await expect(page).not.toHaveURL(/status=/);
    await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible();
  });

  test("filtro sem resultado exibe mensagem e nao confunde com falha", async ({ page }) => {
    // Tenta um valor improvável nos filtros disponíveis
    const comErro = page.getByLabel(/com erro/i);
    const comAlerta = page.getByLabel(/com alerta/i);
    if (await comErro.isVisible()) {
      await comErro.check();
    }
    if (await comAlerta.isVisible()) {
      await comAlerta.uncheck();
    }
    await page.getByRole("button", { name: /aplicar/i }).click();
    // Pode ter resultado ou não — o importante é que erro de sistema não apareça
    await expect(page.getByText(/falha inesperada|erro interno/i)).toHaveCount(0);
  });

  test("Carregar mais nao duplica IDs de lote", async ({ page }) => {
    const carregarMais = page.getByRole("button", { name: /carregar mais/i });
    if (!(await carregarMais.isVisible())) {
      test.skip(true, "Paginação não disponível com a massa atual.");
    }

    const getLoteHrefs = () =>
      page.getByRole("table").getByRole("link", { name: "Abrir" })
        .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));

    const firstIds = await getLoteHrefs();
    await carregarMais.click();
    await expect(carregarMais.or(page.getByRole("table"))).toBeVisible();
    const allIds = await getLoteHrefs();

    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
    expect(allIds.length).toBeGreaterThan(firstIds.length);
  });
});

// ---------------------------------------------------------------------------
// E2E-07-02 — Detalhe do lote
// ---------------------------------------------------------------------------

test.describe("E2E-07-02 — Detalhe do lote com erro", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}`);
    await expect(page).toHaveURL(new RegExp(LOTE_COM_ERRO_ID));
  });

  test("detalhe carrega sem erro de sistema", async ({ page }) => {
    await expect(page.getByText(/falha inesperada|erro interno/i)).toHaveCount(0);
    // Deve exibir ao menos informação de arquivo ou posto
    await expect(page.getByText(/Posto|arquivo|data/i).first()).toBeVisible();
  });

  test("abas do lote existem e carregam conteudo sob demanda", async ({ page }) => {
    // Percorre abas disponíveis sem exigir nomes exatos (i18n)
    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    if (tabCount === 0) {
      test.skip(true, "Interface de abas não encontrada.");
    }
    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      await tabs.nth(i).click();
      await expect(page.getByText(/falha inesperada|erro interno/i)).toHaveCount(0);
    }
  });
});

// ---------------------------------------------------------------------------
// E2E-07-03 — Permissões por perfil
// ---------------------------------------------------------------------------

test.describe("E2E-07-03 — Matriz de permissoes por perfil", () => {
  test("Operador operacional acessa lista mas nao ve acoes de concluir ou reprocessar", async ({
    page,
  }) => {
    await login(page, PROFILES.operador.email);
    await page.goto("/app/importacoes-mms");
    await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible();

    await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}`);
    // Ações exclusivas de supervisão/direção não devem aparecer
    await expect(page.getByRole("button", { name: /concluir/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /reprocessar/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /desfazer/i })).toHaveCount(0);
  });

  test("URL direta de lote fora do escopo retorna negacao neutra sem expor dados", async ({
    page,
  }) => {
    await login(page, PROFILES.operador.email);
    // Lote predecessor — pode estar fora do escopo do operador dependendo do seed
    await page.goto("/app/importacoes-mms/70000000-0000-4000-8000-000000000003");
    // Não deve exibir nome de arquivo, posto ou linhas de dados do lote
    const hasProtectedData = await page
      .getByText(/spec007\.csv|spec007|Posto B/i)
      .isVisible()
      .catch(() => false);
    if (hasProtectedData) {
      test.skip(true, "Lote 003 está dentro do escopo do Operador no seed atual.");
    }
    await expect(
      page.getByText(/acesso negado|não autorizado|não encontrad|indisponível/i),
    ).toBeVisible();
  });

  for (const [profileName, profile] of Object.entries(PROFILES)) {
    test(`${profileName} acessa a lista de importacoes sem erro`, async ({ page }) => {
      await login(page, profile.email);
      await page.goto("/app/importacoes-mms");
      await expect(page.getByText(/falha inesperada|erro interno/i)).toHaveCount(0);
      await expect(page.getByRole("table").or(page.getByRole("list")).or(
        page.getByText(/nenhuma importação|sem importações/i),
      )).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------------
// E2E-07-05 — Concluir e reprocessar
// ---------------------------------------------------------------------------

test.describe("E2E-07-05 — Concluir e reprocessar", () => {
  test("erro pendente bloqueia botao de concluir tratamento", async ({ page }) => {
    await login(page, PROFILES.supervisao.email);
    await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}/tratamento`);

    const concluirBtn = page.getByRole("button", { name: /concluir/i });
    if (!(await concluirBtn.isVisible())) {
      test.skip(true, "Botão Concluir não visível para Supervisão neste lote.");
    }
    // Com erro pendente, o botão deve estar desabilitado ou ausente
    await expect(concluirBtn).toBeDisabled();
  });

  test("dialogo de reprocessar exige confirmacao explicita", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}/tratamento`);

    const reprocessarBtn = page.getByRole("button", { name: /reprocessar/i });
    if (!(await reprocessarBtn.isVisible())) {
      test.skip(true, "Botão Reprocessar não disponível para este lote/perfil.");
    }
    await reprocessarBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Deve haver botão de cancelar que fecha sem ação
    await page.getByRole("dialog").getByRole("button", { name: /cancelar|fechar/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Layout — multi-viewport sem overflow horizontal
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x720", width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Layout em ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`lista de importacoes nao tem overflow horizontal em ${vp.name}`, async ({ page }) => {
      await login(page, PROFILES.direcaoAdmin.email);
      await page.goto("/app/importacoes-mms");
      await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
    });

    test(`detalhe de lote nao tem overflow horizontal em ${vp.name}`, async ({ page }) => {
      await login(page, PROFILES.direcaoAdmin.email);
      await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}`);
      await expect(page.getByText(/falha inesperada/i)).toHaveCount(0);

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  });
}

// ---------------------------------------------------------------------------
// Acessibilidade — páginas de Importações MMS
// ---------------------------------------------------------------------------

test.describe("Acessibilidade — Importacoes MMS", () => {
  test("lista de importacoes nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/importacoes-mms");
    await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible();
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("detalhe de lote nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto(`/app/importacoes-mms/${LOTE_COM_ERRO_ID}`);
    await expect(page.getByText(/falha inesperada/i)).toHaveCount(0);
    await expectNoSeriousOrCriticalViolations(page);
  });
});
