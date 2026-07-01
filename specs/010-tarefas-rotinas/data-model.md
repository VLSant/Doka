# Data Model: Central de Tarefas, Rotinas Recorrentes e Estratégias Operacionais

## Visão geral

```text
postos
  |-- tarefas -- tarefa_responsaveis -- usuarios
  `-- rotinas -- rotina_responsaveis -- usuarios
                 `-- rotina_execucoes -- tarefas

cargos_funcoes/prioridades --> tarefas e rotinas
historico_auditoria -------> tarefas, responsabilidades, rotinas e execuções
```

As cinco tabelas são entidades operacionais com RLS. `historico_auditoria`
permanece a única fonte de eventos; `rotina_execucoes` representa ocorrências do
domínio e não substitui auditoria.

## Tipos controlados

### `tipo_tarefa`

- `avulsa`
- `rotina`
- `estrategia`

O campo `tipo` também é projetado como origem para filtros. Não existe coluna
redundante de origem.

### `status_tarefa`

- `pendente`
- `em_andamento`
- `concluida`
- `validada`
- `reaberta`

### `status_rotina`

- `ativa`
- `pausada`
- `inativa`

### `tipo_recorrencia`

- `diaria`
- `semanal`
- `mensal`
- `personalizada`

### `unidade_intervalo_recorrencia`

- `dia`
- `semana`
- `mes`

Usada somente por recorrência personalizada.

### `status_execucao_rotina`

- `prevista`
- `gerada`
- `acumulada`
- `concluida`
- `cancelada`

## Entidades

### `tarefas`

Representa tarefa avulsa, estratégia ou tarefa gerada por rotina.

| Campo | Regra |
| --- | --- |
| `id` | UUID, chave primária |
| `titulo` | Obrigatório, normalizado, até 200 caracteres |
| `descricao` | Obrigatória, até 4.000 caracteres |
| `tipo` | `tipo_tarefa`, obrigatório |
| `posto_id` | FK obrigatória para posto ativo no cadastro/edição |
| `cargo_funcao_id` | FK opcional; ativo quando informado |
| `prioridade_id` | FK obrigatória para prioridade ativa |
| `status` | `status_tarefa`, inicia `pendente` |
| `prazo_data` | Data operacional obrigatória |
| `horario_limite` | Horário local opcional |
| `exige_validacao` | Booleano obrigatório |
| `observacoes` | Opcional, até 4.000 caracteres |
| `rotina_id` | FK opcional; obrigatória quando `tipo = rotina` |
| `rotina_execucao_id` | FK opcional para execução originária |
| `criada_por` | FK obrigatória para usuário operacional autor |
| `concluida_em` / `concluida_por` | Última conclusão efetiva |
| `validada_em` / `validada_por` | Última validação efetiva |
| `reaberta_em` / `reaberta_por` | Última reabertura efetiva |
| `motivo_reabertura` | Obrigatório no estado `reaberta` |
| `versao` | Inteiro positivo, inicia 1 e incrementa em mudança efetiva |
| controles | `created_at/by`, `updated_at/by`, `deleted_at/by`, `delete_reason` |

Regras:

- Tarefa manual exige ao menos um responsável ativo no momento da criação.
- Tarefa de rotina recebe responsáveis da rotina no mesmo commit da geração.
- `tipo = rotina` exige `rotina_id` e `rotina_execucao_id`; outros tipos não os
  aceitam.
- `rotina_execucao_id` é único quando preenchido: uma execução originária não
  cria duas tarefas.
- `deleted_at` exige `deleted_by` e `delete_reason`.
- Tarefa removida não aceita edição ou transição.
- Atraso é projeção, nunca campo persistido:
  `status in (pendente, em_andamento, reaberta)` e limite operacional vencido.
- Sem horário, o limite é o fim de `prazo_data` em `America/Bahia`.

Índices:

- `(posto_id, prazo_data, horario_limite, id)` onde não removida;
- `(status, prazo_data, id)` onde não removida;
- `(prioridade_id, prazo_data, id)` onde não removida;
- `(rotina_id, status)` onde não removida;
- `rotina_execucao_id` único parcial;
- `created_by`, `updated_by`, `deleted_by` e demais FKs.

### `tarefa_responsaveis`

Vínculo histórico entre tarefa e usuário responsável.

| Campo | Regra |
| --- | --- |
| `id` | UUID, chave primária |
| `tarefa_id` | FK obrigatória |
| `usuario_id` | FK obrigatória |
| controles | `created_at/by`, `deleted_at/by`, `delete_reason` |

Regras:

- Índice único parcial em `(tarefa_id, usuario_id)` onde `deleted_at is null`.
- Usuário deve estar ativo, não removido e elegível ao posto da tarefa.
- Remoção é lógica; atribuições antigas permanecem auditáveis.
- Qualquer responsável ativo pode concluir a tarefa inteira; o evento registra
  o responsável que executou a conclusão.

### `rotinas`

Definição versionada que produz execuções previstas.

| Campo | Regra |
| --- | --- |
| `id` | UUID, chave primária |
| `nome` | Obrigatório, até 200 caracteres |
| `descricao` | Obrigatória, até 4.000 caracteres |
| `posto_id` | FK obrigatória para posto ativo |
| `cargo_funcao_id` | FK opcional e ativa quando informada |
| `prioridade_id` | FK obrigatória e ativa |
| `recorrencia` | `tipo_recorrencia` |
| `intervalo` | Inteiro positivo; 1 fora de personalizada |
| `unidade_intervalo` | Obrigatória somente em personalizada |
| `dias_semana` | Array normalizado de 1 a 7, sem repetição |
| `dia_mes` | Inteiro de 1 a 31 |
| `horario_limite` | Horário local opcional |
| `exige_validacao` | Booleano obrigatório |
| `data_inicio` | Data âncora obrigatória |
| `data_primeiro_processamento` | Maior entre início e data de criação |
| `data_fim` | Opcional, não anterior ao início |
| `status` | `ativa`, `pausada` ou `inativa` |
| `versao_regra` | Inteiro positivo, inicia 1 |
| `horizonte_materializado_ate` | Última data sincronizada da versão atual |
| controles | `created_at/by`, `updated_at/by`, `deleted_at/by`, `delete_reason` |

Validação da configuração:

| Recorrência | Intervalo/unidade | Dias da semana | Dia do mês |
| --- | --- | --- | --- |
| Diária | `1`, sem unidade | Vazio | Vazio |
| Semanal | `1`, sem unidade | Um ou mais | Vazio |
| Mensal | `1`, sem unidade | Vazio | Obrigatório |
| Personalizada/dia | `> 0`, `dia` | Vazio | Vazio |
| Personalizada/semana | `> 0`, `semana` | Um ou mais | Vazio |
| Personalizada/mês | `> 0`, `mes` | Vazio | Obrigatório |

Regras:

- Mensal usa o menor valor entre `dia_mes` e o último dia do mês.
- Semanal usa `data_inicio` para calcular blocos de semanas.
- Alteração relevante incrementa `versao_regra`, cancela previsões futuras
  antigas e zera o horizonte da nova versão.
- Pausar ou inativar cancela previsões futuras ainda não processadas.
- Reativar materializa somente datas a partir da data operacional atual; não
  recria datas do período pausado como tarefas.
- Soft delete não é status e exige justificativa.

Índices:

- `(posto_id, status, data_inicio, data_fim)` onde não removida;
- `(status, horizonte_materializado_ate)` onde não removida;
- FKs e campos de auditoria.

### `rotina_responsaveis`

Responsáveis padrão copiados para a tarefa gerada.

| Campo | Regra |
| --- | --- |
| `id` | UUID, chave primária |
| `rotina_id` | FK obrigatória |
| `usuario_id` | FK obrigatória |
| controles | `created_at/by`, `deleted_at/by`, `delete_reason` |

Regras equivalentes a `tarefa_responsaveis`, com índice único parcial.
Mudança afeta somente execuções futuras ainda não processadas.

### `rotina_execucoes`

Ocorrência prevista e seu resultado de geração/acúmulo.

| Campo | Regra |
| --- | --- |
| `id` | UUID, chave primária |
| `rotina_id` | FK obrigatória |
| `rotina_versao` | Versão que calculou a ocorrência |
| `data_prevista` | Data operacional da ocorrência |
| `status` | `status_execucao_rotina` |
| `tarefa_id` | FK nula em prevista/cancelada; obrigatória em gerada/acumulada/concluída |
| `execucao_origem_id` | FK para execução que originou a tarefa acumulada |
| `acumulada_desde` | Data da primeira execução aberta compartilhada |
| `configuracao_snapshot` | Contexto efetivo usado ao gerar/acumular |
| `gerada_em` | Instante de processamento |
| `concluida_em` | Instante em que a tarefa compartilhada foi concluída |
| `cancelada_em` / `motivo_cancelamento` | Obrigatórios quando cancelada |
| controles | `created_at`, `updated_at` |

Regras:

