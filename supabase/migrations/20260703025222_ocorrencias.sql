-- Central de Ocorrencias (MVP enxuto).
-- Tabelas: ocorrencias e ocorrencia_comentarios. CRUD direto sob RLS;
-- transicoes de status e soft delete via RPCs pequenas e atomicas.
-- Ocorrencia sempre vinculada a uma assistencia (regra oficial vigente);
-- o posto e derivado da assistencia por trigger.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_ocorrencia') then
    create type public.status_ocorrencia as enum (
      'aberta', 'em_acompanhamento', 'aguardando_retorno',
      'resolvida', 'encerrada', 'reaberta'
    );
  end if;
end
$$;

create table public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  assistencia_id uuid not null references public.mms_assistencias(id) on delete restrict,
  posto_id uuid not null references public.postos(id) on delete restrict,
  tipo_ocorrencia_id uuid not null references public.tipos_ocorrencia(id) on delete restrict,
  prioridade_id uuid references public.prioridades(id) on delete set null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  criada_por uuid not null references public.usuarios(id) on delete restrict,
  titulo text not null,
  descricao text,
  observacoes text,
  status public.status_ocorrencia not null default 'aberta',
  data_retorno date,
  resolvida_em timestamptz,
  encerrada_em timestamptz,
  reaberta_em timestamptz,
  justificativa_reabertura text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.usuarios(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  delete_reason text,
  constraint ocorrencias_titulo_not_blank check (btrim(titulo) <> ''),
  constraint ocorrencias_delete_reason_required check (
    app_private.campo_soft_delete_valido(deleted_at, deleted_by, delete_reason)
  )
);

create index ocorrencias_assistencia_id_idx on public.ocorrencias (assistencia_id);
create index ocorrencias_posto_id_idx on public.ocorrencias (posto_id);
create index ocorrencias_tipo_id_idx on public.ocorrencias (tipo_ocorrencia_id);
create index ocorrencias_prioridade_id_idx on public.ocorrencias (prioridade_id);
create index ocorrencias_responsavel_id_idx on public.ocorrencias (responsavel_id);
create index ocorrencias_criada_por_idx on public.ocorrencias (criada_por);
create index ocorrencias_updated_by_idx on public.ocorrencias (updated_by);
create index ocorrencias_deleted_by_idx on public.ocorrencias (deleted_by);
create index ocorrencias_status_retorno_idx
  on public.ocorrencias (status, data_retorno)
  where deleted_at is null;

