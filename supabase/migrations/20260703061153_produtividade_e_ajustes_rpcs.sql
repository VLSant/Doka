-- Camada de produtividade/eficiencia e ajustes de RPCs de tarefas/rotinas.
-- 1. view_produtividade_mms: agregado por posto/dia/tipo do espelho MMS,
--    com security_invoker para respeitar as policies existentes.
-- 2. atualizar_tarefa: permite alterar o tipo (avulsa/estrategia) e limpar
--    campos opcionais (a interface envia sempre o estado completo do form).
-- 3. atualizar_rotina: idem para os campos opcionais da rotina.

-- ---------------------------------------------------------------------------
-- View de produtividade
-- ---------------------------------------------------------------------------

create or replace view public.view_produtividade_mms
with (security_invoker = true) as
select
  a.posto_id,
  p.nome as posto_nome,
  a.data_atividade,
  a.tipo_atividade_normalizado,
  count(*) filter (where a.status_interno = 'ativo')::integer as previstas,
  count(*) filter (where a.status_interno = 'removido')::integer as removidas,
  count(*) filter (
    where a.status_interno = 'ativo' and a.status_atividade = 'concluido'
  )::integer as executadas,
  count(*) filter (
    where a.status_interno = 'ativo' and a.status_atividade = 'nao_concluido'
  )::integer as nao_executadas,
  count(*) filter (
    where a.status_interno = 'ativo' and a.status_atividade in ('pendente', 'iniciado')
  )::integer as pendentes,
  count(*) filter (
    where a.status_interno = 'ativo' and a.status_atividade = 'iniciado'
  )::integer as iniciadas,
  count(*) filter (
    where a.status_interno = 'ativo' and a.status_atividade = 'cancelado'
  )::integer as canceladas
from public.mms_assistencias a
join public.postos p on p.id = a.posto_id
where a.deleted_at is null
group by a.posto_id, p.nome, a.data_atividade, a.tipo_atividade_normalizado;

revoke all on public.view_produtividade_mms from anon;
grant select on public.view_produtividade_mms to authenticated;

-- ---------------------------------------------------------------------------
-- atualizar_tarefa: novo parametro p_tipo e limpeza de campos opcionais
-- ---------------------------------------------------------------------------

drop function if exists public.atualizar_tarefa(uuid, text, text, uuid, uuid, uuid, date, time, boolean, text, uuid[]);

create or replace function public.atualizar_tarefa(
  p_tarefa_id uuid,
  p_titulo text default null,
  p_descricao text default null,
  p_tipo public.tipo_tarefa default null,
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

  -- Tarefas geradas por rotina mantem o tipo; avulsa/estrategia podem alternar.
  if p_tipo is not null and p_tipo is distinct from t.tipo then
    if t.tipo = 'rotina' or p_tipo = 'rotina' then
      raise exception 'tipo_invalido';
    end if;
  end if;

  perform app_private.validar_posto_para_ator(ator, p_posto_id);

  -- Campos opcionais recebem o valor enviado (a interface envia o estado
  -- completo do formulario), permitindo inclusive limpa-los.
  update public.tarefas
  set titulo = coalesce(nullif(btrim(coalesce(p_titulo, '')), ''), titulo),
      descricao = nullif(btrim(coalesce(p_descricao, '')), ''),
      tipo = coalesce(p_tipo, tipo),
      posto_id = p_posto_id,
      cargo_funcao_id = p_cargo_funcao_id,
      prioridade_id = p_prioridade_id,
      prazo_data = p_prazo_data,
      horario_limite = p_horario_limite,
      exige_validacao = coalesce(p_exige_validacao, exige_validacao),
      observacoes = nullif(btrim(coalesce(p_observacoes, '')), ''),
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

revoke all on function public.atualizar_tarefa(uuid, text, text, public.tipo_tarefa, uuid, uuid, uuid, date, time, boolean, text, uuid[]) from public, anon;
grant execute on function public.atualizar_tarefa(uuid, text, text, public.tipo_tarefa, uuid, uuid, uuid, date, time, boolean, text, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- atualizar_rotina: limpeza de campos opcionais
-- ---------------------------------------------------------------------------

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
      descricao = nullif(btrim(coalesce(p_descricao, '')), ''),
      posto_id = p_posto_id,
      cargo_funcao_id = p_cargo_funcao_id,
      prioridade_id = p_prioridade_id,
      recorrencia = coalesce(p_recorrencia, recorrencia),
      dias_semana = p_dias_semana,
      dia_mes = p_dia_mes,
      horario_limite = p_horario_limite,
      exige_validacao = coalesce(p_exige_validacao, exige_validacao),
      status = coalesce(p_status, status),
      data_inicio = coalesce(p_data_inicio, data_inicio),
      data_fim = p_data_fim,
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
