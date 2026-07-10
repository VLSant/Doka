import { describe, expect, it } from "vitest";
import { applySort, toggleSort, type SortState } from "../../../src/lib/sorting";

describe("toggleSort", () => {
  it("ativa uma nova coluna em ordem ascendente", () => {
    const state: SortState<"nome"> = { key: null, direction: "asc" };
    expect(toggleSort(state, "nome")).toEqual({ key: "nome", direction: "asc" });
  });

  it("alterna a mesma coluna de asc para desc", () => {
    const state: SortState<"nome"> = { key: "nome", direction: "asc" };
    expect(toggleSort(state, "nome")).toEqual({ key: "nome", direction: "desc" });
  });

  it("remove a ordenacao ao clicar pela terceira vez na mesma coluna", () => {
    const state: SortState<"nome"> = { key: "nome", direction: "desc" };
    expect(toggleSort(state, "nome")).toEqual({ key: null, direction: "asc" });
  });

  it("troca de coluna reiniciando em asc", () => {
    const state: SortState<"nome" | "data"> = { key: "nome", direction: "desc" };
    expect(toggleSort(state, "data")).toEqual({ key: "data", direction: "asc" });
  });
});

describe("applySort", () => {
  interface Item {
    id: string;
    nome: string;
    valor: number;
    data: string | null;
  }

  const items: Item[] = [
    { id: "b", nome: "Banana", valor: 20, data: "2026-02-01" },
    { id: "a", nome: "Abacaxi", valor: 10, data: null },
    { id: "c", nome: "Cereja", valor: 30, data: "2026-01-01" },
  ];

  function getValue(item: Item, key: "nome" | "valor" | "data") {
    return item[key];
  }

  it("retorna a mesma referencia quando nao ha coluna ativa", () => {
    const state: SortState<"nome" | "valor" | "data"> = { key: null, direction: "asc" };
    expect(applySort(items, state, getValue)).toBe(items);
  });

  it("ordena strings em ordem ascendente", () => {
    const state: SortState<"nome" | "valor" | "data"> = { key: "nome", direction: "asc" };
    const sorted = applySort(items, state, getValue).map((item) => item.id);
    expect(sorted).toEqual(["a", "b", "c"]);
  });

  it("ordena strings em ordem descendente", () => {
    const state: SortState<"nome" | "valor" | "data"> = { key: "nome", direction: "desc" };
    const sorted = applySort(items, state, getValue).map((item) => item.id);
    expect(sorted).toEqual(["c", "b", "a"]);
  });

  it("ordena numeros corretamente", () => {
    const state: SortState<"nome" | "valor" | "data"> = { key: "valor", direction: "asc" };
    const sorted = applySort(items, state, getValue).map((item) => item.id);
    expect(sorted).toEqual(["a", "b", "c"]);
  });

  it("empurra valores vazios/nulos para o final independente da direcao", () => {
    const asc = applySort(items, { key: "data", direction: "asc" }, getValue).map((i) => i.id);
    expect(asc).toEqual(["c", "b", "a"]);
    const desc = applySort(items, { key: "data", direction: "desc" }, getValue).map((i) => i.id);
    expect(desc).toEqual(["b", "c", "a"]);
  });

  it("nao muta o array original", () => {
    const copy = [...items];
    applySort(items, { key: "nome", direction: "asc" }, getValue);
    expect(items).toEqual(copy);
  });
});
