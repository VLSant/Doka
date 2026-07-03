-- Validacoes de RLS, permissoes e regras criticas de Tarefas e Rotinas.
-- Autossuficiente: cria as proprias fixtures e desfaz tudo no rollback.
-- Execute no projeto remoto de desenvolvimento dentro de begin/rollback.

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

create or replace function pg_temp.fx_tarefa_id()
returns uuid
language sql
security definer
as $$
  select id from public.tarefas where titulo = 'FX tarefa do operador' limit 1
$$;

create or replace function pg_temp.fx_rotina_id()
returns uuid
language sql
security definer
as $$
  select id from public.rotinas where nome = 'FX rotina diaria' limit 1
$$;

-- ---------------------------------------------------------------------------
-- Fixtures (como postgres)
-- ---------------------------------------------------------------------------

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'fx-operador-a@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'fx-supervisao-a@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'fx-direcao@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'fx-operador-b@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.postos (id, nome, codigo)
values
  ('ff400000-0000-0000-0000-000000000001', 'FX Posto A', 'FXA'),
  ('ff400000-0000-0000-0000-000000000002', 'FX Posto B', 'FXB');

insert into public.usuarios (id, auth_user_id, nome, email, perfil)
values
  ('ff200000-0000-0000-0000-000000000001', 'ff100000-0000-0000-0000-000000000001', 'FX Operador A', 'fx-operador-a@doka.test', 'operador'),
  ('ff200000-0000-0000-0000-000000000002', 'ff100000-0000-0000-0000-000000000002', 'FX Supervisao A', 'fx-supervisao-a@doka.test', 'supervisao'),
  ('ff200000-0000-0000-0000-000000000003', 'ff100000-0000-0000-0000-000000000003', 'FX Direcao', 'fx-direcao@doka.test', 'direcao_admin'),
  ('ff200000-0000-0000-0000-000000000004', 'ff100000-0000-0000-0000-000000000004', 'FX Operador B', 'fx-operador-b@doka.test', 'operador');

insert into public.usuarios_postos (usuario_id, posto_id, nivel_acesso)
values
  ('ff200000-0000-0000-0000-000000000001', 'ff400000-0000-0000-0000-000000000001', 'operacional'),
  ('ff200000-0000-0000-0000-000000000002', 'ff400000-0000-0000-0000-000000000001', 'supervisao'),
  ('ff200000-0000-0000-0000-000000000004', 'ff400000-0000-0000-0000-000000000002', 'operacional');

set role authenticated;

-- ---------------------------------------------------------------------------
-- Operador cria tarefa somente para si
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000001', true);

select public.criar_tarefa(
  p_titulo => 'FX tarefa do operador',
  p_posto_id => 'ff400000-0000-0000-0000-000000000001'
);

select pg_temp.assert_true(
  (select count(*) = 1 from public.tarefas t
   where t.id = pg_temp.fx_tarefa_id() and t.status = 'pendente'),
  'operador deve criar tarefa pendente para si');

select pg_temp.assert_true(
  (select count(*) = 1 from public.tarefa_responsaveis tr
   where tr.tarefa_id = pg_temp.fx_tarefa_id()
     and tr.usuario_id = 'ff200000-0000-0000-0000-000000000001'
     and tr.deleted_at is null),
  'responsavel padrao da tarefa do operador deve ser ele mesmo');

do $$
begin
  perform public.criar_tarefa(
    p_titulo => 'FX invalida',
    p_responsaveis => array['ff200000-0000-0000-0000-000000000002']::uuid[]
  );
  raise exception 'ASSERTION FAILED: operador nao deveria criar tarefa para outro usuario';
exception
  when others then
    if sqlerrm not like '%operador_somente_para_si%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Supervisao cria dentro do escopo; fora do escopo e recusado
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000002', true);

select pg_temp.assert_true(
  (public.criar_tarefa(
    p_titulo => 'FX tarefa da supervisao',
    p_posto_id => 'ff400000-0000-0000-0000-000000000001',
    p_exige_validacao => true,
    p_responsaveis => array['ff200000-0000-0000-0000-000000000001']::uuid[]
  ) ->> 'status') = 'pendente',
  'supervisao deve criar tarefa para operador do escopo');

do $$
begin
  perform public.criar_tarefa(
    p_titulo => 'FX fora do escopo',
    p_responsaveis => array['ff200000-0000-0000-0000-000000000004']::uuid[]
  );
  raise exception 'ASSERTION FAILED: supervisao nao deveria atribuir a operador de outro posto';
