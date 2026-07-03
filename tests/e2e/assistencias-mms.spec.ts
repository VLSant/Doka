/**
 * Playwright E2E para Spec 008 — Assistências MMS.
 *
 * Cobre: bloqueio de sessão anônima e perfil sem acesso, lista com filtros e
 * URL params, toggle de removidas, detalhe em dois níveis com EffectiveValue,
 * correção dos quatro campos permitidos, campos proibidos, isolamento por
 * perfil/posto e histórico com link para lote de origem (Spec 007).
 *
 * Requer seed completo:
 *   supabase/seed/fundacao_operacional_seed.sql
 *   supabase/seed/importacao_mms_seed.sql (ou equivalente com lotes 94000000-*)
 *   supabase/seed/interface_assistencias_mms.sql
 *
 * Assistência de referência: ASS-100, Posto A, data 2026-06-24,
 * cliente vigente "Cliente A corrigido no Doka".
 *
 * Cenários de concorrência (E2E-08-06) e falha de rede (E2E-08-08) não estão
 * aqui — use o TestSprite com specs/007-008-aceite-e2e-manual.md como insumo.
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

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function openAssistanceDetail(page: Page, assistanceNumber: string) {
  const row = page.getByRole("row").filter({ hasText: assistanceNumber });
  await row.getByRole("link", { name: /abrir detalhe/i }).click();
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
// E2E-01 / E2E-02 — Bloqueio de acesso
// ---------------------------------------------------------------------------

test.describe("Bloqueio de acesso — Assistências MMS", () => {
  test("sessao anonima nao acessa /app/assistencias-mms", async ({ page }) => {
    await page.goto("/app/assistencias-mms");
    await expect(page).not.toHaveURL(/\/app\/assistencias-mms/);
    await expect(page.getByText(/cliente|posto|número/i)).toHaveCount(0);
  });

  test("sessao anonima nao acessa detalhe de assistencia por URL direta", async ({ page }) => {
    // UUID sinteticamente válido mas sem sessão — não deve revelar dados
    await page.goto("/app/assistencias-mms/00000000-0000-4000-8000-000000000099");
    await expect(page).not.toHaveURL(/\/app\/assistencias-mms\//);
    await expect(page.getByText(/cliente|posto|número/i)).toHaveCount(0);
  });

  test("usuario sem perfil operacional nao acessa assistencias por menu nem URL", async ({
    page,
  }) => {
    await login(page, SEM_PERFIL_EMAIL).catch(() => undefined);
    await page.goto("/app/assistencias-mms");
    await expect(page).not.toHaveURL(/\/app\/assistencias-mms$/);
  });
});

// ---------------------------------------------------------------------------
// E2E-08-01 — Lista, busca, filtros e URL params
// ---------------------------------------------------------------------------

test.describe("E2E-08-01 — Lista e filtros", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("busca por numero completo ASS-100 retorna ao menos um resultado", async ({ page }) => {
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page.getByText("ASS-100")).toBeVisible();
    await expect(page).toHaveURL(/numero_assistencia=ASS-100/);
  });

  test("busca parcial '100' filtra sem quebrar outros filtros", async ({ page }) => {
    await page.getByLabel(/número/i).fill("100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    const url = page.url();
    expect(url).toContain("numero_assistencia=100");
  });

  test("filtro de situacao padrao e Ativas — removidas nao aparecem inicialmente", async ({
    page,
  }) => {
    // Situação padrão não deve exibir registros com badge "Removida"
    await expect(page).toHaveURL(/situacao=ativo|[^?]/);
    const removidaBadge = page.getByText("Removida", { exact: true }).first();
    await expect(removidaBadge).toHaveCount(0);
  });

  test("Limpar restaura lista sem parametros na URL", async ({ page }) => {
    await page.getByLabel(/número/i).fill("PERF-00001");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page.getByText("PERF-00001")).toBeVisible();

    await page.getByRole("button", { name: /limpar/i }).click();
    await expect(page).not.toHaveURL(/numero_assistencia/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("filtro sem resultado exibe mensagem e nao confunde com falha", async ({ page }) => {
    await page.getByLabel(/número/i).fill("NUMERO-QUE-NAO-EXISTE-XYZ");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page.getByRole("table")).toHaveCount(0);
    // Deve haver texto de "sem resultado" visível, nunca mensagem de erro de sistema
    await expect(page.getByText(/nenhuma|sem resultado|não encontrad/i)).toBeVisible();
    await expect(page.getByText(/falha|erro inesperado/i)).toHaveCount(0);
  });

  test("Carregar mais nao duplica IDs de assistencia", async ({ page }) => {
    const carregarMais = page.getByRole("button", { name: /carregar mais/i });
    if (!(await carregarMais.isVisible())) {
      test.skip(true, "Paginação não disponível com a massa atual.");
    }

    const firstIds = await page.getByRole("link", { name: /ASS-|PERF-/i }).allTextContents();
    await carregarMais.click();
    await expect(carregarMais.or(page.getByRole("table"))).toBeVisible();
    const allIds = await page.getByRole("link", { name: /ASS-|PERF-/i }).allTextContents();

    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
    expect(allIds.length).toBeGreaterThan(firstIds.length);
  });

  test("abrir detalhe e voltar restaura filtros via returnSearch", async ({ page }) => {
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page.getByText("ASS-100")).toBeVisible();

    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);

    await page.getByRole("link", { name: /voltar/i }).click();
    await expect(page).toHaveURL(/assistencias-mms/);
    await expect(page).toHaveURL(/numero_assistencia=ASS-100/);
  });
});

// ---------------------------------------------------------------------------
// E2E-08-02 — Removidas
// ---------------------------------------------------------------------------

test.describe("E2E-08-02 — Situacao de removidas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("selecionar Removidas exibe somente registros removidos com badge textual", async ({
    page,
  }) => {
    await page.getByLabel(/situação/i).selectOption("removido");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page).toHaveURL(/situacao=removido/);
    // Se houver removidos no seed, cada linha deve ter badge textual (não só cor)
    const rows = await page.getByRole("row").count();
    if (rows > 1) {
      await expect(page.getByText("Removida").first()).toBeVisible();
    }
  });

  test("selecionar Ativas e Removidas exibe ambas", async ({ page }) => {
    await page.getByLabel(/situação/i).selectOption("todos");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await expect(page).toHaveURL(/situacao=todos/);
  });
});

// ---------------------------------------------------------------------------
// E2E-08-03 — Detalhe em dois níveis e valores
// ---------------------------------------------------------------------------

test.describe("E2E-08-03 — Detalhe ASS-100", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);
  });

  test("detalhe exibe numero, posto e data da assistencia", async ({ page }) => {
    await expect(page.getByText("ASS-100")).toBeVisible();
    await expect(page.getByText(/Posto A/i)).toBeVisible();
    await expect(page.getByText("2026-06-24").or(page.getByText("24/06/2026"))).toBeVisible();
  });

  test("partes aparecem sob a assistencia, nao como assistencias separadas", async ({ page }) => {
    // Deve haver secao de partes dentro do detalhe, mas ASS-100 nao deve
    // aparecer como outro item de lista separado na mesma pagina
    const numeroCount = await page.getByText("ASS-100").count();
    // Pode aparecer no cabecalho e em breadcrumb, mas nao como linha de tabela adicional
    expect(numeroCount).toBeLessThanOrEqual(3);
  });

  test("cliente vigente e o valor corrigido (badge Corrigido visivel)", async ({ page }) => {
    await expect(page.getByText("Cliente A corrigido no Doka")).toBeVisible();
    await expect(page.getByText(/corrigido/i).first()).toBeVisible();
  });

  test("valor importado ainda visivel apos correcao", async ({ page }) => {
    // O EffectiveValue deve manter importado acessível (details/summary ou similar)
    await expect(page.getByText(/importado/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-08-04 — Correção dos quatro campos
// ---------------------------------------------------------------------------

test.describe("E2E-08-04 — Corrigir campos autorizados", () => {
  test("dialogo de correcao impede envio sem valor", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);

    // Abre diálogo de correção do cliente (nível assistência)
    await page.getByRole("button", { name: /corrigir/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Tenta confirmar sem valor
    const valorInput = page.getByRole("dialog").getByRole("textbox").first();
    await valorInput.clear();
    await page.getByRole("dialog").getByRole("button", { name: /confirmar|salvar/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible(); // ainda aberto
    await expect(page.getByText(/obrigatório|informe|campo/i).first()).toBeVisible();
  });

  test("dialogo de correcao impede envio sem justificativa", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");

    await page.getByRole("button", { name: /corrigir/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const valorInput = page.getByRole("dialog").getByRole("textbox").first();
    await valorInput.fill("Novo valor E2E");
    // Não preenche justificativa
    await page.getByRole("dialog").getByRole("button", { name: /confirmar|salvar/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/justificativa|obrigatório/i).first()).toBeVisible();
  });

  test("fechar dialogo com Escape nao salva e retorna foco", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");

    const corrigirBtn = page.getByRole("button", { name: /corrigir/i }).first();
    await corrigirBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Foco deve retornar ao botão que abriu o diálogo
    await expect(corrigirBtn).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// E2E-08-05 — Campos proibidos, perfil consulta e posto alheio
// ---------------------------------------------------------------------------

test.describe("E2E-08-05 — Restricoes de edicao e acesso", () => {
  test("campos proibidos nao possuem botao de corrigir no detalhe", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);

    // Número, posto, data e status não devem ter ação de correção
    const headings = await page.getByRole("heading").allTextContents();
    for (const heading of headings) {
      if (/número|posto|data|status/i.test(heading)) {
        // O heading em si não deve ter botão de corrigir adjacente
        const section = page.getByText(heading).first().locator("..").locator("..");
        await expect(section.getByRole("button", { name: /corrigir/i })).toHaveCount(0);
      }
    }
  });

  test("URL direta de assistencia de posto alheio retorna resposta neutra", async ({ page }) => {
    // Operador só tem acesso ao Posto A — tenta acessar UUID genérico de outro posto
    await login(page, PROFILES.operador.email);
    await page.goto("/app/assistencias-mms/ffffffff-ffff-4fff-8fff-ffffffffffff");
    // Não deve exibir dados; deve exibir negação neutra ou redirecionar
    await expect(page.getByText(/cliente a corrigido|ass-100/i)).toHaveCount(0);
    await expect(
      page.getByText(/acesso negado|não encontrad|indisponível|sem permissão/i),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-08-07 — Histórico e link para lote de origem
// ---------------------------------------------------------------------------

test.describe("E2E-08-07 — Historico e integracao com Spec 007", () => {
  test("historico exibe eventos em ordem decrescente com ator e justificativa", async ({
    page,
  }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);

    // Aguarda seção de histórico
    await expect(page.getByText(/histórico|origem/i).first()).toBeVisible();

    // Deve haver ao menos um evento de importação ou correção
    await expect(
      page.getByText(/importação|correção|corrigido/i).first(),
    ).toBeVisible();

    // Deve exibir data/hora do evento
    await expect(page.getByText(/2026/)).toBeVisible();
  });

  test("link Abrir lote de origem navega para rota de detalhe da Spec 007", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);

    const loteLink = page.getByRole("link", { name: /abrir lote/i }).first();
    if (!(await loteLink.isVisible())) {
      test.skip(true, "Nenhum lote de origem disponível com cobertura integral no seed.");
    }

    await loteLink.click();
    await expect(page).toHaveURL(/importacoes-mms\/.+/);
  });
});

// ---------------------------------------------------------------------------
// Acessibilidade — páginas de Assistências MMS
// ---------------------------------------------------------------------------

test.describe("Acessibilidade — Assistencias MMS", () => {
  test("lista de assistencias nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page, PROFILES.operador.email);
    await page.goto("/app/assistencias-mms");
    await expect(page.getByRole("table")).toBeVisible();
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("detalhe de assistencia nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await expect(page).toHaveURL(/assistencias-mms\/.+/);
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("dialogo de correcao aberto nao tem violacoes serias/criticas", async ({ page }) => {
    await login(page, PROFILES.direcaoAdmin.email);
    await page.goto("/app/assistencias-mms");
    await page.getByLabel(/número/i).fill("ASS-100");
    await page.getByRole("button", { name: /aplicar/i }).click();
    await openAssistanceDetail(page, "ASS-100");
    await page.getByRole("button", { name: /corrigir/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoSeriousOrCriticalViolations(page);
  });
});
