/**
 * Application provider composition.
 *
 * Exposes an injectable service boundary (`AppServices`) so production code
 * uses the real Supabase client/audit service while tests can inject
 * deterministic doubles (see `tests/helpers/supabase-mocks.ts`). This phase
 * only wires the boundary; Auth/access providers are implemented in later
 * stories (US1+).
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import { createAuditService, type AuditService } from "../services/audit-service";
import { createAppQueryClient } from "./query-client";

export interface AppServices {
  supabase: SupabaseClient;
  audit: AuditService;
}

const AppServicesContext = createContext<AppServices | undefined>(undefined);

export interface AppProvidersProps {
  children: ReactNode;
  /** Overrides for tests; production renders without this prop. */
  services?: Partial<AppServices>;
}

function buildServices(overrides?: Partial<AppServices>): AppServices {
  const supabase = overrides?.supabase ?? getSupabaseClient();
  const audit = overrides?.audit ?? createAuditService(supabase);
  return { supabase, audit };
}

/**
 * Root provider composition for the application. Wrap the router tree with
 * this component once in `main.tsx`.
 */
export function AppProviders({ children, services }: AppProvidersProps) {
  const value = useMemo(() => buildServices(services), [services]);
  const queryClient = useMemo(() => createAppQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppServicesContext.Provider value={value}>{children}</AppServicesContext.Provider>
    </QueryClientProvider>
  );
}

/** Accesses the injected application service boundary. */
export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) {
    throw new Error("useAppServices must be used within <AppProviders>.");
  }
  return services;
}
