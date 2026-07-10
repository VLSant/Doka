/**
 * Executa uma ação por item em sequência, tolerando falhas parciais.
 * Lança erro com contagem ("N de M") quando algum item falha, para que a UI
 * reporte o resultado real — os itens já processados foram commitados no banco.
 */
export async function runBatch(
  ids: string[],
  action: (id: string) => Promise<unknown>,
  describe: (failed: number, total: number) => string,
): Promise<void> {
  const failed: string[] = [];
  for (const id of ids) {
    try {
      await action(id);
    } catch {
      failed.push(id);
    }
  }
  if (failed.length > 0) {
    throw new Error(describe(failed.length, ids.length));
  }
}
