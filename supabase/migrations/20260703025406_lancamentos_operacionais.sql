-- Deslocamentos e Custos Extras (modulo unico de lancamentos operacionais).
-- Uma tabela com tipo de lancamento; lancamento manual sob RLS; validacao e
-- soft delete via RPCs pequenas. Custo extra exige assistencia (regra
-- vigente); deslocamento pode ou nao referenciar uma assistencia.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_lancamento_operacional') then
    create type public.tipo_lancamento_operacional as enum ('deslocamento', 'custo_extra');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_validacao') then
    create type public.status_validacao as enum ('pendente', 'validado');
  end if;
end
$$;

create table public.lancamentos_operacionais (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_lancamento_operacional not null,
  assistencia_id uuid references public.mms_assistencias(id) on delete restrict,
  posto_id uuid not null references public.postos(id) on delete restrict,
  recurso text,
  data_lancamento date not null,
  descricao text not null,
  valor numeric(12, 2) not null,
  observacoes text,
  status public.status_validacao not null default 'pendente',
  validado_por uuid references public.usuarios(id) on delete set null,
  validado_em timestamptz,
  lancado_por uuid not null references public.usuarios(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.usuarios(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  delete_reason text,
  constraint lancamentos_descricao_not_blank check (btrim(descricao) <> ''),
  constraint lancamentos_valor_positivo check (valor > 0),
  constraint lancamentos_custo_exige_assistencia check (
    tipo <> 'custo_extra' or assistencia_id is not null
  ),
  constraint lancamentos_delete_reason_required check (
    app_private.campo_soft_delete_valido(deleted_at, deleted_by, delete_reason)
  )
);

create index lancamentos_assistencia_id_idx on public.lancamentos_operacionais (assistencia_id);
create index lancamentos_posto_id_idx on public.lancamentos_operacionais (posto_id);
create index lancamentos_lancado_por_idx on public.lancamentos_operacionais (lancado_por);
create index lancamentos_validado_por_idx on public.lancamentos_operacionais (validado_por);
create index lancamentos_updated_by_idx on public.lancamentos_operacionais (updated_by);
create index lancamentos_deleted_by_idx on public.lancamentos_operacionais (deleted_by);
create index lancamentos_posto_data_idx
  on public.lancamentos_operacionais (posto_id, data_lancamento)
  where deleted_at is null;
create index lancamentos_status_tipo_idx
  on public.lancamentos_operacionais (status, tipo)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Helpers e triggers
-- ---------------------------------------------------------------------------

create or replace function app_private.usuario_pode_ver_lancamento(lancamento_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.lancamentos_operacionais l
    where l.id = lancamento_uuid
      and l.deleted_at is null
      and (
        app_private.usuario_e_direcao_admin()
        or l.lancado_por = app_private.usuario_atual_id()
        or app_private.usuario_tem_acesso_posto(l.posto_id)
      )
  )
$$;

create or replace function app_private.validar_lancamento_operacional()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  validacao_autorizada boolean :=
    coalesce(current_setting('doka.lancamento_validacao', true), '') = 'on';
  posto_assistencia uuid;
begin
  if TG_OP = 'UPDATE' then
    if new.lancado_por is distinct from old.lancado_por then
      raise exception 'lancador_imutavel';
    end if;
    if not validacao_autorizada then
      if old.status = 'validado' then
        raise exception 'lancamento_validado_imutavel';
      end if;
      if new.status is distinct from old.status
        or new.validado_por is distinct from old.validado_por
        or new.validado_em is distinct from old.validado_em
        or new.deleted_at is distinct from old.deleted_at
        or new.deleted_by is distinct from old.deleted_by
        or new.delete_reason is distinct from old.delete_reason then
        raise exception 'validacao_somente_por_rpc';
      end if;
    end if;
  end if;

  if new.assistencia_id is not null then
    select a.posto_id into posto_assistencia
    from public.mms_assistencias a
    where a.id = new.assistencia_id
      and a.deleted_at is null;

    if posto_assistencia is null then
      raise exception 'assistencia_invalida';
    end if;
    new.posto_id := posto_assistencia;
  else
    if not exists (
      select 1 from public.postos p
      where p.id = new.posto_id and p.ativo = true and p.deleted_at is null
    ) then
      raise exception 'posto_invalido';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists lancamentos_validar on public.lancamentos_operacionais;
create trigger lancamentos_validar
before insert or update on public.lancamentos_operacionais
for each row execute function app_private.validar_lancamento_operacional();

drop trigger if exists lancamentos_set_updated_at on public.lancamentos_operacionais;
create trigger lancamentos_set_updated_at
before update on public.lancamentos_operacionais
for each row execute function app_private.set_updated_at();

drop trigger if exists lancamentos_audit on public.lancamentos_operacionais;
create trigger lancamentos_audit
after insert or update on public.lancamentos_operacionais
for each row execute function app_private.auditar_modulo_operacional();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.lancamentos_operacionais enable row level security;

create policy lancamentos_select_por_escopo
on public.lancamentos_operacionais
for select
to authenticated
using (app_private.usuario_pode_ver_lancamento(id));

create policy lancamentos_insert_por_escopo
on public.lancamentos_operacionais
for insert
to authenticated
with check (
  lancado_por = app_private.usuario_atual_id()
  and status = 'pendente'
  and deleted_at is null
  and (
    app_private.usuario_e_direcao_admin()
    or app_private.usuario_tem_acesso_posto(posto_id)
  )
);

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
with check (app_private.usuario_atual_id() is not null);

revoke all on public.lancamentos_operacionais from anon;
revoke all on public.lancamentos_operacionais from authenticated;
grant select, insert, update on public.lancamentos_operacionais to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs de validacao e remocao
-- ---------------------------------------------------------------------------

create or replace function public.validar_lancamento(p_lancamento_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  l public.lancamentos_operacionais;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  select * into l from public.lancamentos_operacionais where id = p_lancamento_id for update;
  if not found or l.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if ator.perfil = 'supervisao' and not app_private.usuario_tem_acesso_posto(l.posto_id) then
    raise exception 'acesso_negado';
  end if;
  if l.status <> 'pendente' then
    raise exception 'transicao_invalida';
  end if;

  perform set_config('doka.lancamento_validacao', 'on', true);

  update public.lancamentos_operacionais
  set status = 'validado', validado_por = ator.id, validado_em = now(), updated_by = ator.id
  where id = l.id
  returning * into l;

  perform set_config('doka.lancamento_validacao', '', true);

  return to_jsonb(l);
end;
$$;

create or replace function public.remover_lancamento(
  p_lancamento_id uuid,
  p_justificativa text
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  l public.lancamentos_operacionais;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  select * into l from public.lancamentos_operacionais where id = p_lancamento_id for update;
  if not found or l.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if ator.perfil = 'supervisao' and not app_private.usuario_tem_acesso_posto(l.posto_id) then
    raise exception 'acesso_negado';
  end if;
  if nullif(btrim(coalesce(p_justificativa, '')), '') is null then
    raise exception 'justificativa_obrigatoria';
  end if;

  perform set_config('doka.lancamento_validacao', 'on', true);

  update public.lancamentos_operacionais
  set deleted_at = now(), deleted_by = ator.id, delete_reason = btrim(p_justificativa),
      updated_by = ator.id
  where id = l.id;

  perform set_config('doka.lancamento_validacao', '', true);
end;
$$;

revoke all on function public.validar_lancamento(uuid) from public, anon;
revoke all on function public.remover_lancamento(uuid, text) from public, anon;
grant execute on function public.validar_lancamento(uuid) to authenticated;
grant execute on function public.remover_lancamento(uuid, text) to authenticated;

revoke all on function app_private.usuario_pode_ver_lancamento(uuid) from public;
revoke all on function app_private.validar_lancamento_operacional() from public;
grant execute on function app_private.usuario_pode_ver_lancamento(uuid) to authenticated;
