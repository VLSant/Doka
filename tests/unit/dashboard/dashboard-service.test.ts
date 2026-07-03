import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  createDashboardService,
  todayInBahia,
  validateDashboardFilters,
} from "../../../src/modules/dashboard/dashboard-service";

interface RecordedQuery {
  table: string;
  filters: Array<[string, string, unknown]>;
}

function dashboardClient(counts: number[]) {
  const queries: RecordedQuery[] = [];
  let countIndex = 0;

  function from(table: string) {
    const query: RecordedQuery = { table, filters: [] };
    queries.push(query);
    const builder = {
      select() {
        return builder;
      },
      is(column: string, value: unknown) {
        query.filters.push(["is", column, value]);
        return builder;
      },
      eq(column: string, value: unknown) {
        query.filters.push(["eq", column, value]);
        return builder;
      },
      in(column: string, value: unknown) {
        query.filters.push(["in", column, value]);
        return builder;
      },
      gte(column: string, value: unknown) {
        query.filters.push(["gte", column, value]);
        return builder;
      },
      lte(column: string, value: unknown) {
        query.filters.push(["lte", column, value]);
        return builder;
      },
      lt(column: string, value: unknown) {
        query.filters.push(["lt", column, value]);
        return builder;
      },
      or(value: string) {
        query.filters.push(["or", "", value]);
        return builder;
      },
      order() {
        return Promise.resolve({ data: [], error: null });
      },
      then(resolve: (value: { count: number; error: null }) => unknown) {
        return Promise.resolve({ count: counts[countIndex++] ?? 0, error: null }).then(resolve);
      },
    };
    return builder;
  }

  return {
    client: { from } as unknown as SupabaseClient,
    queries,
  };
}

describe("dashboard service", () => {
  it("applies period and posto to every RLS-backed counter query", async () => {
    const mock = dashboardClient([10, 4, 5, 1, 3, 1, 6, 8, 2, 1, 2]);
    const result = await createDashboardService(mock.client).load({
      inicio: "2026-07-01",
      fim: "2026-07-03",
      postoId: "posto-1",
    });

    expect(result.counters.assistenciasTotal).toBe(10);
    expect(result.counters.tarefasAtrasadas).toBe(2);
    expect(result.counters.lancamentosPendentes).toBe(2);
    expect(mock.queries).toHaveLength(13);
    expect(
      mock.queries.every((query) =>
        query.filters.some(
          ([operator, column, value]) =>
            operator === "eq" && column === "posto_id" && value === "posto-1",
        ),
      ),
    ).toBe(true);
    expect(mock.queries[0].filters).toContainEqual(["gte", "data_atividade", "2026-07-01"]);
    expect(mock.queries[0].filters).toContainEqual(["lte", "data_atividade", "2026-07-03"]);
  });

  it("rejects an inverted period before querying Supabase", () => {
    expect(() =>
      validateDashboardFilters({
        inicio: "2026-07-03",
        fim: "2026-07-01",
        postoId: null,
      }),
    ).toThrow("período válido");
  });

  it("uses the operational Bahia date", () => {
    expect(todayInBahia(new Date("2026-07-04T01:30:00.000Z"))).toBe("2026-07-03");
  });
});