create table public.ocorrencia_comentarios (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null references public.ocorrencias(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete restrict,
  comentario text not null,
  created_at timestamptz not null default now(),
  constraint ocorrencia_comentarios_not_blank check (btrim(comentario) <> '')
);

create index ocorrencia_comentarios_ocorrencia_idx
  on public.ocorrencia_comentarios (ocorrencia_id, created_at);
create index ocorrencia_comentarios_usuario_idx on public.ocorrencia_comentarios (usuario_id);

-- ---------------------------------------------------------------------------
-- Helpers e triggers
-- ---------------------------------------------------------------------------

create or replace function app_private.usuario_pode_ver_ocorrencia(ocorrencia_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.ocorrencias o
    where o.id = ocorrencia_uuid
      and o.deleted_at is null
      and (
        app_private.usuario_e_direcao_admin()
        or o.criada_por = app_private.usuario_atual_id()
        or o.responsavel_id = app_private.usuario_atual_id()
        or app_private.usuario_tem_acesso_posto(o.posto_id)
      )
  )
$$;

-- Deriva o posto da assistencia, valida referencias e bloqueia mudancas de
-- campos controlados fora das RPCs de transicao/remocao.
create or replace function app_private.validar_ocorrencia()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  transicao_autorizada boolean :=
    coalesce(current_setting('doka.ocorrencia_transicao', true), '') = 'on';
begin
  if TG_OP = 'UPDATE' then
    if new.assistencia_id is distinct from old.assistencia_id then
      raise exception 'assistencia_imutavel';
    end if;
    if new.criada_por is distinct from old.criada_por then
      raise exception 'criador_imutavel';
    end if;
    if not transicao_autorizada then
      if new.status is distinct from old.status
        or new.resolvida_em is distinct from old.resolvida_em
        or new.encerrada_em is distinct from old.encerrada_em
        or new.reaberta_em is distinct from old.reaberta_em
        or new.justificativa_reabertura is distinct from old.justificativa_reabertura
        or new.deleted_at is distinct from old.deleted_at
        or new.deleted_by is distinct from old.deleted_by
        or new.delete_reason is distinct from old.delete_reason then
        raise exception 'transicao_somente_por_rpc';
      end if;
    end if;
  end if;

  select a.posto_id into new.posto_id
  from public.mms_assistencias a
  where a.id = new.assistencia_id
    and a.deleted_at is null;

  if new.posto_id is null then
    raise exception 'assistencia_invalida';
  end if;

  declare
    validar_tipo boolean := true;
    validar_responsavel boolean := new.responsavel_id is not null;
  begin
    if TG_OP = 'UPDATE' then
      validar_tipo := new.tipo_ocorrencia_id is distinct from old.tipo_ocorrencia_id;
      validar_responsavel := validar_responsavel
        and new.responsavel_id is distinct from old.responsavel_id;
    end if;

    if validar_tipo and not exists (
      select 1 from public.tipos_ocorrencia ti
      where ti.id = new.tipo_ocorrencia_id
        and ti.ativo = true
        and ti.deleted_at is null
    ) then
      raise exception 'tipo_ocorrencia_invalido';
    end if;

    if validar_responsavel and not exists (
      select 1 from public.usuarios u
      where u.id = new.responsavel_id
        and u.ativo = true
        and u.deleted_at is null
    ) then
      raise exception 'responsavel_invalido';
    end if;
  end;

  return new;
end;
$$;

drop trigger if exists ocorrencias_validar on public.ocorrencias;
create trigger ocorrencias_validar
before insert or update on public.ocorrencias
for each row execute function app_private.validar_ocorrencia();

drop trigger if exists ocorrencias_set_updated_at on public.ocorrencias;
create trigger ocorrencias_set_updated_at
before update on public.ocorrencias
for each row execute function app_private.set_updated_at();

drop trigger if exists ocorrencias_audit on public.ocorrencias;
create trigger ocorrencias_audit
after insert or update on public.ocorrencias
for each row execute function app_private.auditar_modulo_operacional();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.ocorrencias enable row level security;
alter table public.ocorrencia_comentarios enable row level security;

create policy ocorrencias_select_por_escopo
on public.ocorrencias
for select
to authenticated
using (app_private.usuario_pode_ver_ocorrencia(id));

create policy ocorrencias_insert_por_escopo
on public.ocorrencias
for insert
to authenticated
with check (
  criada_por = app_private.usuario_atual_id()
  and status = 'aberta'
  and deleted_at is null
  and (
    app_private.usuario_e_direcao_admin()
    or app_private.usuario_tem_acesso_posto(posto_id)
  )
);

create policy ocorrencias_update_por_escopo
on public.ocorrencias
for update
to authenticated
using (
  deleted_at is null
  and (
    app_private.usuario_e_direcao_admin()
    or criada_por = app_private.usuario_atual_id()
    or responsavel_id = app_private.usuario_atual_id()
    or app_private.usuario_tem_acesso_posto(posto_id)
  )
)
with check (app_private.usuario_atual_id() is not null);

create policy ocorrencia_comentarios_select_por_escopo
on public.ocorrencia_comentarios
for select
to authenticated
using (app_private.usuario_pode_ver_ocorrencia(ocorrencia_id));

create policy ocorrencia_comentarios_insert_por_escopo
on public.ocorrencia_comentarios
for insert
to authenticated
with check (
  usuario_id = app_private.usuario_atual_id()
  and app_private.usuario_pode_ver_ocorrencia(ocorrencia_id)
);

revoke all on public.ocorrencias, public.ocorrencia_comentarios from anon;
revoke all on public.ocorrencias, public.ocorrencia_comentarios from authenticated;
grant select, insert, update on public.ocorrencias to authenticated;
grant select, insert on public.ocorrencia_comentarios to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs de transicao e remocao
-- ---------------------------------------------------------------------------

create or replace function public.transicionar_ocorrencia(
  p_ocorrencia_id uuid,
  p_novo_status public.status_ocorrencia,
  p_justificativa text default null,
  p_data_retorno date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  o public.ocorrencias;
  permitido boolean;
begin
  ator := app_private.exigir_ator_ativo();

  select * into o from public.ocorrencias where id = p_ocorrencia_id for update;
  if not found or o.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;

  if not (
    ator.perfil = 'direcao_admin'
    or o.criada_por = ator.id
    or o.responsavel_id = ator.id
    or app_private.usuario_tem_acesso_posto(o.posto_id)
  ) then
    raise exception 'acesso_negado';
  end if;

  permitido := case o.status
    when 'aberta' then p_novo_status in ('em_acompanhamento', 'aguardando_retorno', 'resolvida', 'encerrada')
    when 'em_acompanhamento' then p_novo_status in ('aguardando_retorno', 'resolvida', 'encerrada')
    when 'aguardando_retorno' then p_novo_status in ('em_acompanhamento', 'resolvida', 'encerrada')
    when 'reaberta' then p_novo_status in ('em_acompanhamento', 'aguardando_retorno', 'resolvida', 'encerrada')
    when 'resolvida' then p_novo_status in ('encerrada', 'reaberta')
    when 'encerrada' then p_novo_status in ('reaberta')
  end;

  if not coalesce(permitido, false) then
    raise exception 'transicao_invalida';
  end if;

  if p_novo_status = 'reaberta'
    and nullif(btrim(coalesce(p_justificativa, '')), '') is null then
    raise exception 'justificativa_obrigatoria';
  end if;

  perform set_config('doka.ocorrencia_transicao', 'on', true);

  update public.ocorrencias
  set status = p_novo_status,
      data_retorno = coalesce(p_data_retorno, data_retorno),
      resolvida_em = case when p_novo_status = 'resolvida' then now() else resolvida_em end,
      encerrada_em = case when p_novo_status = 'encerrada' then now() else encerrada_em end,
      reaberta_em = case when p_novo_status = 'reaberta' then now() else reaberta_em end,
      justificativa_reabertura = case
        when p_novo_status = 'reaberta' then btrim(p_justificativa)
        else justificativa_reabertura
      end,
      updated_by = ator.id
  where id = o.id
  returning * into o;

  perform set_config('doka.ocorrencia_transicao', '', true);

  return to_jsonb(o);
end;
$$;

create or replace function public.remover_ocorrencia(
  p_ocorrencia_id uuid,
  p_justificativa text
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  o public.ocorrencias;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  select * into o from public.ocorrencias where id = p_ocorrencia_id for update;
  if not found or o.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if ator.perfil = 'supervisao' and not app_private.usuario_tem_acesso_posto(o.posto_id) then
    raise exception 'acesso_negado';
  end if;
  if nullif(btrim(coalesce(p_justificativa, '')), '') is null then
    raise exception 'justificativa_obrigatoria';
  end if;

  perform set_config('doka.ocorrencia_transicao', 'on', true);

  update public.ocorrencias
  set deleted_at = now(), deleted_by = ator.id, delete_reason = btrim(p_justificativa),
      updated_by = ator.id
  where id = o.id;

  perform set_config('doka.ocorrencia_transicao', '', true);
end;
$$;

revoke all on function public.transicionar_ocorrencia(uuid, public.status_ocorrencia, text, date) from public, anon;
revoke all on function public.remover_ocorrencia(uuid, text) from public, anon;
grant execute on function public.transicionar_ocorrencia(uuid, public.status_ocorrencia, text, date) to authenticated;
grant execute on function public.remover_ocorrencia(uuid, text) to authenticated;

revoke all on function app_private.usuario_pode_ver_ocorrencia(uuid) from public;
revoke all on function app_private.validar_ocorrencia() from public;
grant execute on function app_private.usuario_pode_ver_ocorrencia(uuid) to authenticated;
