-- Responsáveis de ocorrência devem pertencer ao posto da assistência.

create or replace function app_private.validar_ocorrencia()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  transicao_autorizada boolean :=
    coalesce(current_setting('doka.ocorrencia_transicao', true), '') = 'on';
  validar_tipo boolean := true;
  validar_responsavel boolean := new.responsavel_id is not null;
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
    select 1
    from public.usuarios u
    where u.id = new.responsavel_id
      and u.ativo = true
      and u.deleted_at is null
      and (
        u.perfil = 'direcao_admin'
        or exists (
          select 1
          from public.usuarios_postos up
          where up.usuario_id = u.id
            and up.posto_id = new.posto_id
            and up.deleted_at is null
        )
      )
  ) then
    raise exception 'responsavel_fora_do_posto';
  end if;

  return new;
end;
$$;

revoke all on function app_private.validar_ocorrencia()
from public, anon, authenticated;

grant execute on function app_private.validar_ocorrencia()
to postgres;
