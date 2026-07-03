# Contract: Consultas e Interface de Tarefas e Rotinas

## Regras compartilhadas

- Usuário operacional ativo e escopo atual obrigatórios.
- Direção/Administração consulta globalmente.
- Supervisão consulta somente postos com vínculo `supervisao`.
- Operador consulta tarefas, rotinas e previsões dos postos vinculados.
- Registros soft-deleted ficam ocultos por padrão.
- Recurso inexistente e recurso inacessível convergem para `acesso_negado`.
- Filtros não ampliam o escopo definido no banco.

## `public.listar_tarefas`

Entrada:

```json
{
  "p_filtros": {
    "aba": "hoje|pendentes|atrasadas|concluidas|validacao",
    "posto_id": "uuid opcional",
    "responsavel_id": "uuid opcional",
    "cargo_funcao_id": "uuid opcional",
    "status": "pendente|em_andamento|concluida|validada|reaberta",
    "condicao": "atrasada|no_prazo",
    "prioridade_id": "uuid opcional",
    "data_de": "YYYY-MM-DD opcional",
    "data_ate": "YYYY-MM-DD opcional",
    "tipo": "avulsa|rotina|estrategia",
    "exige_validacao": "boolean opcional"
  },
  "p_cursor": "objeto de ordenação opcional",
  "p_limite": 50
}
```

Comportamento:

1. Valida limite de 1 a 100, intervalo e valores conhecidos.
2. Aplica escopo, soft delete, aba e filtros.
3. Calcula atraso em `America/Bahia`.
4. Ordena por prazo crescente, horário crescente com nulo no fim do dia,
   prioridade decrescente e ID.
5. Retorna cursor estável e capacidades atuais.

Saída:

```json
{
  "itens": [{
    "tarefa_id": "uuid",
    "titulo": "Conferir retorno diário",
    "tipo": "rotina",
    "posto": {"id": "uuid", "nome": "Posto A"},
    "prioridade": {"id": "uuid", "nome": "Alta", "nivel": 3, "cor": "#E0464B"},
    "responsaveis": [{"id": "uuid", "nome": "Pessoa"}],
    "status": "em_andamento",
    "prazo_data": "2026-07-01",
    "horario_limite": "17:00:00",
    "atrasada": false,
    "exige_validacao": true,
    "aguardando_validacao": false,
    "acumulada": true,
    "acumulada_desde": "2026-06-29",
    "versao": 4,
    "capacidades": {
      "editar": false,
      "iniciar": false,
      "concluir": true,
      "validar": false,
      "reabrir": false,
      "excluir": false
    }
  }],
  "proximo_cursor": null
}
```

## `public.obter_tarefa`

Entrada: `p_tarefa_id`.

Saída inclui todos os campos permitidos, responsáveis ativos, autoria,
conclusão, validação, reabertura, referências de rotina/execução, acúmulo,
versão e capacidades. Não retorna metadata integral de auditoria.

## `public.listar_rotinas` e `public.obter_rotina`

Lista aceita posto, responsável, cargo/função, prioridade, estado, recorrência e
período. Retorna regra legível, próxima ocorrência, responsáveis, versão e
capacidades. Detalhe retorna configuração completa e impacto apenas futuro.

## `public.listar_calendario_tarefas_rotinas`

Entrada:

```json
{
  "p_data_de": "2026-07-01",
  "p_data_ate": "2026-07-31",
  "p_filtros": {}
}
```

Regras:

- Intervalo obrigatório, crescente e máximo de 92 dias.
- Usa os mesmos filtros e escopo de `listar_tarefas`.
- Retorna tarefa por vencimento e execução `prevista` por data.
- Execução `gerada` não aparece novamente como previsão.
- Execução `acumulada` é apresentada junto da tarefa compartilhada.
- Consulta é somente leitura e não materializa nem gera ocorrências.

Tipos de item:

```text
tarefa
ocorrencia_prevista
tarefa_acumulada
```

## `public.listar_opcoes_tarefa_rotina`

Recebe `p_posto_id` e retorna somente usuários elegíveis, cargos/funções ativos e
prioridades ativas que o ator pode usar. Operador não recebe capacidade de
criação por meio desta consulta.

## `public.listar_historico_tarefa_rotina`

Recebe entidade, ID, cursor `(created_at, id)` e limite até 100. Retorna projeção
autorizada com ação, ator/origem automática, valores permitidos, justificativa,
data e contexto. Operador pode consultar histórico específico de item visível,
mas não ganha listagem geral de auditoria.

## `public.resumir_tarefas_dashboard`

Contrato futuro, não consumido pela Central. Retorna totais autorizados de hoje,
pendentes, atrasadas e aguardando validação e agrupamentos por posto,
responsável e status para intervalo validado.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/app/tarefas-rotinas` | Lista, kanban, calendário, filtros e aba Rotinas |
| `/app/tarefas-rotinas/nova` | Nova tarefa para Supervisão/Direção |
| `/app/tarefas-rotinas/:tarefaId` | Detalhe e histórico |
| `/app/tarefas-rotinas/:tarefaId/editar` | Edição autorizada |
| `/app/tarefas-rotinas/rotinas/nova` | Nova rotina |
| `/app/tarefas-rotinas/rotinas/:rotinaId` | Detalhe/edição de rotina |

`tarefas-rotinas` muda para `available`. Todas as rotas passam por
`ProtectedRoute`; RLS/RPC continuam soberanas.

## Estado de URL

- `visualizacao=lista|kanban|calendario`
- `aba=hoje|pendentes|atrasadas|concluidas|rotinas|validacao`
- demais filtros usam query string;
- trocar filtro reinicia cursor;
- voltar do detalhe preserva contexto.

## Estados discriminados

```text
idle
loading
ready
empty_scope
empty_filters
refreshing
saving
conflict
session_expired
access_denied
temporary_failure
```

## Testes obrigatórios

- Mesmos filtros retornam o mesmo conjunto nas três visões.
- URL direta respeita perfil e posto.
- Operador não vê ações proibidas e RPC bloqueia contorno.
- Atraso e acúmulo não viram status.
- Calendário não gera tarefa.
- Vazio, falha, conflito e acesso negado não se confundem.
- Teclado, foco, rótulos e estado não dependem apenas de cor.
