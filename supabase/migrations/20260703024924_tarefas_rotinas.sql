-- Central de Tarefas e Rotinas (MVP enxuto).
-- Tabelas: tarefas, tarefa_responsaveis, rotinas, rotina_responsaveis,
-- rotina_execucoes. Escrita via RPCs pequenas; leitura direta sob RLS.
-- Recorrencia gerada por funcao idempotente (pg_cron + RPC de catch-up).

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_tarefa') then
    create type public.status_tarefa as enum
      ('pendente', 'em_andamento', 'concluida', 'validada', 'reaberta');
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_tarefa') then
    create type public.tipo_tarefa as enum ('avulsa', 'rotina', 'estrategia');
  end if;

  if not exists (select 1 from pg_type where typname = 'recorrencia_rotina') then
    create type public.recorrencia_rotina as enum
      ('diaria', 'semanal', 'quinzenal', 'mensal');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_rotina') then
    create type public.status_rotina as enum ('ativa', 'pausada', 'inativa');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_execucao_rotina') then
    create type public.status_execucao_rotina as enum ('gerada', 'acumulada');
  end if;
end
$$;

create or replace function app_private.data_operacional_hoje()
returns date
language sql
stable
set search_path = pg_temp
as $$
  select (now() at time zone 'America/Bahia')::date
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.rotinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  posto_id uuid references public.postos(id) on delete restrict,
  cargo_funcao_id uuid references public.cargos_funcoes(id) on delete set null,
  prioridade_id uuid references public.prioridades(id) on delete set null,
  recorrencia public.recorrencia_rotina not null,
  dias_semana integer[],
  dia_mes integer,
  horario_limite time,
  exige_validacao boolean not null default false,
  status public.status_rotina not null default 'ativa',
  data_inicio date not null,
  data_fim date,
  criada_por uuid not null references public.usuarios(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.usuarios(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  delete_reason text,
  constraint rotinas_nome_not_blank check (btrim(nome) <> ''),
  constraint rotinas_vigencia_ordem check (data_fim is null or data_fim >= data_inicio),
  constraint rotinas_dias_semana_validos check (
    dias_semana is null
    or (array_length(dias_semana, 1) > 0 and dias_semana <@ array[1, 2, 3, 4, 5, 6, 7])
  ),
  constraint rotinas_semanal_exige_dias check (
    recorrencia <> 'semanal' or (dias_semana is not null and array_length(dias_semana, 1) > 0)
  ),
  constraint rotinas_dia_mes_valido check (dia_mes is null or (dia_mes between 1 and 31)),
  constraint rotinas_mensal_exige_dia check (recorrencia <> 'mensal' or dia_mes is not null),
  constraint rotinas_delete_reason_required check (
    app_private.campo_soft_delete_valido(deleted_at, deleted_by, delete_reason)
  )
);

create index rotinas_posto_id_idx on public.rotinas (posto_id);
create index rotinas_cargo_funcao_id_idx on public.rotinas (cargo_funcao_id);
create index rotinas_prioridade_id_idx on public.rotinas (prioridade_id);
create index rotinas_criada_por_idx on public.rotinas (criada_por);
create index rotinas_updated_by_idx on public.rotinas (updated_by);
create index rotinas_deleted_by_idx on public.rotinas (deleted_by);
create index rotinas_ativas_idx on public.rotinas (status, data_inicio) where deleted_at is null;

create table public.rotina_responsaveis (
  id uuid primary key default gen_random_uuid(),
  rotina_id uuid not null references public.rotinas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.usuarios(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create unique index rotina_responsaveis_ativos_uidx
  on public.rotina_responsaveis (rotina_id, usuario_id)
  where deleted_at is null;
create index rotina_responsaveis_usuario_idx on public.rotina_responsaveis (usuario_id);
create index rotina_responsaveis_created_by_idx on public.rotina_responsaveis (created_by);
create index rotina_responsaveis_deleted_by_idx on public.rotina_responsaveis (deleted_by);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo public.tipo_tarefa not null default 'avulsa',
  posto_id uuid references public.postos(id) on delete restrict,
  cargo_funcao_id uuid references public.cargos_funcoes(id) on delete set null,
  prioridade_id uuid references public.prioridades(id) on delete set null,
  status public.status_tarefa not null default 'pendente',
  prazo_data date,
  horario_limite time,
  exige_validacao boolean not null default false,
  observacoes text,
  rotina_id uuid references public.rotinas(id) on delete set null,
  criada_por uuid not null references public.usuarios(id) on delete restrict,
  iniciada_em timestamptz,
  concluida_em timestamptz,
  concluida_por uuid references public.usuarios(id) on delete set null,
  validada_em timestamptz,
  validada_por uuid references public.usuarios(id) on delete set null,
  reaberta_em timestamptz,
  reaberta_por uuid references public.usuarios(id) on delete set null,
  justificativa_reabertura text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.usuarios(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  delete_reason text,
  constraint tarefas_titulo_not_blank check (btrim(titulo) <> ''),
  constraint tarefas_tipo_rotina_coerente check (
    (tipo = 'rotina') = (rotina_id is not null)
  ),
  constraint tarefas_delete_reason_required check (
    app_private.campo_soft_delete_valido(deleted_at, deleted_by, delete_reason)
  )
);

create index tarefas_posto_id_idx on public.tarefas (posto_id);
create index tarefas_cargo_funcao_id_idx on public.tarefas (cargo_funcao_id);
create index tarefas_prioridade_id_idx on public.tarefas (prioridade_id);
create index tarefas_rotina_id_idx on public.tarefas (rotina_id);
create index tarefas_criada_por_idx on public.tarefas (criada_por);
create index tarefas_concluida_por_idx on public.tarefas (concluida_por);
create index tarefas_validada_por_idx on public.tarefas (validada_por);
create index tarefas_reaberta_por_idx on public.tarefas (reaberta_por);
create index tarefas_updated_by_idx on public.tarefas (updated_by);
create index tarefas_deleted_by_idx on public.tarefas (deleted_by);
create index tarefas_status_prazo_idx
  on public.tarefas (status, prazo_data)
  where deleted_at is null;

-- Regra de acumulo: no maximo uma tarefa aberta por rotina.
create unique index tarefas_rotina_aberta_uidx
  on public.tarefas (rotina_id)
  where rotina_id is not null
    and status in ('pendente', 'em_andamento', 'reaberta')
    and deleted_at is null;

create table public.tarefa_responsaveis (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.usuarios(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create unique index tarefa_responsaveis_ativos_uidx
  on public.tarefa_responsaveis (tarefa_id, usuario_id)
  where deleted_at is null;
create index tarefa_responsaveis_usuario_idx on public.tarefa_responsaveis (usuario_id);
create index tarefa_responsaveis_created_by_idx on public.tarefa_responsaveis (created_by);
create index tarefa_responsaveis_deleted_by_idx on public.tarefa_responsaveis (deleted_by);

create table public.rotina_execucoes (
  id uuid primary key default gen_random_uuid(),
  rotina_id uuid not null references public.rotinas(id) on delete cascade,
  tarefa_id uuid references public.tarefas(id) on delete set null,
  data_prevista date not null,
  status public.status_execucao_rotina not null,
  created_at timestamptz not null default now()
);

create unique index rotina_execucoes_rotina_data_uidx
  on public.rotina_execucoes (rotina_id, data_prevista);
create index rotina_execucoes_tarefa_id_idx on public.rotina_execucoes (tarefa_id);

-- ---------------------------------------------------------------------------
-- Helpers de visibilidade (security definer para evitar recursao de RLS)
-- ---------------------------------------------------------------------------

create or replace function app_private.usuario_pode_ver_tarefa(tarefa_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.tarefas t
    where t.id = tarefa_uuid
      and t.deleted_at is null
      and (
        app_private.usuario_e_direcao_admin()
        or t.criada_por = app_private.usuario_atual_id()
        or exists (
          select 1
          from public.tarefa_responsaveis tr
          where tr.tarefa_id = t.id
            and tr.deleted_at is null
            and tr.usuario_id = app_private.usuario_atual_id()
        )
        or (t.posto_id is not null and app_private.usuario_tem_acesso_posto(t.posto_id))
      )
  )
$$;

create or replace function app_private.usuario_pode_ver_rotina(rotina_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.rotinas r
    where r.id = rotina_uuid
      and r.deleted_at is null
      and (
        app_private.usuario_e_direcao_admin()
        or r.criada_por = app_private.usuario_atual_id()
        or exists (
          select 1
          from public.rotina_responsaveis rr
          where rr.rotina_id = r.id
            and rr.deleted_at is null
            and rr.usuario_id = app_private.usuario_atual_id()
        )
        or (r.posto_id is not null and app_private.usuario_tem_acesso_posto(r.posto_id))
      )
  )
$$;

-- Supervisao gerencia usuarios do seu escopo (vinculados a um posto que ela
-- supervisiona); direcao gerencia qualquer usuario ativo.
create or replace function app_private.usuario_no_escopo_do_ator(usuario_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.usuarios alvo
    where alvo.id = usuario_uuid
      and alvo.ativo = true
      and alvo.deleted_at is null
      and (
        app_private.usuario_e_direcao_admin()
        or alvo.id = app_private.usuario_atual_id()
        or exists (
          select 1
          from public.usuarios_postos up
          where up.usuario_id = alvo.id
            and up.deleted_at is null
            and app_private.usuario_tem_acesso_posto(up.posto_id)
        )
      )
  )
$$;

-- ---------------------------------------------------------------------------
-- Auditoria generica dos modulos operacionais
-- ---------------------------------------------------------------------------

create or replace function app_private.auditar_modulo_operacional()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  acao_auditoria text;
  antes jsonb;
  depois jsonb;
  meta jsonb := jsonb_build_object('origem', 'trigger', 'operacao', TG_OP);
  posto uuid;
begin
  if TG_OP = 'INSERT' then
    acao_auditoria := 'criado';
    depois := to_jsonb(new);
  elsif TG_OP = 'UPDATE' then
    antes := to_jsonb(old);
    depois := to_jsonb(new);
    if old.deleted_at is null and new.deleted_at is not null then
      acao_auditoria := 'excluido_logicamente';
    elsif (antes ->> 'status') is distinct from (depois ->> 'status') then
      acao_auditoria := 'status_alterado';
      meta := meta || jsonb_build_object(
        'status_anterior', antes ->> 'status',
        'status_novo', depois ->> 'status'
      );
    else
      acao_auditoria := 'atualizado';
    end if;
  else
    return null;
  end if;

  posto := nullif(coalesce(depois ->> 'posto_id', antes ->> 'posto_id'), '')::uuid;
  if posto is not null then
    meta := meta || jsonb_build_object('posto_id', posto);
  end if;

  perform app_private.registrar_auditoria(
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    acao_auditoria,
    antes,
    depois,
    meta
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists tarefas_set_updated_at on public.tarefas;
create trigger tarefas_set_updated_at
before update on public.tarefas
for each row execute function app_private.set_updated_at();

drop trigger if exists rotinas_set_updated_at on public.rotinas;
create trigger rotinas_set_updated_at
before update on public.rotinas
for each row execute function app_private.set_updated_at();

drop trigger if exists tarefas_audit on public.tarefas;
create trigger tarefas_audit
after insert or update on public.tarefas
for each row execute function app_private.auditar_modulo_operacional();

drop trigger if exists rotinas_audit on public.rotinas;
create trigger rotinas_audit
after insert or update on public.rotinas
for each row execute function app_private.auditar_modulo_operacional();

-- ---------------------------------------------------------------------------
-- RLS: leitura direta; escrita somente via RPC (security definer)
-- ---------------------------------------------------------------------------

alter table public.tarefas enable row level security;
alter table public.tarefa_responsaveis enable row level security;
alter table public.rotinas enable row level security;
alter table public.rotina_responsaveis enable row level security;
alter table public.rotina_execucoes enable row level security;

create policy tarefas_select_por_escopo
on public.tarefas
for select
to authenticated
using (app_private.usuario_pode_ver_tarefa(id));

create policy tarefa_responsaveis_select_por_escopo
on public.tarefa_responsaveis
for select
to authenticated
using (deleted_at is null and app_private.usuario_pode_ver_tarefa(tarefa_id));

create policy rotinas_select_por_escopo
on public.rotinas
for select
to authenticated
using (app_private.usuario_pode_ver_rotina(id));

create policy rotina_responsaveis_select_por_escopo
on public.rotina_responsaveis
for select
to authenticated
using (deleted_at is null and app_private.usuario_pode_ver_rotina(rotina_id));

create policy rotina_execucoes_select_por_escopo
on public.rotina_execucoes
for select
to authenticated
using (app_private.usuario_pode_ver_rotina(rotina_id));

revoke all on public.tarefas, public.tarefa_responsaveis, public.rotinas,
  public.rotina_responsaveis, public.rotina_execucoes from anon;
revoke all on public.tarefas, public.tarefa_responsaveis, public.rotinas,
  public.rotina_responsaveis, public.rotina_execucoes from authenticated;
grant select on public.tarefas, public.tarefa_responsaveis, public.rotinas,
  public.rotina_responsaveis, public.rotina_execucoes to authenticated;

-- ---------------------------------------------------------------------------
-- Validacoes compartilhadas das RPCs
-- ---------------------------------------------------------------------------

create or replace function app_private.exigir_ator_ativo()
returns public.usuarios
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
begin
  select u.* into ator
  from public.usuarios u
  where u.auth_user_id = auth.uid()
    and u.ativo = true
    and u.deleted_at is null;

  if not found then
    raise exception 'acesso_negado';
  end if;

  return ator;
end;
$$;

-- Valida a lista de responsaveis conforme perfil do ator.
create or replace function app_private.validar_responsaveis_tarefa(
  ator public.usuarios,
  responsaveis uuid[]
)
returns void
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  resp uuid;
begin
  if responsaveis is null or array_length(responsaveis, 1) is null then
    raise exception 'responsavel_obrigatorio';
  end if;

  if ator.perfil = 'operador' then
    if array_length(responsaveis, 1) <> 1 or responsaveis[1] <> ator.id then
      raise exception 'operador_somente_para_si';
    end if;
    return;
  end if;

  foreach resp in array responsaveis loop
    if resp = ator.id then
      continue;
    end if;
    if ator.perfil = 'direcao_admin' then
      if not exists (
        select 1 from public.usuarios u
        where u.id = resp and u.ativo = true and u.deleted_at is null
      ) then
        raise exception 'responsavel_invalido';
      end if;
    else
      if not app_private.usuario_no_escopo_do_ator(resp) then
        raise exception 'responsavel_fora_do_escopo';
      end if;
    end if;
  end loop;
end;
$$;

create or replace function app_private.validar_posto_para_ator(
  ator public.usuarios,
  posto uuid
)
returns void
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if posto is null then
    return;
  end if;
  if not exists (
    select 1 from public.postos p
    where p.id = posto and p.ativo = true and p.deleted_at is null
  ) then
    raise exception 'posto_invalido';
  end if;
  if ator.perfil <> 'direcao_admin' and not app_private.usuario_tem_acesso_posto(posto) then
    raise exception 'acesso_negado';
  end if;
end;
$$;

-- Ator pode gerenciar (editar/transicionar) a tarefa?
create or replace function app_private.ator_gerencia_tarefa(
  ator public.usuarios,
  t public.tarefas
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select ator.perfil = 'direcao_admin'
    or t.criada_por = ator.id
    or (
      ator.perfil = 'supervisao'
      and t.posto_id is not null
      and app_private.usuario_tem_acesso_posto(t.posto_id)
    )
$$;

-- ---------------------------------------------------------------------------
-- RPCs de tarefas
-- ---------------------------------------------------------------------------

create or replace function public.criar_tarefa(
  p_titulo text,
  p_descricao text default null,
  p_tipo public.tipo_tarefa default 'avulsa',
  p_posto_id uuid default null,
  p_cargo_funcao_id uuid default null,
  p_prioridade_id uuid default null,
  p_prazo_data date default null,
  p_horario_limite time default null,
  p_exige_validacao boolean default false,
  p_observacoes text default null,
  p_responsaveis uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  responsaveis uuid[];
  nova public.tarefas;
  resp uuid;
begin
  ator := app_private.exigir_ator_ativo();

  if p_tipo = 'rotina' then
    raise exception 'tipo_invalido';
  end if;

  responsaveis := coalesce(p_responsaveis, array[ator.id]);
  responsaveis := (select array_agg(distinct r) from unnest(responsaveis) r);
  perform app_private.validar_responsaveis_tarefa(ator, responsaveis);
  perform app_private.validar_posto_para_ator(ator, p_posto_id);

  if p_titulo is null or btrim(p_titulo) = '' then
    raise exception 'titulo_obrigatorio';
  end if;

  insert into public.tarefas (
    titulo, descricao, tipo, posto_id, cargo_funcao_id, prioridade_id,
    prazo_data, horario_limite, exige_validacao, observacoes, criada_por
  )
  values (
    btrim(p_titulo), nullif(btrim(coalesce(p_descricao, '')), ''), p_tipo,
    p_posto_id, p_cargo_funcao_id, p_prioridade_id,
    p_prazo_data, p_horario_limite, coalesce(p_exige_validacao, false),
    nullif(btrim(coalesce(p_observacoes, '')), ''), ator.id
  )
  returning * into nova;

  foreach resp in array responsaveis loop
    insert into public.tarefa_responsaveis (tarefa_id, usuario_id, created_by)
    values (nova.id, resp, ator.id);
  end loop;

  return to_jsonb(nova);
end;
$$;

create or replace function public.atualizar_tarefa(
  p_tarefa_id uuid,
  p_titulo text default null,
  p_descricao text default null,
  p_posto_id uuid default null,
  p_cargo_funcao_id uuid default null,
  p_prioridade_id uuid default null,
  p_prazo_data date default null,
  p_horario_limite time default null,
  p_exige_validacao boolean default null,
  p_observacoes text default null,
  p_responsaveis uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  t public.tarefas;
  responsaveis uuid[];
  resp uuid;
begin
  ator := app_private.exigir_ator_ativo();

  select * into t from public.tarefas where id = p_tarefa_id for update;
  if not found or t.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if not app_private.ator_gerencia_tarefa(ator, t) then
    raise exception 'acesso_negado';
  end if;
  if t.status = 'validada' then
    raise exception 'tarefa_validada_exige_reabertura';
  end if;

  perform app_private.validar_posto_para_ator(ator, p_posto_id);

  update public.tarefas
  set titulo = coalesce(nullif(btrim(coalesce(p_titulo, '')), ''), titulo),
      descricao = coalesce(p_descricao, descricao),
      posto_id = coalesce(p_posto_id, posto_id),
      cargo_funcao_id = coalesce(p_cargo_funcao_id, cargo_funcao_id),
      prioridade_id = coalesce(p_prioridade_id, prioridade_id),
      prazo_data = coalesce(p_prazo_data, prazo_data),
      horario_limite = coalesce(p_horario_limite, horario_limite),
      exige_validacao = coalesce(p_exige_validacao, exige_validacao),
      observacoes = coalesce(p_observacoes, observacoes),
      updated_by = ator.id
  where id = t.id
  returning * into t;

  if p_responsaveis is not null then
    if ator.perfil = 'operador' then
      raise exception 'operador_nao_altera_responsaveis';
    end if;
    responsaveis := (select array_agg(distinct r) from unnest(p_responsaveis) r);
    perform app_private.validar_responsaveis_tarefa(ator, responsaveis);

    update public.tarefa_responsaveis
    set deleted_at = now(), deleted_by = ator.id
    where tarefa_id = t.id
      and deleted_at is null
      and usuario_id <> all (responsaveis);

    foreach resp in array responsaveis loop
      if not exists (
        select 1 from public.tarefa_responsaveis tr
        where tr.tarefa_id = t.id and tr.usuario_id = resp and tr.deleted_at is null
      ) then
        insert into public.tarefa_responsaveis (tarefa_id, usuario_id, created_by)
        values (t.id, resp, ator.id);
      end if;
    end loop;

    perform app_private.registrar_auditoria(
      'tarefas', t.id, 'responsaveis_alterados', null,
      jsonb_build_object('responsaveis', responsaveis),
      jsonb_build_object('posto_id', t.posto_id)
    );
  end if;

  return to_jsonb(t);
end;
$$;

create or replace function public.transicionar_tarefa(
  p_tarefa_id uuid,
  p_acao text,
  p_justificativa text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  t public.tarefas;
  e_responsavel boolean;
  pode_gerenciar boolean;
  pode_validar boolean;
begin
  ator := app_private.exigir_ator_ativo();

  select * into t from public.tarefas where id = p_tarefa_id for update;
  if not found or t.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;

  e_responsavel := exists (
    select 1 from public.tarefa_responsaveis tr
    where tr.tarefa_id = t.id and tr.usuario_id = ator.id and tr.deleted_at is null
  );
  pode_gerenciar := app_private.ator_gerencia_tarefa(ator, t);
  pode_validar := ator.perfil = 'direcao_admin'
    or (
      ator.perfil = 'supervisao'
      and (
        (t.posto_id is not null and app_private.usuario_tem_acesso_posto(t.posto_id))
        or t.criada_por = ator.id
      )
    );

  if p_acao = 'iniciar' then
    if not (e_responsavel or pode_gerenciar) then
      raise exception 'acesso_negado';
    end if;
    if t.status not in ('pendente', 'reaberta') then
      raise exception 'transicao_invalida';
    end if;
    update public.tarefas
    set status = 'em_andamento', iniciada_em = coalesce(iniciada_em, now()), updated_by = ator.id
    where id = t.id
    returning * into t;

  elsif p_acao = 'concluir' then
    if not (e_responsavel or pode_gerenciar) then
      raise exception 'acesso_negado';
    end if;
    if t.status not in ('pendente', 'em_andamento', 'reaberta') then
      raise exception 'transicao_invalida';
    end if;
    update public.tarefas
    set status = 'concluida', concluida_em = now(), concluida_por = ator.id, updated_by = ator.id
    where id = t.id
    returning * into t;

  elsif p_acao = 'validar' then
    if not pode_validar then
      raise exception 'acesso_negado';
    end if;
    if t.status <> 'concluida' or not t.exige_validacao then
      raise exception 'transicao_invalida';
    end if;
    update public.tarefas
    set status = 'validada', validada_em = now(), validada_por = ator.id, updated_by = ator.id
    where id = t.id
    returning * into t;

  elsif p_acao = 'reabrir' then
    if not pode_validar then
      raise exception 'acesso_negado';
    end if;
    if t.status not in ('concluida', 'validada') then
      raise exception 'transicao_invalida';
    end if;
    if nullif(btrim(coalesce(p_justificativa, '')), '') is null then
      raise exception 'justificativa_obrigatoria';
    end if;
    update public.tarefas
    set status = 'reaberta', reaberta_em = now(), reaberta_por = ator.id,
        justificativa_reabertura = btrim(p_justificativa), updated_by = ator.id
    where id = t.id
    returning * into t;

  else
    raise exception 'acao_invalida';
  end if;

  return to_jsonb(t);
end;
$$;

create or replace function public.remover_tarefa(
  p_tarefa_id uuid,
  p_justificativa text
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  t public.tarefas;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  select * into t from public.tarefas where id = p_tarefa_id for update;
  if not found or t.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if not app_private.ator_gerencia_tarefa(ator, t) then
    raise exception 'acesso_negado';
  end if;
  if nullif(btrim(coalesce(p_justificativa, '')), '') is null then
    raise exception 'justificativa_obrigatoria';
  end if;

  update public.tarefas
  set deleted_at = now(), deleted_by = ator.id, delete_reason = btrim(p_justificativa),
      updated_by = ator.id
  where id = t.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs de rotinas
-- ---------------------------------------------------------------------------

create or replace function public.criar_rotina(
  p_nome text,
  p_recorrencia public.recorrencia_rotina,
  p_data_inicio date,
  p_descricao text default null,
  p_posto_id uuid default null,
  p_cargo_funcao_id uuid default null,
  p_prioridade_id uuid default null,
  p_dias_semana integer[] default null,
  p_dia_mes integer default null,
  p_horario_limite time default null,
  p_exige_validacao boolean default false,
  p_data_fim date default null,
  p_responsaveis uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  responsaveis uuid[];
  nova public.rotinas;
  resp uuid;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  responsaveis := coalesce(p_responsaveis, array[ator.id]);
  responsaveis := (select array_agg(distinct r) from unnest(responsaveis) r);
  perform app_private.validar_responsaveis_tarefa(ator, responsaveis);
  perform app_private.validar_posto_para_ator(ator, p_posto_id);

  if p_nome is null or btrim(p_nome) = '' then
    raise exception 'nome_obrigatorio';
  end if;
  if p_data_inicio is null then
    raise exception 'data_inicio_obrigatoria';
  end if;

  insert into public.rotinas (
    nome, descricao, posto_id, cargo_funcao_id, prioridade_id, recorrencia,
    dias_semana, dia_mes, horario_limite, exige_validacao, data_inicio,
    data_fim, criada_por
  )
  values (
    btrim(p_nome), nullif(btrim(coalesce(p_descricao, '')), ''), p_posto_id,
    p_cargo_funcao_id, p_prioridade_id, p_recorrencia,
    p_dias_semana, p_dia_mes, p_horario_limite,
    coalesce(p_exige_validacao, false), p_data_inicio, p_data_fim, ator.id
  )
  returning * into nova;

  foreach resp in array responsaveis loop
    insert into public.rotina_responsaveis (rotina_id, usuario_id, created_by)
    values (nova.id, resp, ator.id);
  end loop;

  return to_jsonb(nova);
end;
$$;

create or replace function public.atualizar_rotina(
  p_rotina_id uuid,
  p_nome text default null,
  p_descricao text default null,
  p_posto_id uuid default null,
  p_cargo_funcao_id uuid default null,
  p_prioridade_id uuid default null,
  p_recorrencia public.recorrencia_rotina default null,
  p_dias_semana integer[] default null,
  p_dia_mes integer default null,
  p_horario_limite time default null,
  p_exige_validacao boolean default null,
  p_status public.status_rotina default null,
  p_data_inicio date default null,
  p_data_fim date default null,
  p_responsaveis uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  r public.rotinas;
  responsaveis uuid[];
  resp uuid;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  select * into r from public.rotinas where id = p_rotina_id for update;
  if not found or r.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if ator.perfil = 'supervisao'
    and r.criada_por <> ator.id
    and (r.posto_id is null or not app_private.usuario_tem_acesso_posto(r.posto_id)) then
    raise exception 'acesso_negado';
  end if;

  perform app_private.validar_posto_para_ator(ator, p_posto_id);

  update public.rotinas
  set nome = coalesce(nullif(btrim(coalesce(p_nome, '')), ''), nome),
      descricao = coalesce(p_descricao, descricao),
      posto_id = coalesce(p_posto_id, posto_id),
      cargo_funcao_id = coalesce(p_cargo_funcao_id, cargo_funcao_id),
      prioridade_id = coalesce(p_prioridade_id, prioridade_id),
      recorrencia = coalesce(p_recorrencia, recorrencia),
      dias_semana = coalesce(p_dias_semana, dias_semana),
      dia_mes = coalesce(p_dia_mes, dia_mes),
      horario_limite = coalesce(p_horario_limite, horario_limite),
      exige_validacao = coalesce(p_exige_validacao, exige_validacao),
      status = coalesce(p_status, status),
      data_inicio = coalesce(p_data_inicio, data_inicio),
      data_fim = coalesce(p_data_fim, data_fim),
      updated_by = ator.id
  where id = r.id
  returning * into r;

  if p_responsaveis is not null then
    responsaveis := (select array_agg(distinct x) from unnest(p_responsaveis) x);
    perform app_private.validar_responsaveis_tarefa(ator, responsaveis);

    update public.rotina_responsaveis
    set deleted_at = now(), deleted_by = ator.id
    where rotina_id = r.id
      and deleted_at is null
      and usuario_id <> all (responsaveis);

    foreach resp in array responsaveis loop
      if not exists (
        select 1 from public.rotina_responsaveis rr
        where rr.rotina_id = r.id and rr.usuario_id = resp and rr.deleted_at is null
      ) then
        insert into public.rotina_responsaveis (rotina_id, usuario_id, created_by)
        values (r.id, resp, ator.id);
      end if;
    end loop;
  end if;

  return to_jsonb(r);
end;
$$;

create or replace function public.remover_rotina(
  p_rotina_id uuid,
  p_justificativa text
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  r public.rotinas;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil = 'operador' then
    raise exception 'acesso_negado';
  end if;

  select * into r from public.rotinas where id = p_rotina_id for update;
  if not found or r.deleted_at is not null then
    raise exception 'acesso_negado';
  end if;
  if ator.perfil = 'supervisao'
    and r.criada_por <> ator.id
    and (r.posto_id is null or not app_private.usuario_tem_acesso_posto(r.posto_id)) then
    raise exception 'acesso_negado';
  end if;
  if nullif(btrim(coalesce(p_justificativa, '')), '') is null then
    raise exception 'justificativa_obrigatoria';
  end if;

  update public.rotinas
  set deleted_at = now(), deleted_by = ator.id, delete_reason = btrim(p_justificativa),
      updated_by = ator.id
  where id = r.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Geracao idempotente de tarefas de rotina
-- ---------------------------------------------------------------------------

create or replace function app_private.rotina_vence_em(r public.rotinas, dia date)
returns boolean
language sql
immutable
set search_path = pg_temp
as $$
  select case r.recorrencia
    when 'diaria' then true
    when 'semanal' then extract(isodow from dia)::integer = any (r.dias_semana)
    when 'quinzenal' then ((dia - r.data_inicio) % 14) = 0
    when 'mensal' then
      extract(day from dia)::integer = r.dia_mes
      or (
        dia = (date_trunc('month', dia) + interval '1 month - 1 day')::date
        and r.dia_mes > extract(day from (date_trunc('month', dia) + interval '1 month - 1 day'))::integer
      )
  end
$$;

create or replace function app_private.gerar_execucoes_rotinas()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  hoje date := app_private.data_operacional_hoje();
  r public.rotinas;
  dia date;
  tarefa_aberta uuid;
  nova_tarefa uuid;
  geradas integer := 0;
begin
  -- Serializa geracoes concorrentes (cron + RPC da Central).
  perform pg_advisory_xact_lock(hashtext('doka_gerar_rotinas'));

  for r in
    select *
    from public.rotinas
    where deleted_at is null
      and status = 'ativa'
      and data_inicio <= hoje
  loop
    for dia in
      select d::date
      from generate_series(
        greatest(r.data_inicio, hoje - 30),
        least(hoje, coalesce(r.data_fim, hoje)),
        interval '1 day'
      ) d
    loop
      if not app_private.rotina_vence_em(r, dia) then
        continue;
      end if;
      if exists (
        select 1 from public.rotina_execucoes e
        where e.rotina_id = r.id and e.data_prevista = dia
      ) then
        continue;
      end if;

      select t.id into tarefa_aberta
      from public.tarefas t
      where t.rotina_id = r.id
        and t.deleted_at is null
        and t.status in ('pendente', 'em_andamento', 'reaberta')
      limit 1;

      if tarefa_aberta is not null then
        insert into public.rotina_execucoes (rotina_id, tarefa_id, data_prevista, status)
        values (r.id, tarefa_aberta, dia, 'acumulada')
        on conflict (rotina_id, data_prevista) do nothing;
      else
        insert into public.tarefas (
          titulo, descricao, tipo, posto_id, cargo_funcao_id, prioridade_id,
          prazo_data, horario_limite, exige_validacao, rotina_id, criada_por
        )
        values (
          r.nome, r.descricao, 'rotina', r.posto_id, r.cargo_funcao_id,
          r.prioridade_id, dia, r.horario_limite, r.exige_validacao, r.id,
          r.criada_por
        )
        returning id into nova_tarefa;

        insert into public.tarefa_responsaveis (tarefa_id, usuario_id, created_by)
        select nova_tarefa, rr.usuario_id, r.criada_por
        from public.rotina_responsaveis rr
        where rr.rotina_id = r.id and rr.deleted_at is null;

        insert into public.rotina_execucoes (rotina_id, tarefa_id, data_prevista, status)
        values (r.id, nova_tarefa, dia, 'gerada')
        on conflict (rotina_id, data_prevista) do nothing;

        geradas := geradas + 1;
      end if;
    end loop;
  end loop;

  return geradas;
end;
$$;

-- RPC de catch-up chamada pela Central (idempotente, barata em baixa escala).
create or replace function public.gerar_tarefas_rotinas()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform app_private.exigir_ator_ativo();
  return app_private.gerar_execucoes_rotinas();
end;
$$;

-- Agendamento: geracao periodica independente da interface.
do $$
begin
  perform cron.schedule(
    'doka-gerar-tarefas-rotinas',
    '*/30 * * * *',
    $job$select app_private.gerar_execucoes_rotinas()$job$
  );
end
$$;

-- ---------------------------------------------------------------------------
-- Grants das RPCs
-- ---------------------------------------------------------------------------

revoke all on function public.criar_tarefa(text, text, public.tipo_tarefa, uuid, uuid, uuid, date, time, boolean, text, uuid[]) from public, anon;
revoke all on function public.atualizar_tarefa(uuid, text, text, uuid, uuid, uuid, date, time, boolean, text, uuid[]) from public, anon;
revoke all on function public.transicionar_tarefa(uuid, text, text) from public, anon;
revoke all on function public.remover_tarefa(uuid, text) from public, anon;
revoke all on function public.criar_rotina(text, public.recorrencia_rotina, date, text, uuid, uuid, uuid, integer[], integer, time, boolean, date, uuid[]) from public, anon;
revoke all on function public.atualizar_rotina(uuid, text, text, uuid, uuid, uuid, public.recorrencia_rotina, integer[], integer, time, boolean, public.status_rotina, date, date, uuid[]) from public, anon;
revoke all on function public.remover_rotina(uuid, text) from public, anon;
revoke all on function public.gerar_tarefas_rotinas() from public, anon;

grant execute on function public.criar_tarefa(text, text, public.tipo_tarefa, uuid, uuid, uuid, date, time, boolean, text, uuid[]) to authenticated;
grant execute on function public.atualizar_tarefa(uuid, text, text, uuid, uuid, uuid, date, time, boolean, text, uuid[]) to authenticated;
grant execute on function public.transicionar_tarefa(uuid, text, text) to authenticated;
grant execute on function public.remover_tarefa(uuid, text) to authenticated;
grant execute on function public.criar_rotina(text, public.recorrencia_rotina, date, text, uuid, uuid, uuid, integer[], integer, time, boolean, date, uuid[]) to authenticated;
grant execute on function public.atualizar_rotina(uuid, text, text, uuid, uuid, uuid, public.recorrencia_rotina, integer[], integer, time, boolean, public.status_rotina, date, date, uuid[]) to authenticated;
grant execute on function public.remover_rotina(uuid, text) to authenticated;
grant execute on function public.gerar_tarefas_rotinas() to authenticated;

revoke all on function app_private.usuario_pode_ver_tarefa(uuid) from public;
revoke all on function app_private.usuario_pode_ver_rotina(uuid) from public;
revoke all on function app_private.usuario_no_escopo_do_ator(uuid) from public;
revoke all on function app_private.exigir_ator_ativo() from public;
revoke all on function app_private.validar_responsaveis_tarefa(public.usuarios, uuid[]) from public;
revoke all on function app_private.validar_posto_para_ator(public.usuarios, uuid) from public;
revoke all on function app_private.ator_gerencia_tarefa(public.usuarios, public.tarefas) from public;
revoke all on function app_private.auditar_modulo_operacional() from public;
revoke all on function app_private.gerar_execucoes_rotinas() from public;
revoke all on function app_private.rotina_vence_em(public.rotinas, date) from public;
revoke all on function app_private.data_operacional_hoje() from public;

grant execute on function app_private.usuario_pode_ver_tarefa(uuid) to authenticated;
grant execute on function app_private.usuario_pode_ver_rotina(uuid) to authenticated;
