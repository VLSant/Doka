import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { Input } from "../../../components/ui/Input";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/FormControls";
import { Skeleton } from "../../../components/ui/Skeleton";
import { AuditEventList } from "../AuditEventList";
import { createAuditHistoryService, type AuditService } from "../audit-service";
import type { AuditCatalogs, AuditFilters } from "../types";
import "../auditoria.css";

const EMPTY_CATALOGS: AuditCatalogs = { usuarios: [], postos: [] };

export function AuditHistoryPage({ service: injected }: { service?: AuditService }) {
  const service = useMemo(() => injected ?? createAuditHistoryService(), [injected]);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const eventsQuery = useQuery({
    queryKey: queryKeys.audit.history(filters),
    queryFn: () => service.list(filters),
  });
  const catalogsQuery = useQuery({
    queryKey: queryKeys.audit.catalogs(),
    queryFn: () => service.catalogs(),
  });
  const events = eventsQuery.data ?? [];
  const catalogs = catalogsQuery.data ?? EMPTY_CATALOGS;
  const loading = eventsQuery.isPending || catalogsQuery.isPending;
  const error = eventsQuery.error?.message ?? catalogsQuery.error?.message ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim() || undefined;
    const next: AuditFilters = {
      usuarioId: value("usuarioId"),
      entidadeTipo: value("entidadeTipo"),
      acao: value("acao"),
      postoId: value("postoId"),
      dataDe: value("dataDe"),
      dataAte: value("dataAte"),
    };
    setFilters(next);
  }

  function updateSearch(acao: string) {
    const next = { ...filters, acao: acao || undefined };
    setFilters(next);
  }

  return (
    <Page className="audit-page">
      <PageHeader
        eyebrow="Governança"
        title="Histórico e auditoria"
        description="Consulte alterações e operações críticas dentro do seu escopo."
      />
      <div className="doka-list-toolbar">
        <SearchInput
          value={filters.acao ?? ""}
          placeholder="Buscar evento…"
          onChange={updateSearch}
        />
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros
          {Object.values(filters).filter(Boolean).length
            ? ` (${Object.values(filters).filter(Boolean).length})`
            : ""}
        </Button>
      </div>
      <FilterChips
        items={Object.entries(filters)
          .filter(([key, value]) => key !== "acao" && value)
          .map(([id, value]) => ({ id, label: `${id}: ${value}` }))}
        onRemove={(id) => {
          const next = { ...filters, [id]: undefined };
          setFilters(next);
        }}
        onClear={() => {
          const next = { acao: filters.acao };
          setFilters(next);
        }}
      />
      <Drawer open={filtersOpen} title="Filtros de auditoria" onClose={() => setFiltersOpen(false)}>
        <form className="audit-filters" onSubmit={submit}>
          <Select label="Usuário" name="usuarioId" defaultValue={filters.usuarioId ?? ""}>
            <option value="">Todos</option>
            {catalogs.usuarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Select>
          <Select label="Módulo" name="entidadeTipo" defaultValue={filters.entidadeTipo ?? ""}>
            <option value="">Todos</option>
            {[
              "tarefas",
              "rotinas",
              "ocorrencias",
              "lancamentos_operacionais",
              "mms_assistencias",
              "mms_lotes_importacao",
              "usuarios",
              "postos",
              "metas_eficiencia",
            ].map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Select label="Posto" name="postoId" defaultValue={filters.postoId ?? ""}>
            <option value="">Todos</option>
            {catalogs.postos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Select>
          <Input label="De" name="dataDe" type="date" defaultValue={filters.dataDe} />
          <Input label="Até" name="dataAte" type="date" defaultValue={filters.dataAte} />
          <Button type="submit" disabled={loading} onClick={() => setFiltersOpen(false)}>
            Aplicar filtros
          </Button>
        </form>
      </Drawer>
      {loading ? <Skeleton /> : null}
      {error ? (
        <FeedbackState tone="error" title="Histórico indisponível" description={error} />
      ) : null}
      {!loading && !error ? <AuditEventList events={events} /> : null}
    </Page>
  );
}

export default AuditHistoryPage;
