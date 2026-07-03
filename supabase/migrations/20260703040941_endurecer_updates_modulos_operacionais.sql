-- Endurece os CRUDs diretos dos módulos operacionais.
-- 1. O ator de uma edição passa a ser sempre derivado da sessão.
-- 2. Um lançamento não pode ser movido para um posto fora do escopo do ator.

create or replace function app_private.normalizar_updated_by_operacional()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ator_id uuid;
begin
  ator_id := app_private.usuario_atual_id();
  if ator_id is null then
    raise exception 'acesso_negado';
  end if;

  new.updated_by := ator_id;
  return new;
end;
$$;

drop trigger if exists ocorrencias_normalizar_updated_by on public.ocorrencias;
create trigger ocorrencias_normalizar_updated_by
before insert or update on public.ocorrencias
for each row execute function app_private.normalizar_updated_by_operacional();

drop trigger if exists lancamentos_normalizar_updated_by
on public.lancamentos_operacionais;
create trigger lancamentos_normalizar_updated_by
before insert or update on public.lancamentos_operacionais
for each row execute function app_private.normalizar_updated_by_operacional();

drop policy if exists lancamentos_update_por_escopo
on public.lancamentos_operacionais;

create policy lancamentos_update_por_escopo
on public.lancamentos_operacionais
for update
to authenticated
using (
  deleted_at is null
  and (
    app_private.usuario_e_direcao_admin()
    or lancado_por = app_private.usuario_atual_id()
    or (
      app_private.usuario_e_supervisao()
      and app_private.usuario_tem_acesso_posto(posto_id)
    )
  )
)
with check (
  deleted_at is null
  and (
    app_private.usuario_e_direcao_admin()
    or (
      app_private.usuario_tem_acesso_posto(posto_id)
      and (
        lancado_por = app_private.usuario_atual_id()
        or app_private.usuario_e_supervisao()
      )
    )
  )
);

revoke all on function app_private.normalizar_updated_by_operacional()
from public, anon, authenticated;
