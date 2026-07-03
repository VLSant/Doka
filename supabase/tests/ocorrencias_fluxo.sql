-- Validacoes de RLS, transicoes e regras criticas de Ocorrencias.
-- Autossuficiente: usa uma assistencia real do banco de desenvolvimento como
-- vinculo e desfaz tudo no rollback.

begin;

create or replace function pg_temp.assert_true(cond boolean, msg text)
returns void
language plpgsql
as $$
begin
  if not coalesce(cond, false) then
    raise exception 'ASSERTION FAILED: %', msg;
  end if;
end;
$$;

-- Assistencia real (com posto ativo) usada como vinculo da ocorrencia.
create or replace function pg_temp.fx_assistencia_id()
returns uuid
language sql
security definer
as $$
  select a.id
  from public.mms_assistencias a
  join public.postos p on p.id = a.posto_id
  where a.deleted_at is null
    and p.ativo = true
    and p.deleted_at is null
  order by a.id
  limit 1
$$;

create or replace function pg_temp.fx_posto_id()
returns uuid
language sql
security definer
as $$
  select a.posto_id
  from public.mms_assistencias a
  where a.id = pg_temp.fx_assistencia_id()
$$;

create or replace function pg_temp.fx_tipo_id()
returns uuid
language sql
security definer
as $$
  select id from public.tipos_ocorrencia
  where ativo = true and deleted_at is null
  order by id
  limit 1
$$;

create or replace function pg_temp.fx_ocorrencia_id()
returns uuid
language sql
security definer
as $$
  select id from public.ocorrencias where titulo = 'FX ocorrencia baixa combinada' limit 1
$$;

-- ---------------------------------------------------------------------------
-- Fixtures (como postgres)
-- ---------------------------------------------------------------------------

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'fx-occ-operador-a@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'fx-occ-supervisao-a@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'fx-occ-operador-b@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.postos (id, nome, codigo)
values ('ff400000-0000-0000-0000-000000000012', 'FX Occ Posto B', 'FXOB');

insert into public.usuarios (id, auth_user_id, nome, email, perfil)
values
  ('ff200000-0000-0000-0000-000000000011', 'ff100000-0000-0000-0000-000000000011', 'FX Occ Operador A', 'fx-occ-operador-a@doka.test', 'operador'),
  ('ff200000-0000-0000-0000-000000000012', 'ff100000-0000-0000-0000-000000000012', 'FX Occ Supervisao A', 'fx-occ-supervisao-a@doka.test', 'supervisao'),
  ('ff200000-0000-0000-0000-000000000014', 'ff100000-0000-0000-0000-000000000014', 'FX Occ Operador B', 'fx-occ-operador-b@doka.test', 'operador');

insert into public.usuarios_postos (usuario_id, posto_id, nivel_acesso)
values
  ('ff200000-0000-0000-0000-000000000011', pg_temp.fx_posto_id(), 'operacional'),
  ('ff200000-0000-0000-0000-000000000012', pg_temp.fx_posto_id(), 'supervisao'),
  ('ff200000-0000-0000-0000-000000000014', 'ff400000-0000-0000-0000-000000000012', 'operacional');

set role authenticated;

-- ---------------------------------------------------------------------------
-- Criacao com posto derivado da assistencia
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000011', true);

insert into public.ocorrencias (assistencia_id, posto_id, tipo_ocorrencia_id, criada_por, titulo, descricao, data_retorno)
values (
  pg_temp.fx_assistencia_id(),
  pg_temp.fx_posto_id(),
  pg_temp.fx_tipo_id(),
  'ff200000-0000-0000-0000-000000000011',
  'FX ocorrencia baixa combinada',
  'Cliente combinou retorno para amanha.',
  (now() at time zone 'America/Bahia')::date + 1
);

select pg_temp.assert_true(
  (select count(*) = 1 from public.ocorrencias o
   where o.id = pg_temp.fx_ocorrencia_id()
     and o.status = 'aberta'
     and o.posto_id = pg_temp.fx_posto_id()),
  'operador deve criar ocorrencia aberta com posto derivado da assistencia');

-- Responsavel fora do posto da assistencia deve ser recusado
do $$
begin
  update public.ocorrencias
  set responsavel_id = 'ff200000-0000-0000-0000-000000000014'
  where id = pg_temp.fx_ocorrencia_id();
  raise exception 'ASSERTION FAILED: responsavel fora do posto deveria ser recusado';
exception
  when others then
    if sqlerrm not like '%responsavel_fora_do_posto%' then
      raise;
    end if;
