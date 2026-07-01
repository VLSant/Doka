# Contract: Rotinas, Previsões, Geração e Acúmulo

## `public.salvar_rotina`

Cria quando `p_rotina_id` é nulo e atualiza quando informado.

Entrada principal:

```json
{
  "p_rotina_id": "uuid ou null",
  "p_dados": {
    "nome": "Rotina diária",
    "descricao": "Descrição operacional",
    "posto_id": "uuid",
    "cargo_funcao_id": "uuid ou null",
    "prioridade_id": "uuid",
    "responsaveis_ids": ["uuid"],
    "recorrencia": "diaria|semanal|mensal|personalizada",
    "intervalo": 1,
    "unidade_intervalo": "dia|semana|mes|null",
    "dias_semana": [1, 3, 5],
    "dia_mes": 31,
    "horario_limite": "17:00 ou null",
    "exige_validacao": true,
    "data_inicio": "2026-07-01",
    "data_fim": null
  },
  "p_versao_esperada": "inteiro ou null"
}
```

Autorização: Supervisão no próprio escopo ou Direção/Administração global.

Criação:

- valida configuração e responsáveis;
- inicia `ativa`, `versao_regra = 1`;
- define primeira data processável sem retroagir antes da criação;
- materializa previsões da janela de 90 dias;
- audita rotina e previsões.

Edição:

- bloqueia rotina e compara versão;
- preserva execuções processadas e tarefas;
- cancela previsões futuras da versão anterior;
- incrementa versão e materializa nova janela;
- audita diferenças e cancelamentos.

## `public.alterar_estado_rotina`

Entrada:

```json
{
  "p_rotina_id": "uuid",
  "p_acao": "pausar|reativar|inativar",
  "p_versao_esperada": 3,
  "p_justificativa": "texto obrigatório"
}
```

- Pausar/inativar cancela previsões futuras ainda não processadas.
- Reativar inicia previsões na data operacional atual, sem gerar tarefas do
  período pausado.
- Nenhuma ação altera tarefas ou execuções processadas.

## `public.excluir_rotina`

Aplica soft delete com versão e justificativa. Cancela previsões futuras e
preserva execuções/tarefas anteriores.

## Função privada do job

`app_private.processar_rotinas_agendadas(p_agora, p_horizonte_dias, p_limite)`

- Não executável por `PUBLIC`, `anon` ou `authenticated`.
- Chamada por um job `doka-processar-rotinas` a cada cinco minutos.
- Usa `America/Bahia`, horizonte padrão 90 e lote padrão 500.
- Uma trava transacional impede duas instâncias sobrepostas.
- Resultado contém contagens, nunca dados sensíveis.

## Elegibilidade por data

- Diária: todos os dias desde a âncora.
- Semanal: dias selecionados em cada semana.
- Mensal: `dia_mes`, reduzido ao último dia do mês.
- Personalizada/dia: a cada N dias desde a âncora.
- Personalizada/semana: dias selecionados a cada N semanas.
- Personalizada/mês: dia configurado a cada N meses, reduzido ao último dia.
- `data_fim`, pausa, inatividade e soft delete interrompem novas previsões.

## Processamento de uma ocorrência

1. Bloqueia execução `prevista` e rotina.
2. Confirma que a versão e a data continuam elegíveis.
3. Procura tarefa aberta anterior da rotina.
4. Com tarefa aberta: execução vira `acumulada`, aponta à mesma tarefa e origem.
5. Sem tarefa aberta: cria tarefa/atribuições e execução vira `gerada`.
6. Grava snapshot e auditoria.
7. Commit ocorre para todos os efeitos ou para nenhum.

## Restrições de idempotência

- No máximo uma execução não cancelada por rotina/data.
- No máximo uma tarefa por execução originária.
- Uma execução acumulada não cria tarefa.
- Repetição de materialização usa conflito seguro.
- Lock, constraints e estado persistido prevalecem sobre a memória do job.

## Recuperação atrasada

- Job repõe previsões ausentes desde a primeira data processável.
- Execuções vencidas são processadas cronologicamente.
- Se a primeira tarefa permanecer aberta, todas as ocorrências seguintes ficam
  acumuladas na mesma tarefa.
- O limite de lote posterga excedentes, mas não os descarta.
- Falha de uma chamada deixa itens não confirmados elegíveis à próxima.

## Erros e observabilidade

- Falha faz rollback da ocorrência atual.
- `cron.job_run_details` registra execução do job.
- Auditoria registra efeitos de domínio, não mera tentativa.
- Logs podem conter IDs e contagens, nunca payload de usuários.

## Testes obrigatórios

- Todas as frequências e intervalos.
- Dia 29/30/31 em fevereiro e meses curtos.
- Criação com início passado sem retroação indevida.
- Janela futura e alteração de versão.
- Pausa, reativação, inativação e soft delete.
- Repetição e concorrência do job.
- Falha intermediária sem execução órfã.
- 1.000 ocorrências atrasadas processadas em lotes.
- Acúmulo de vários períodos e nova tarefa após conclusão.
- Responsáveis e snapshot históricos preservados.
