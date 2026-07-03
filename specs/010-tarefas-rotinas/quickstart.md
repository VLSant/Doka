# Quickstart: Validar a Central de Tarefas e Rotinas

## Objetivo

Comprovar cadastro manual, atribuição, transições, recorrência, acúmulo,
idempotência, lista/kanban/calendário, RLS, auditoria e soft delete.

## Pré-requisitos

- Node.js 24 LTS e npm.
- Supabase CLI 2.107.0 ou versão compatível confirmada por `--version`.
- Ambiente local Supabase ou projeto remoto de desenvolvimento; nunca produção.
- URL e chave publicável na SPA; nenhuma chave secreta/`service_role`.
- Usuários Operador, Supervisão e Direção/Administração.
- Três postos, vínculos `operacional`, `consulta` e `supervisao`.
- Cargos/funções e prioridades ativos.
- Relógio de teste controlável para cenários em `America/Bahia`.

## 1. Verificações locais

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## 2. Preparar a migration

Descobrir a interface instalada:

```powershell
supabase --version
supabase migration new --help
supabase db push --help
supabase db lint --help
```

Criar a migration pelo CLI:

```powershell
supabase migration new tarefas_rotinas
```

Antes de aplicar, revisar:

- cinco tabelas, tipos e constraints;
- FKs e índices, inclusive todos os campos usados por policies;
- RLS e ausência de privilégios para `anon`;
- ausência de mutações diretas para `authenticated`;
- RPCs públicas, funções privadas e grants;
- `search_path = ''` e nomes qualificados em funções privilegiadas;
- unicidade de execução ativa e tarefa originária;
- versões monotônicas e locks;
- auditoria central e soft delete;
- extensão `pg_cron`, job único e ausência de segredo.

Dry run no desenvolvimento:

```powershell
supabase db push --linked --dry-run
```

## 3. Testes SQL transacionais

Executar os arquivos em transações com rollback no ambiente de desenvolvimento:

```sql
begin;
-- cenário completo
rollback;
```

Arquivos:

- `tarefas_rotinas_schema_rls.sql`
- `tarefas_rotinas_comandos.sql`
- `tarefas_rotinas_recorrencia.sql`
- `tarefas_rotinas_concorrencia.sql`
- `tarefas_rotinas_auditoria.sql`
- `tarefas_rotinas_desempenho.sql`

### Schema e RLS

1. Todas as tabelas têm RLS.
2. `anon` e usuário sem perfil recebem zero acesso.
3. Operador vê apenas postos vinculados.
4. Supervisão vê e gerencia somente vínculos `supervisao`.
5. Direção/Administração tem escopo global.
6. Filho nunca amplia o escopo do pai.
7. Funções privadas não são executáveis por papéis web.

### Comandos

1. Supervisão/Direção criam avulsa e estratégia.
2. Operador não cria nem edita tarefa.
3. Responsável inicia, retoma e conclui.
4. Qualquer um entre vários responsáveis conclui a tarefa inteira uma vez.
5. Não responsável é bloqueado.
6. Tarefa simples termina `concluida`.
7. Tarefa com validação aguarda e somente perfil autorizado valida.
8. Reabertura exige justificativa e preserva eventos anteriores.
9. Tarefa validada exige reabertura antes de nova execução.
10. Soft delete não muda status e mantém histórico.

### Recorrência

1. Diária, semanal, mensal e personalizada em dias/semanas/meses.
2. Dia 31 vira último dia de fevereiro e de meses curtos.
3. Início passado não cria tarefa anterior à criação.
4. Previsões existem até 90 dias e consulta não gera tarefa.
5. Alteração cancela previsões antigas, incrementa versão e preserva passado.
6. Pausa/inatividade/soft delete interrompem previsões.
7. Reativação não recupera o período pausado.
8. Indisponibilidade recupera todas as ocorrências em ordem.
9. Ocorrência repetida não duplica execução ou tarefa.
10. Tarefa aberta faz as ocorrências seguintes acumularem na mesma tarefa.
11. Após conclusão, ocorrência futura gera nova tarefa.

