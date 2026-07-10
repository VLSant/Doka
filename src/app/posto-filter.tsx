/**
 * Global posto filter ("Todos os postos" pill), plano
 * `docs/11-plano-migracao-estilo-dracma.md` secao 4.5/5.
 *
 * Persists the selected posto in `localStorage` and exposes it via context so
 * list pages can use it as a *default/narrowing* filter: a page's own local
 * posto filter always takes precedence when it is set explicitly. Users with
 * a single posto (or without `escopoGlobal`/multiple postos) get a static,
 * disabled representation instead of a real selector.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PostoAccess } from "../modules/access/types";

const STORAGE_KEY = "doka.posto-filter.selected";

export interface PostoFilterContextValue {
  /** `null` means "Todos os postos". */
  postoId: string | null;
  setPostoId: (postoId: string | null) => void;
  /** Postos accessible to the current user, from the auth context. */
  postos: PostoAccess[];
  /** Whether the pill should behave as a real selector (multiple postos + global scope allowed). */
  selectable: boolean;
}

const PostoFilterContext = createContext<PostoFilterContextValue | undefined>(undefined);

function readStoredPostoId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredPostoId(value: string | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort; ambiente sem localStorage nao deve quebrar a UI.
  }
}

export interface PostoFilterProviderProps {
  children: ReactNode;
  /** Postos accessible to the current user; empty while context is not resolved. */
  postos: PostoAccess[];
  /** Direcao/Administracao (escopo global) can browse "Todos os postos". */
  escopoGlobal: boolean;
}

export function PostoFilterProvider({ children, postos, escopoGlobal }: PostoFilterProviderProps) {
  const [storedPostoId, setStoredPostoId] = useState<string | null>(() => readStoredPostoId());

  const selectable = escopoGlobal || postos.length > 1;

  // Deriva o postoId efetivo durante a renderizacao (sem efeitos):
  // - Usuario sem escolha real (um unico posto ou nenhum): trava no unico
  //   posto disponivel, ignorando qualquer valor persistido de outra
  //   sessao/usuario.
  // - Usuario com escolha real: usa o valor persistido, mas descarta um
  //   posto_id que nao pertence mais ao conjunto acessivel (ex.: troca de
  //   conta) sem nunca aplicar um filtro obsoleto.
  const postoId = selectable
    ? storedPostoId && postos.some((posto) => posto.postoId === storedPostoId)
      ? storedPostoId
      : null
    : (postos[0]?.postoId ?? null);

  const setPostoId = useCallback((next: string | null) => {
    setStoredPostoId(next);
    writeStoredPostoId(next);
  }, []);

  const value = useMemo<PostoFilterContextValue>(
    () => ({ postoId, setPostoId, postos, selectable }),
    [postoId, setPostoId, postos, selectable],
  );

  return <PostoFilterContext.Provider value={value}>{children}</PostoFilterContext.Provider>;
}

/** Neutral value used when no `<PostoFilterProvider>` is mounted (e.g. a
 * list page rendered standalone in tests, or before the auth context has an
 * operational context yet): behaves as "sem filtro global". */
const NO_FILTER_VALUE: PostoFilterContextValue = {
  postoId: null,
  setPostoId: () => {},
  postos: [],
  selectable: false,
};

export function usePostoFilter(): PostoFilterContextValue {
  const context = useContext(PostoFilterContext);
  return context ?? NO_FILTER_VALUE;
}
