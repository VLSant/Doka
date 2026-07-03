-- Validacoes de RLS, validacao e regras criticas de Deslocamentos e Custos.
-- Autossuficiente: usa uma assistencia real do banco de desenvolvimento e
-- desfaz tudo no rollback.

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
  select a.posto_id from public.mms_assistencias a
  where a.id = pg_temp.fx_assistencia_id()
$$;

create or replace function pg_temp.fx_deslocamento_id()
returns uuid
language sql
security definer
as $$
  select id from public.lancamentos_operacionais
  where descricao = 'FX deslocamento extra' limit 1
$$;

create or replace function pg_temp.fx_custo_id()
returns uuid
language sql
security definer
as $$
  select id from public.lancamentos_operacionais
  where descricao = 'FX custo extra' limit 1
$$;

-- ---------------------------------------------------------------------------
-- Fixtures (como postgres)
-- ---------------------------------------------------------------------------

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000021', 'authenticated', 'authenticated', 'fx-lan-operador-a@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000022', 'authenticated', 'authenticated', 'fx-lan-supervisao-a@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000024', 'authenticated', 'authenticated', 'fx-lan-operador-b@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.postos (id, nome, codigo)
values ('ff400000-0000-0000-0000-000000000022', 'FX Lan Posto B', 'FXLB');

insert into public.usuarios (id, auth_user_id, nome, email, perfil)
values
  ('ff200000-0000-0000-0000-000000000021', 'ff100000-0000-0000-0000-000000000021', 'FX Lan Operador A', 'fx-lan-operador-a@doka.test', 'operador'),
  ('ff200000-0000-0000-0000-000000000022', 'ff100000-0000-0000-0000-000000000022', 'FX Lan Supervisao A', 'fx-lan-supervisao-a@doka.test', 'supervisao'),
  ('ff200000-0000-0000-0000-000000000024', 'ff100000-0000-0000-0000-000000000024', 'FX Lan Operador B', 'fx-lan-operador-b@doka.test', 'operador');

insert into public.usuarios_postos (usuario_id, posto_id, nivel_acesso)
values
  ('ff200000-0000-0000-0000-000000000021', pg_temp.fx_posto_id(), 'operacional'),
  ('ff200000-0000-0000-0000-000000000022', pg_temp.fx_posto_id(), 'supervisao'),
  ('ff200000-0000-0000-0000-000000000024', 'ff400000-0000-0000-0000-000000000022', 'operacional');

set role authenticated;

-- ---------------------------------------------------------------------------
-- Lancamento manual: deslocamento sem assistencia, custo exige assistencia
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000021', true);

insert into public.lancamentos_operacionais (tipo, posto_id, recurso, data_lancamento, descricao, valor, lancado_por)
values ('deslocamento', pg_temp.fx_posto_id(), 'Montador FX', (now() at time zone 'America/Bahia')::date, 'FX deslocamento extra', 35.50, 'ff200000-0000-0000-0000-000000000021');

select pg_temp.assert_true(
  (select count(*) = 1 from public.lancamentos_operacionais l
   where l.id = pg_temp.fx_deslocamento_id() and l.status = 'pendente'),
  'operador deve lancar deslocamento pendente no seu posto');

do $$
begin
  insert into public.lancamentos_operacionais (tipo, posto_id, data_lancamento, descricao, valor, lancado_por)
  values ('custo_extra', pg_temp.fx_posto_id(), (now() at time zone 'America/Bahia')::date, 'FX custo sem assistencia', 10, 'ff200000-0000-0000-0000-000000000021');
  raise exception 'ASSERTION FAILED: custo extra sem assistencia deveria ser recusado';
exception
  when check_violation then
    null;
end
$$;

insert into public.lancamentos_operacionais (tipo, assistencia_id, posto_id, data_lancamento, descricao, valor, lancado_por)
values ('custo_extra', pg_temp.fx_assistencia_id(), pg_temp.fx_posto_id(), (now() at time zone 'America/Bahia')::date, 'FX custo extra', 120.00, 'ff200000-0000-0000-0000-000000000021');

select pg_temp.assert_true(
  (select count(*) = 1 from public.lancamentos_operacionais l
   where l.id = pg_temp.fx_custo_id()
     and l.posto_id = pg_temp.fx_posto_id()),
  'custo extra com assistencia deve derivar o posto da assistencia');

-- ---------------------------------------------------------------------------
-- Status controlado por RPC; operador nao valida
-- ---------------------------------------------------------------------------

do $$
begin
  update public.lancamentos_operacionais
  set status = 'validado'
  where id = pg_temp.fx_deslocamento_id();
  raise exception 'ASSERTION FAILED: status nao deveria mudar por update direto';
exception
  when others then
    if sqlerrm not like '%validacao_somente_por_rpc%' then
      raise;
    end if;
end
$$;

do $$
begin
  perform public.validar_lancamento(pg_temp.fx_deslocamento_id());
  raise exception 'ASSERTION FAILED: operador nao deveria validar lancamento';
exception
  when others then
    if sqlerrm not like '%acesso_negado%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Separacao por posto
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000024', true);

select pg_temp.assert_true(
  (select count(*) = 0 from public.lancamentos_operacionais l
   where l.id in (pg_temp.fx_deslocamento_id(), pg_temp.fx_custo_id())),
  'operador de outro posto nao deve ver os lancamentos');

-- ---------------------------------------------------------------------------
-- Supervisao valida; validado fica imutavel; remocao com justificativa
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000022', true);

select pg_temp.assert_true(
  (public.validar_lancamento(pg_temp.fx_deslocamento_id()) ->> 'status') = 'validado',
  'supervisao do posto deve validar o lancamento');

do $$
begin
  update public.lancamentos_operacionais
  set valor = 99.99
  where id = pg_temp.fx_deslocamento_id();
  raise exception 'ASSERTION FAILED: lancamento validado nao deveria ser editavel';
exception
  when others then
    if sqlerrm not like '%lancamento_validado_imutavel%' then
      raise;
    end if;
end
$$;

select public.remover_lancamento(pg_temp.fx_custo_id(), 'FX lancado em duplicidade');

select pg_temp.assert_true(
  (select count(*) = 0 from public.lancamentos_operacionais l
   where l.id = pg_temp.fx_custo_id()),
  'lancamento removido deve sumir das visoes operacionais');

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

select pg_temp.assert_true(
  (select count(*) >= 1 from public.historico_auditoria h
   where h.entidade_tipo = 'lancamentos_operacionais'
     and h.entidade_id = pg_temp.fx_deslocamento_id()
     and h.acao = 'status_alterado'),
  'validacao de lancamento deve gerar historico de status');

select pg_temp.assert_true(
  (select count(*) = 1 from public.historico_auditoria h
   where h.entidade_tipo = 'lancamentos_operacionais'
     and h.entidade_id = pg_temp.fx_custo_id()
     and h.acao = 'excluido_logicamente'),
  'soft delete de lancamento deve gerar historico');

rollback;
