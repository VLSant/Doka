import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Tabs } from "../../../components/ui/Tabs";
import type { LotService } from "../lot-service";
import type { LotCollection } from "../types";

const COLLECTIONS: Array<{ id: LotCollection; label: string }> = [
  { id: "linhas", label: "Linhas" }, { id: "erros", label: "Erros" },
  { id: "alertas", label: "Alertas" }, { id: "correcoes", label: "Correções" },
  { id: "operacoes", label: "Operações" }, { id: "auditoria", label: "Auditoria" },
];

export function LotItemsTabs({ lotId, service }: { lotId: string; service: LotService }) {
  const [active, setActive] = useState<LotCollection>("linhas");
  const itemsQuery = useQuery({
    queryKey: queryKeys.importacoes.lotItems(lotId, active),
    queryFn: () => service.items(lotId, active),
  });
  const items = itemsQuery.data?.itens ?? [];
  const loading = itemsQuery.isPending;
  const error = itemsQuery.error ? "Não foi possível carregar esta coleção." : "";

  return (
    <section className="mms-lot-tabs">
      <Tabs label="Dados do lote" value={active} items={COLLECTIONS} onChange={setActive} />
      <div role="tabpanel">
        {loading ? <LoadingState message="Carregando dados do lote..." /> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error && items.length === 0 ? <p>Nenhum registro nesta coleção.</p> : null}
        {!loading && !error && items.length > 0 ? (
          <ul className="mms-lot-items">{items.map((item) => <li key={item.id}><pre>{JSON.stringify(item, null, 2)}</pre></li>)}</ul>
        ) : null}
      </div>
    </section>
  );
}