end
$$;

-- Mudanca direta de status deve ser bloqueada (transicao somente por RPC)
do $$
begin
  update public.ocorrencias
  set status = 'resolvida'
  where id = pg_temp.fx_ocorrencia_id();
  raise exception 'ASSERTION FAILED: status nao deveria mudar por update direto';
exception
  when others then
    if sqlerrm not like '%transicao_somente_por_rpc%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Separacao por posto
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000014', true);

select pg_temp.assert_true(
  (select count(*) = 0 from public.ocorrencias o
   where o.id = pg_temp.fx_ocorrencia_id()),
  'operador de outro posto nao deve ver a ocorrencia');

do $$
begin
  insert into public.ocorrencia_comentarios (ocorrencia_id, usuario_id, comentario)
  values (pg_temp.fx_ocorrencia_id(), 'ff200000-0000-0000-0000-000000000014', 'FX invasao');
  raise exception 'ASSERTION FAILED: operador de outro posto nao deveria comentar';
exception
  when insufficient_privilege or with_check_option_violation then
    null;
  when others then
    if sqlerrm not like '%row-level security%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Comentario, transicoes e reabertura com justificativa
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000011', true);

insert into public.ocorrencia_comentarios (ocorrencia_id, usuario_id, comentario)
values (pg_temp.fx_ocorrencia_id(), 'ff200000-0000-0000-0000-000000000011', 'FX acompanhamento do retorno');

select pg_temp.assert_true(
  (select count(*) = 1 from public.ocorrencia_comentarios c
   where c.ocorrencia_id = pg_temp.fx_ocorrencia_id()),
  'operador do posto deve registrar comentario');

select pg_temp.assert_true(
  (public.transicionar_ocorrencia(pg_temp.fx_ocorrencia_id(), 'resolvida') ->> 'status') = 'resolvida',
  'operador do posto deve resolver a ocorrencia');

do $$
begin
  perform public.transicionar_ocorrencia(pg_temp.fx_ocorrencia_id(), 'reaberta');
  raise exception 'ASSERTION FAILED: reabertura sem justificativa deveria falhar';
exception
  when others then
    if sqlerrm not like '%justificativa_obrigatoria%' then
      raise;
    end if;
end
$$;

select pg_temp.assert_true(
  (public.transicionar_ocorrencia(pg_temp.fx_ocorrencia_id(), 'reaberta', 'FX cliente remarcou') ->> 'status') = 'reaberta',
  'reabertura com justificativa deve funcionar');

do $$
begin
  perform public.transicionar_ocorrencia(pg_temp.fx_ocorrencia_id(), 'aberta');
  raise exception 'ASSERTION FAILED: transicao invalida deveria falhar';
exception
  when others then
    if sqlerrm not like '%transicao_invalida%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Soft delete apenas por supervisao/direcao, com justificativa
-- ---------------------------------------------------------------------------

do $$
begin
  perform public.remover_ocorrencia(pg_temp.fx_ocorrencia_id(), 'FX limpar');
  raise exception 'ASSERTION FAILED: operador nao deveria remover ocorrencia';
exception
  when others then
    if sqlerrm not like '%acesso_negado%' then
      raise;
    end if;
end
$$;

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000012', true);

select public.remover_ocorrencia(pg_temp.fx_ocorrencia_id(), 'FX registro duplicado');

select pg_temp.assert_true(
  (select count(*) = 0 from public.ocorrencias o
   where o.id = pg_temp.fx_ocorrencia_id()),
  'ocorrencia removida deve sumir das visoes operacionais');

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

select pg_temp.assert_true(
  (select count(*) >= 1 from public.historico_auditoria h
   where h.entidade_tipo = 'ocorrencias'
     and h.entidade_id = pg_temp.fx_ocorrencia_id()
     and h.acao = 'criado'),
  'criacao de ocorrencia deve gerar historico');

select pg_temp.assert_true(
  (select count(*) >= 2 from public.historico_auditoria h
   where h.entidade_tipo = 'ocorrencias'
     and h.entidade_id = pg_temp.fx_ocorrencia_id()
     and h.acao = 'status_alterado'),
  'transicoes de ocorrencia devem gerar historico de status');

select pg_temp.assert_true(
  (select count(*) = 1 from public.historico_auditoria h
   where h.entidade_tipo = 'ocorrencias'
     and h.entidade_id = pg_temp.fx_ocorrencia_id()
     and h.acao = 'excluido_logicamente'),
  'soft delete de ocorrencia deve gerar historico');

rollback;
