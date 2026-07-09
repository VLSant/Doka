import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../app/query-keys";
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
  const query = useQuery({
    queryKey: queryKeys.taskCatalogs(),
    queryFn: async () => {
      const [postos, prioridades, cargos, usuarios] = await Promise.all([
        service.postos(),
        service.prioridades(),
        service.cargosFuncoes(),
        service.usuariosAtivos(),
      ]);
      return { postos, prioridades, cargos, usuarios };
    },
  });

  return { catalogs: query.data ?? EMPTY, loading: query.isPending, error: query.error };
}