exception
  when others then
    if sqlerrm not like '%responsavel_fora_do_escopo%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Separacao por posto na leitura
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000004', true);
select pg_temp.assert_true(
  (select count(*) = 0 from public.tarefas t
   where t.posto_id = 'ff400000-0000-0000-0000-000000000001'),
  'operador B nao deve ver tarefas do posto A');

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000003', true);
select pg_temp.assert_true(
  (select count(*) = 2 from public.tarefas t
   where t.posto_id = 'ff400000-0000-0000-0000-000000000001'),
  'direcao deve ver todas as tarefas do posto A');

-- ---------------------------------------------------------------------------
-- Transicoes: concluir, validar, reabrir com justificativa
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000001', true);

select pg_temp.assert_true(
  (public.transicionar_tarefa(pg_temp.fx_tarefa_id(), 'iniciar') ->> 'status') = 'em_andamento',
  'responsavel deve iniciar a tarefa');
select pg_temp.assert_true(
  (public.transicionar_tarefa(pg_temp.fx_tarefa_id(), 'concluir') ->> 'status') = 'concluida',
  'responsavel deve concluir a tarefa');

do $$
begin
  perform public.transicionar_tarefa(pg_temp.fx_tarefa_id(), 'reabrir', 'motivo');
  raise exception 'ASSERTION FAILED: operador nao deveria reabrir tarefa';
exception
  when others then
    if sqlerrm not like '%acesso_negado%' then
      raise;
    end if;
end
$$;

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000002', true);

do $$
begin
  perform public.transicionar_tarefa(pg_temp.fx_tarefa_id(), 'reabrir');
  raise exception 'ASSERTION FAILED: reabertura sem justificativa deveria falhar';
exception
  when others then
    if sqlerrm not like '%justificativa_obrigatoria%' then
      raise;
    end if;
end
$$;

select pg_temp.assert_true(
  (public.transicionar_tarefa(pg_temp.fx_tarefa_id(), 'reabrir', 'FX revisar execucao') ->> 'status') = 'reaberta',
  'supervisao do escopo deve reabrir com justificativa');

-- ---------------------------------------------------------------------------
-- Rotina diaria: geracao idempotente e acumulo sem duplicar
-- ---------------------------------------------------------------------------

select public.criar_rotina(
  p_nome => 'FX rotina diaria',
  p_recorrencia => 'diaria',
  p_data_inicio => (now() at time zone 'America/Bahia')::date - 2,
  p_posto_id => 'ff400000-0000-0000-0000-000000000001',
  p_responsaveis => array['ff200000-0000-0000-0000-000000000001']::uuid[]
);

select public.gerar_tarefas_rotinas();

select pg_temp.assert_true(
  (select count(*) = 3 from public.rotina_execucoes e
   where e.rotina_id = pg_temp.fx_rotina_id()),
  'rotina diaria de 3 dias deve registrar 3 execucoes');

select pg_temp.assert_true(
  (select count(*) = 1 from public.tarefas t
   where t.rotina_id = pg_temp.fx_rotina_id()
     and t.deleted_at is null),
  'acumulo deve manter uma unica tarefa da rotina');

select pg_temp.assert_true(
  (select count(*) = 2 from public.rotina_execucoes e
   where e.rotina_id = pg_temp.fx_rotina_id() and e.status = 'acumulada'),
  'dias seguintes com tarefa aberta devem acumular');

select public.gerar_tarefas_rotinas();

select pg_temp.assert_true(
  (select count(*) = 3 from public.rotina_execucoes e
   where e.rotina_id = pg_temp.fx_rotina_id()),
  'reprocessar nao deve duplicar execucoes');

select pg_temp.assert_true(
  (select count(*) = 1 from public.tarefas t
   where t.rotina_id = pg_temp.fx_rotina_id() and t.deleted_at is null),
  'reprocessar nao deve duplicar tarefas de rotina');

select pg_temp.assert_true(
  (public.atualizar_rotina(
    p_rotina_id => pg_temp.fx_rotina_id(),
    p_status => 'pausada'
  ) ->> 'status') = 'pausada',
  'supervisao deve pausar a rotina');

-- ---------------------------------------------------------------------------
-- Auditoria centralizada das transicoes
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000003', true);

select pg_temp.assert_true(
  (select count(*) >= 1 from public.historico_auditoria h
   where h.entidade_tipo = 'tarefas'
     and h.entidade_id = pg_temp.fx_tarefa_id()
     and h.acao = 'criado'),
  'criacao de tarefa deve gerar historico');

select pg_temp.assert_true(
  (select count(*) >= 3 from public.historico_auditoria h
   where h.entidade_tipo = 'tarefas'
     and h.entidade_id = pg_temp.fx_tarefa_id()
     and h.acao = 'status_alterado'),
  'transicoes de tarefa devem gerar historico de status');

rollback;
