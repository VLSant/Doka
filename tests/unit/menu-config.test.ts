/**
 * Unit tests for menu derivation (T056).
 *
 * Verifies that Operador, Supervisao, and Direcao/Administracao menus are
 * derived purely from `ROUTE_DEFINITIONS` (`src/app/routes.ts`) plus the
 * current profile, per `route-navigation-contract.md` "Menu Contract":
 * the menu is generated from the same typed route definitions used by the
 * router, never a separate hardcoded list. `hidden` routes are not
 * rendered at all; `placeholder`/`disabled` routes are rendered but
 * disabled; `available` routes are rendered and navigable.
 */
import { describe, expect, it } from "vitest";
import { buildMenuForProfile } from "../../src/modules/navigation/menu-config";
import { ROUTE_DEFINITIONS } from "../../src/app/routes";

describe("menu-config: buildMenuForProfile", () => {
  it("derives the Operador menu only from routes whose profiles include operador", () => {
    const menu = buildMenuForProfile("operador");

    const ids = menu.map((item) => item.id);
    expect(ids).not.toContain("cadastros");
    expect(ids).not.toContain("historico-auditoria");
    expect(ids).toContain("dashboard");
    expect(ids).toContain("ocorrencias");
  });

  it("derives the Supervisao menu including the supervisao-only routes", () => {
    const menu = buildMenuForProfile("supervisao");
    const ids = menu.map((item) => item.id);

    expect(ids).toContain("cadastros");
    expect(ids).toContain("historico-auditoria");
    expect(ids).toContain("dashboard");
  });

  it("derives the Direcao/Administracao menu including every official route", () => {
    const menu = buildMenuForProfile("direcao_admin");
    const ids = menu.map((item) => item.id);

    for (const route of ROUTE_DEFINITIONS) {
      if (route.profiles.includes("direcao_admin")) {
        expect(ids).toContain(route.id);
      }
    }
  });

  it("never includes a route id absent from ROUTE_DEFINITIONS (single source of truth)", () => {
    const menu = buildMenuForProfile("operador");
    const validIds = new Set(ROUTE_DEFINITIONS.map((route) => route.id));
    for (const item of menu) {
      expect(validIds.has(item.id)).toBe(true);
    }
  });

  it("orders menu items by navigationOrder, matching the route contract order", () => {
    const menu = buildMenuForProfile("direcao_admin");
    const orders = menu.map((item) => item.navigationOrder);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("marks an available route as navigable (not disabled)", () => {
    const menu = buildMenuForProfile("operador");
    const dashboard = menu.find((item) => item.id === "dashboard");
    expect(dashboard?.disabled).toBe(false);
  });

  it("marks a placeholder route as disabled, with a clear unavailable label, but still rendered", () => {
    const menu = buildMenuForProfile("operador");
    const custos = menu.find((item) => item.id === "custos-extras");
    expect(custos?.disabled).toBe(true);
    expect(custos?.unavailableLabel).toMatch(/ainda n[aã]o dispon[ií]vel/i);
  });

  it("excludes (hides) a route entirely when the profile is not allowed for it", () => {
    const menu = buildMenuForProfile("operador");
    expect(menu.some((item) => item.id === "cadastros")).toBe(false);
  });

  it("includes the path and label from the underlying route definition", () => {
    const menu = buildMenuForProfile("operador");
    const dashboard = menu.find((item) => item.id === "dashboard");
    expect(dashboard?.path).toBe("/app/dashboard");
    expect(dashboard?.label).toBe("Dashboard");
  });
});
