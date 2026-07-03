-- Validacoes da administracao minima: protecao do ultimo Direcao/Administracao
-- ativo e listagem de identidades Auth disponiveis.
-- Autossuficiente e transacional: as alteracoes em usuarios reais sao
-- desfeitas no rollback.

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

-- ---------------------------------------------------------------------------
-- Fixtures (como postgres)
-- ---------------------------------------------------------------------------

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000033', 'authenticated', 'authenticated', 'fx-adm-direcao@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000031', 'authenticated', 'authenticated', 'fx-adm-operador@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ff100000-0000-0000-0000-000000000039', 'authenticated', 'authenticated', 'fx-adm-identidade-livre@doka.test', 'x', now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.usuarios (id, auth_user_id, nome, email, perfil)
values
  ('ff200000-0000-0000-0000-000000000033', 'ff100000-0000-0000-0000-000000000033', 'FX Adm Direcao', 'fx-adm-direcao@doka.test', 'direcao_admin'),
  ('ff200000-0000-0000-0000-000000000031', 'ff100000-0000-0000-0000-000000000031', 'FX Adm Operador', 'fx-adm-operador@doka.test', 'operador');

-- Rebaixa temporariamente os demais administradores reais (desfeito no
-- rollback) para isolar o cenario de "ultimo administrador".
update public.usuarios
set perfil = 'supervisao'
where perfil = 'direcao_admin'
  and id <> 'ff200000-0000-0000-0000-000000000033'
  and ativo = true
  and deleted_at is null;

set role authenticated;

-- ---------------------------------------------------------------------------
-- Identidades Auth disponiveis (somente direcao)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000033', true);

select pg_temp.assert_true(
  (select public.listar_identidades_auth_disponiveis() @>
    jsonb_build_array(jsonb_build_object('auth_user_id', 'ff100000-0000-0000-0000-000000000039'))),
  'direcao deve listar identidade Auth ainda sem usuario operacional');

select pg_temp.assert_true(
  not (select public.listar_identidades_auth_disponiveis() @>
    jsonb_build_array(jsonb_build_object('auth_user_id', 'ff100000-0000-0000-0000-000000000033'))),
  'identidade ja associada nao deve aparecer como disponivel');

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000031', true);

do $$
begin
  perform public.listar_identidades_auth_disponiveis();
  raise exception 'ASSERTION FAILED: operador nao deveria listar identidades';
exception
  when others then
    if sqlerrm not like '%acesso_negado%' then
      raise;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Protecao do ultimo administrador ativo
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000033', true);

do $$
begin
  update public.usuarios
  set ativo = false
  where id = 'ff200000-0000-0000-0000-000000000033';
  raise exception 'ASSERTION FAILED: inativar o ultimo admin deveria falhar';
exception
  when others then
    if sqlerrm not like '%ultimo_admin_protegido%' then
      raise;
    end if;
end
$$;

do $$
begin
  update public.usuarios
  set perfil = 'operador'
  where id = 'ff200000-0000-0000-0000-000000000033';
  raise exception 'ASSERTION FAILED: rebaixar o ultimo admin deveria falhar';
exception
  when others then
    if sqlerrm not like '%ultimo_admin_protegido%' then
      raise;
    end if;
end
$$;

-- Com um segundo admin ativo, a mudanca volta a ser permitida.
reset role;

update public.usuarios
set perfil = 'direcao_admin'
where id = 'ff200000-0000-0000-0000-000000000031';

set role authenticated;
select set_config('request.jwt.claim.sub', 'ff100000-0000-0000-0000-000000000031', true);

update public.usuarios
set ativo = false
where id = 'ff200000-0000-0000-0000-000000000033';

select pg_temp.assert_true(
  (select count(*) = 1 from public.usuarios u
   where u.id = 'ff200000-0000-0000-0000-000000000033' and u.ativo = false),
  'com outro admin ativo, o admin pode ser inativado');

rollback;
