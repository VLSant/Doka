-- Administracao minima do MVP.
-- 1. Protecao contra inativar/remover/rebaixar o ultimo Direcao/Administracao.
-- 2. RPC para listar identidades do Supabase Auth ainda sem usuario
--    operacional (necessaria porque o frontend nao le auth.users).
-- Os CRUDs administrativos usam as policies ja existentes das Specs 001/002.

create or replace function app_private.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.perfil = 'direcao_admin'
    and old.ativo = true
    and old.deleted_at is null
    and (
      new.perfil is distinct from 'direcao_admin'
      or new.ativo = false
      or new.deleted_at is not null
    ) then
    -- Serializa alteracoes concorrentes que afetem administradores.
    perform pg_advisory_xact_lock(hashtext('doka_ultimo_admin'));

    if not exists (
      select 1
      from public.usuarios u
      where u.id <> old.id
        and u.perfil = 'direcao_admin'
        and u.ativo = true
        and u.deleted_at is null
    ) then
      raise exception 'ultimo_admin_protegido';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists usuarios_proteger_ultimo_admin on public.usuarios;
create trigger usuarios_proteger_ultimo_admin
before update on public.usuarios
for each row execute function app_private.proteger_ultimo_admin();

create or replace function public.listar_identidades_auth_disponiveis()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  ator public.usuarios;
  identidades jsonb;
begin
  ator := app_private.exigir_ator_ativo();
  if ator.perfil <> 'direcao_admin' then
    raise exception 'acesso_negado';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'auth_user_id', au.id,
        'email', au.email,
        'criado_em', au.created_at
      )
      order by au.created_at desc
    ),
    '[]'::jsonb
  )
  into identidades
  from auth.users au
  where au.deleted_at is null
    and au.email is not null
    and not exists (
      select 1
      from public.usuarios u
      where u.auth_user_id = au.id
        and u.deleted_at is null
    );

  return identidades;
end;
$$;

revoke all on function public.listar_identidades_auth_disponiveis() from public, anon;
grant execute on function public.listar_identidades_auth_disponiveis() to authenticated;

revoke all on function app_private.proteger_ultimo_admin() from public;
