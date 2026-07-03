/**
 * Typed route IDs, paths, profile sets, availability, and navigation order.
 *
 * Source of truth: `route-navigation-contract.md` Route Matrix. The same
 * definitions feed both the router (`router.tsx`) and the menu
 * (`navigation/menu-config.ts`, implemented in a later story) to avoid
 * divergence.
 */
import type { PerfilUsuario, RouteAvailability } from "../modules/access/types";

export type RouteId =
  | "dashboard"
  | "ocorrencias"
  | "tarefas-rotinas"
  | "assistencias-mms"
  | "importacoes-mms"
  | "custos-extras"
  | "cadastros"
  | "historico-auditoria";

export interface RouteDefinition {
  id: RouteId;
  path: string;
  label: string;
  icon: string;
  profiles: PerfilUsuario[];
  availability: RouteAvailability;
  navigationOrder: number;
}

const ALL_OFFICIAL_PROFILES: PerfilUsuario[] = ["operador", "supervisao", "direcao_admin"];

/**
 * Route matrix, ordered exactly as in `route-navigation-contract.md`.
 * `navigationOrder` reflects that same order.
 */
export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    id: "dashboard",
    path: "/app/dashboard",
    label: "Dashboard",
    icon: "layout-dashboard",
    profiles: ALL_OFFICIAL_PROFILES,
    availability: "available",
    navigationOrder: 1,
  },
  {
    id: "ocorrencias",
    path: "/app/ocorrencias",
    label: "Ocorrências",
    icon: "alert-triangle",
    profiles: ALL_OFFICIAL_PROFILES,
    availability: "available",
    navigationOrder: 2,
  },
  {
    id: "tarefas-rotinas",
    path: "/app/tarefas-rotinas",
    label: "Tarefas e Rotinas",
    icon: "list-checks",
    profiles: ALL_OFFICIAL_PROFILES,
    availability: "available",
    navigationOrder: 3,
  },
  {
    id: "assistencias-mms",
    path: "/app/assistencias-mms",
    label: "Assistências / MMS",
    icon: "life-buoy",
    profiles: ALL_OFFICIAL_PROFILES,
    availability: "available",
    navigationOrder: 4,
  },
  {
    id: "importacoes-mms",
    path: "/app/importacoes-mms",
    label: "Importações MMS",
    icon: "upload",
    profiles: ALL_OFFICIAL_PROFILES,
    availability: "available",
    navigationOrder: 5,
  },
  {
    id: "custos-extras",
    path: "/app/custos-extras",
    label: "Deslocamentos e Custos",
    icon: "wallet",
    profiles: ALL_OFFICIAL_PROFILES,
    availability: "available",
    navigationOrder: 6,
  },
  {
    id: "cadastros",
    path: "/app/cadastros",
    label: "Cadastros",
    icon: "database",
    profiles: ["supervisao", "direcao_admin"],
    availability: "available",
    navigationOrder: 7,
  },
  {
    id: "historico-auditoria",
    path: "/app/historico-auditoria",
    label: "Histórico / Auditoria",
    icon: "history",
    profiles: ["supervisao", "direcao_admin"],
    availability: "placeholder",
    navigationOrder: 8,
  },
];

export function getRouteDefinition(id: RouteId): RouteDefinition {
  const route = ROUTE_DEFINITIONS.find((definition) => definition.id === id);
  if (!route) {
    throw new Error(`Rota desconhecida: ${id}`);
  }
  return route;
}

export function isProfileAllowedForRoute(route: RouteDefinition, perfil: PerfilUsuario): boolean {
  return route.profiles.includes(perfil);
}
