import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { SearchInput } from "../../../components/ui/SearchInput";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
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
  const [draft, setDraft] = useState<AuditFilters>({});

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
    const trimmed = (value: string | undefined) => value?.trim() || undefined;
    const next: AuditFilters = {
      usuarioId: trimmed(draft.usuarioId),
      entidadeTipo: trimmed(draft.entidadeTipo),
      acao: filters.acao,
      postoId: trimmed(draft.postoId),
      dataDe: trimmed(draft.dataDe),
      dataAte: trimmed(draft.dataAte),
    };
    setFilters(next);
  }

  function updateSearch(acao: string) {
    const next = { ...filters, acao: acao || undefined };
    setFilters(next);
  }

  function openFilters() {
    setDraft(filters);
    setFiltersOpen(true);
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
        <Button variant="outline" onClick={openFilters}>
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
          <FormSelect
            label="Usuário"
            value={draft.usuarioId ?? ""}
            onChange={(next) => setDraft({ ...draft, usuarioId: next || undefined })}
            options={[
              { value: "", label: "Todos" },
              ...catalogs.usuarios.map((item) => ({ value: item.id, label: item.nome })),
            ]}
          />
          <FormSelect
            label="Módulo"
            value={draft.entidadeTipo ?? ""}
            onChange={(next) => setDraft({ ...draft, entidadeTipo: next || undefined })}
            options={[
              { value: "", label: "Todos" },
              ...[
                "tarefas",
                "rotinas",
                "ocorrencias",
                "lancamentos_operacionais",
                "mms_assistencias",
                "mms_lotes_importacao",
                "usuarios",
                "postos",
                "metas_eficiencia",
              ].map((item) => ({ value: item, label: item.replaceAll("_", " ") })),
            ]}
          />
          <FormSelect
            label="Posto"
            value={draft.postoId ?? ""}
            onChange={(next) => setDraft({ ...draft, postoId: next || undefined })}
            options={[
              { value: "", label: "Todos" },
              ...catalogs.postos.map((item) => ({ value: item.id, label: item.nome })),
            ]}
          />
          <DatePickerField
            label="De"
            value={draft.dataDe ?? ""}
            onChange={(next) => setDraft({ ...draft, dataDe: next || undefined })}
          />
          <DatePickerField
            label="Até"
            value={draft.dataAte ?? ""}
            onChange={(next) => setDraft({ ...draft, dataAte: next || undefined })}
          />
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
