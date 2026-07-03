/**
 * Unit tests for the pure route guard (T043).
 *
 * Verifies the mandatory evaluation order from `route-navigation-contract.md`
 * ("Evaluation Order"): Auth -> operational context -> profile -> posto ->
 * module availability, and that "denied" (profile/posto) takes precedence
 * over "unavailable" (module/feature flag) whenever both would apply.
 */
import { describe, expect, it } from "vitest";
import { evaluateRouteAccess } from "../../src/modules/access/route-guard";
import { getRouteDefinition } from "../../src/app/routes";
import type { AuthState } from "../../src/modules/auth/auth-state";
import { direcaoAdminContext, operadorContext, supervisaoContext } from "../helpers/access-fixtures";

function authorizedState(context = operadorContext): AuthState {
  return { name: "autorizado", context };
}

describe("route-guard: evaluateRouteAccess", () => {
  it("denies with sem_sessao when there is no Auth session, before any other check", () => {
    const outcome = evaluateRouteAccess({
      authState: { name: "nao_autenticado" },
      route: getRouteDefinition("cadastros"),
    });
    expect(outcome).toEqual({ kind: "sem_sessao" });
  });

  it("denies with sessao_expirada when the session expired, before context/profile/posto checks", () => {
    const outcome = evaluateRouteAccess({
      authState: { name: "expirado" },
      route: getRouteDefinition("dashboard"),
    });
    expect(outcome).toEqual({ kind: "sessao_expirada" });
  });

  it("reports contexto_invalido when the operational context is blocked, before profile/posto/availability", () => {
    const outcome = evaluateRouteAccess({
      authState: { name: "bloqueado", reason: "sem_posto_autorizado" },
      route: getRouteDefinition("dashboard"),
    });
    expect(outcome).toEqual({ kind: "contexto_invalido", reason: "sem_posto_autorizado" });
  });

  it("reports falha_temporaria while the auth/context state is not yet settled", () => {
    const outcome = evaluateRouteAccess({
      authState: { name: "falha_temporaria" },
      route: getRouteDefinition("dashboard"),
    });
    expect(outcome).toEqual({ kind: "falha_temporaria" });
  });

  it("denies acesso_negado when the profile is not allowed for the route, even if the module would be unavailable", () => {
    // "cadastros" is supervisao/direcao_admin only and is a placeholder
    // (unavailable) route: an Operador must see "denied", not "unavailable".
    const outcome = evaluateRouteAccess({
      authState: authorizedState(operadorContext),
      route: getRouteDefinition("cadastros"),
    });
    expect(outcome).toEqual({ kind: "acesso_negado" });
  });

  it("allows profile-permitted Supervisao onto a profile-restricted route, deferring to availability next", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(supervisaoContext),
      route: getRouteDefinition("cadastros"),
    });
    // Allowed by profile/posto, but the module itself is a placeholder.
    expect(outcome).toEqual({ kind: "modulo_indisponivel" });
  });

  it("reports modulo_indisponivel for an allowed profile on a placeholder route", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(supervisaoContext),
      route: getRouteDefinition("historico-auditoria"),
    });
    expect(outcome).toEqual({ kind: "modulo_indisponivel" });
  });

  it("authorizes an allowed profile on an available route", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(operadorContext),
      route: getRouteDefinition("dashboard"),
    });
    expect(outcome).toEqual({ kind: "autorizado" });
  });

  it("denies acesso_negado when an unauthorized posto_id is requested, before availability is evaluated", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(operadorContext),
      route: getRouteDefinition("dashboard"),
      requestedPostoId: "40000000-0000-0000-0000-000000000099",
    });
    expect(outcome).toEqual({ kind: "acesso_negado" });
  });

  it("allows a posto_id the user is authorized for", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(operadorContext),
      route: getRouteDefinition("dashboard"),
      requestedPostoId: operadorContext.postos[0].postoId,
    });
    expect(outcome).toEqual({ kind: "autorizado" });
  });

  it("never rejects a posto_id for an escopo_global (Direcao/Administracao) user", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(direcaoAdminContext),
      route: getRouteDefinition("cadastros"),
      requestedPostoId: "40000000-0000-0000-0000-000000000099",
    });
    expect(outcome).toEqual({ kind: "modulo_indisponivel" });
  });

  it("reports rota_nao_encontrada when no route definition is given for a known path lookup failure", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(operadorContext),
      route: null,
    });
    expect(outcome).toEqual({ kind: "rota_nao_encontrada" });
  });

  it("evaluates checks in the mandatory order: profile denial wins over an unauthorized posto_id", () => {
    const outcome = evaluateRouteAccess({
      authState: authorizedState(operadorContext),
      route: getRouteDefinition("cadastros"),
      requestedPostoId: "40000000-0000-0000-0000-000000000099",
    });
    // Profile check (step 3) happens before posto check (step 4): the
    // outcome must be the same acesso_negado regardless of the posto_id.
    expect(outcome).toEqual({ kind: "acesso_negado" });
  });
});
