import type { SortDirection } from "../components/ui/TableCardRow";

export interface SortState<TKey extends string = string> {
  key: TKey | null;
  direction: SortDirection;
}

/**
 * Alterna o estado de ordenação ao clicar em uma coluna:
 * - coluna nova: ativa em asc.
 * - mesma coluna em asc: passa para desc.
 * - mesma coluna em desc: remove ordenação (volta à ordem original).
 */
export function toggleSort<TKey extends string>(
  current: SortState<TKey>,
  key: TKey,
): SortState<TKey> {
  if (current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return { key: null, direction: "asc" };
}

type SortValue = string | number | null | undefined;

/**
 * Ordena uma cópia do array de acordo com o SortState e uma função extratora
 * de valor comparável por coluna. Retorna o array original (mesma referência)
 * quando não há coluna ativa.
 */
export function applySort<TItem, TKey extends string>(
  items: TItem[],
  sort: SortState<TKey>,
  getValue: (item: TItem, key: TKey) => SortValue,
): TItem[] {
  if (!sort.key) return items;
  const key = sort.key;
  const direction = sort.direction;
  const sorted = [...items].sort((a, b) => {
    const va = getValue(a, key);
    const vb = getValue(b, key);
    const aEmpty = va === null || va === undefined || va === "";
    const bEmpty = vb === null || vb === undefined || vb === "";
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    let comparison: number;
    if (typeof va === "number" && typeof vb === "number") {
      comparison = va - vb;
    } else {
      comparison = String(va).localeCompare(String(vb), "pt-BR", { sensitivity: "base" });
    }
    return direction === "asc" ? comparison : -comparison;
  });
  return sorted;
}