- Único registro não cancelado por `(rotina_id, data_prevista)`.
- Nova versão pode criar a mesma data somente após cancelar a previsão antiga.
- `prevista -> gerada|acumulada|cancelada`.
- `gerada|acumulada -> concluida` quando a tarefa relacionada é concluída.
- Estado final não volta a `prevista`.
- Snapshot contém IDs de posto, cargo/função, prioridade e responsáveis,
  horário, validação e versão; não guarda dados sensíveis.
- Execução acumulada aponta à mesma tarefa e à execução originária.

Índices:

- unicidade parcial `(rotina_id, data_prevista)` onde status não é cancelada;
- `(status, data_prevista, id)` para o job;
- `(tarefa_id, status)`;
- `(rotina_id, rotina_versao, data_prevista)`.

## Relacionamentos circulares controlados

`tarefas.rotina_execucao_id` identifica a execução originária.
`rotina_execucoes.tarefa_id` identifica a tarefa criada ou compartilhada.
As FKs são adicionadas depois das tabelas; ambas aceitam nulo durante a criação
interna, mas a função transacional deve terminar com a combinação válida.

## Transições de tarefa

```text
pendente ------ iniciar ------> em_andamento
em_andamento -- concluir -----> concluida
concluida ----- validar ------> validada
concluida ----- reabrir ------> reaberta
validada ------ reabrir ------> reaberta
reaberta ------ retomar ------> em_andamento
```

- Conclusão simples termina em `concluida`.
- Conclusão com validação aguarda em `concluida`.
- Somente responsável ativo inicia, retoma ou conclui.
- Somente Supervisão do escopo ou Direção/Administração valida/reabre.
- Reabertura exige justificativa.
- Toda mudança compara `versao` esperada e bloqueia a linha.

## Algoritmo de geração

1. Obter trava transacional única do job.
2. Selecionar rotinas ativas não removidas em lotes.
3. Materializar datas elegíveis até `hoje + 90 dias`, com `ON CONFLICT` seguro.
4. Selecionar execuções `prevista` com `data_prevista <= hoje`, em ordem, usando
   lock que não espera por linha já processada.
5. Bloquear a rotina e procurar tarefa aberta anterior
   (`pendente`, `em_andamento`, `reaberta`) da mesma rotina.
6. Se existir, marcar execução `acumulada` e apontar à mesma tarefa/origem.
7. Se não existir, criar tarefa, copiar responsáveis e marcar `gerada`.
8. Registrar auditoria somente após o efeito bem-sucedido.
9. Ao concluir uma tarefa de rotina, marcar todas as execuções geradas ou
   acumuladas relacionadas como `concluida`.

Falha em qualquer passo da ocorrência reverte tarefa, responsáveis, execução e
auditoria daquela transação.

## Auditoria

Entidades registradas:

- `tarefas`
- `tarefa_responsaveis`
- `rotinas`
- `rotina_responsaveis`
- `rotina_execucoes`

Ações canônicas:

- `criado`, `atualizado`, `responsavel_adicionado`,
  `responsavel_removido`, `iniciado`, `concluido`, `validado`, `reaberto`,
  `prazo_alterado`, `rotina_criada`, `rotina_atualizada`, `rotina_pausada`,
  `rotina_reativada`, `rotina_inativada`, `execucao_prevista`,
  `tarefa_gerada`, `execucao_acumulada`, `execucao_cancelada`,
  `excluido_logicamente`.

Eventos automáticos usam `usuario_id = null` e metadata com
`origem = supabase_cron`, posto, rotina, versão e data prevista.

## Projeções

- `TaskListItem`: resumo, responsáveis, prazo, atraso, acúmulo, capacidade e
  versão.
- `TaskDetail`: tarefa completa, responsáveis, dados de fluxo, capacidades e
  referência de rotina/execução.
- `RoutineListItem`: regra legível, estado, responsáveis, próxima ocorrência e
  versão.
- `CalendarItem`: `tarefa`, `ocorrencia_prevista` ou `tarefa_acumulada`.
- `TaskHistoryEvent`: projeção autorizada da auditoria.
- `TaskDashboardSummary`: totais e agrupamentos autorizados, sem tela.

## Segurança e grants

- RLS habilitada nas cinco tabelas.
- `anon` não recebe privilégios.
- `authenticated` não recebe INSERT/UPDATE/DELETE direto.
- RPCs públicas recebem `EXECUTE` explícito somente de `authenticated`.
- Funções privadas e função do job revogam `EXECUTE` de `PUBLIC`, `anon` e
  `authenticated`.
- Nenhuma função aceita ator, perfil ou posto como prova de autorização.
- Funções privilegiadas usam `search_path = ''` e relações qualificadas.