### Concorrência

1. Dois editores usam a mesma versão.
2. Dois responsáveis concluem simultaneamente.
3. Validação e reabertura concorrem.
4. Job é chamado simultaneamente.
5. Rotina muda enquanto o job processa.
6. Falha intermediária não deixa execução/tarefa órfã.
7. Resposta incerta é confirmada por releitura.

### Auditoria

- Cada ação obrigatória gera um evento após sucesso.
- Operação bloqueada ou revertida não gera sucesso.
- Automação usa ator nulo e origem identificada.
- Histórico preserva antes/depois, justificativa e posto.
- Nenhuma tabela paralela de eventos existe.

## 4. Cron e observabilidade

Confirmar job:

```sql
select jobname, schedule, active
from cron.job
where jobname = 'doka-processar-rotinas';
```

Confirmar execuções recentes:

```sql
select status, start_time, end_time, return_message
from cron.job_run_details
where jobid = (
  select jobid from cron.job where jobname = 'doka-processar-rotinas'
)
order by start_time desc
limit 20;
```

Validar:

- agenda de cinco minutos;
- uma única definição ativa;
- duração inferior a dez minutos;
- falha visível e recuperável;
- nenhuma credencial no comando do job.

## 5. Lint, advisors e desempenho

```powershell
supabase db lint --linked --schema public --level error
```

Depois:

- executar advisors de segurança e desempenho;
- revisar grants e policies;
- usar `EXPLAIN (ANALYZE, BUFFERS)` nas consultas de lista, calendário,
  validação e execução vencida;
- validar 10.000 tarefas e 1.000 ocorrências atrasadas;
- confirmar que lote excedente permanece elegível para próxima execução.

Metas:

- 95% de lista/filtros com resultado ou progresso em até 2 s;
- zero duplicidade em 1.000 ocorrências;
- job abaixo de 10 minutos;
- paginação padrão 50, máximo 100;
- calendário limitado a 92 dias.

## 6. Validação frontend

### Vitest/Testing Library

- serialização de filtros e cursor;
- mapeamento de RPCs e erros;
- capacidades por perfil/estado;
- lista, kanban e calendário com conjunto coerente;
- atraso, validação e acúmulo;
- formulários e combinações de recorrência;
- conflito preservando rascunho;
- estados vazio, erro, sessão expirada e acesso negado.

### Aceite manual no navegador

Os cenários de navegação real e E2E são executados exclusivamente pelo usuário;
não fazem parte da suíte automatizada desta spec.

- [ ] Criar tarefa em até dois minutos sem ajuda.
- [ ] Confirmar menu disponível, placeholder removido e URL direta por perfil.
- [ ] Criar/editar tarefa como Supervisão e confirmar criação bloqueada para Operador.
- [ ] Concluir, validar e reabrir pelos perfis autorizados.
- [ ] Criar, pausar e reativar uma rotina.
- [ ] Alternar visualizações preservando filtros e contexto.
- [ ] Distinguir autoria, responsáveis, concluinte e validador.
- [ ] Identificar atraso sem novo status.
- [ ] Identificar tarefa acumulada e desde quando.
- [ ] Distinguir previsão, tarefa gerada e acúmulo no calendário.
- [ ] Mover no kanban somente por transição permitida.
- [ ] Navegar por teclado com foco visível.
- [ ] Confirmar rótulos e mensagens em PT-BR.
- [ ] Confirmar estados sem depender apenas de cor.
- [ ] Validar 1280×720 e 1440×900.

## 7. Evidências de conclusão

Registrar:

- migration e job aplicados no desenvolvimento;
- testes SQL por arquivo e perfis utilizados;
- lint e advisors;
- planos de consulta e massa de desempenho;
- typecheck, lint, Vitest e build;
- matriz de aceite manual;
- confirmação de RLS, auditoria, soft delete e ausência de segredo no bundle.
