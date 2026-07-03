import { useEffect, useMemo, useState } from "react";
import {
  createCatalogService,
  type CatalogItem,
  type CatalogService,
  type PrioridadeItem,
  type UsuarioItem,
} from "../../services/catalog-service";

export interface TaskCatalogs {
  postos: CatalogItem[];
  prioridades: PrioridadeItem[];
  cargos: CatalogItem[];
  usuarios: UsuarioItem[];
}

const EMPTY: TaskCatalogs = { postos: [], prioridades: [], cargos: [], usuarios: [] };

export function useTaskCatalogs(injected?: CatalogService) {
  const service = useMemo(() => injected ?? createCatalogService(), [injected]);
  const [catalogs, setCatalogs] = useState<TaskCatalogs>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      service.postos(),
      service.prioridades(),
      service.cargosFuncoes(),
      service.usuariosAtivos(),
    ])
      .then(([postos, prioridades, cargos, usuarios]) => {
        if (active) setCatalogs({ postos, prioridades, cargos, usuarios });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause : new Error("Falha ao carregar cadastros."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service]);

  return { catalogs, loading, error };
}
