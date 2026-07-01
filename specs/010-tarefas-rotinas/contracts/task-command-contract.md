# Contract: Comandos de Tarefa

## `public.salvar_tarefa`

Cria quando `p_tarefa_id` é nulo e atualiza quando informado.

Entrada:

```json
{
  "p_tarefa_id": "uuid ou null",
  "p_dados": {
    "titulo": "Conferir pendências",
    "descricao": "Revisar pendências do posto.",
    "tipo": "avulsa|estrategia",
    "posto_id": "uuid",
    "cargo_funcao_id": "uuid ou null",
    "prioridade_id": "uuid",
    "responsaveis_ids": ["uuid"],
    "prazo_data": "2026-07-02",
    "horario_limite": "17:00 ou null",
    "exige_validacao": true,
    "observacoes": "texto opcional"
  },
  "p_versao_esperada": "inteiro ou null"
}
```

Autorização:

- Operador: bloqueado.
- Supervisão: cria/edita somente no próprio escopo.
- Direção/Administração: global.
- Tarefa `rotina`: nunca criada ou convertida manualmente por esta RPC.

Transação:

1. Deriva ator e bloqueia tarefa em edição.
2. Revalida perfil, posto, cadastros ativos e responsáveis elegíveis.
3. Compara versão em edição.
4. Grava tarefa e diferenças de responsáveis por soft delete/inserção.
5. Incrementa versão uma vez e registra eventos de sucesso.
6. Retorna o detalhe atualizado.

Campos de fluxo (`status`, conclusão, validação e reabertura), autoria e
referências de rotina não são aceitos em `p_dados`.

## `public.transicionar_tarefa`

Entrada:

```json
{
  "p_tarefa_id": "uuid",
  "p_acao": "iniciar|concluir|validar|reabrir|retomar",
  "p_versao_esperada": 4,
  "p_justificativa": "obrigatória somente ao reabrir"
}
```

Matriz:

| Ação | De | Para | Ator |
| --- | --- | --- | --- |
| iniciar | pendente | em_andamento | responsável ativo |
| concluir | em_andamento | concluida | qualquer responsável ativo |
| validar | concluida | validada | Supervisão do escopo ou Direção |
| reabrir | concluida/validada | reaberta | Supervisão do escopo ou Direção |
| retomar | reaberta | em_andamento | responsável ativo |

Regras:

- `validar` exige `exige_validacao = true`.
- `reabrir` exige justificativa normalizada de até 1.000 caracteres.
- Operador nunca valida ou reabre.
- Registro removido é bloqueado.
- Linha é bloqueada antes da comparação de versão.
- Se a ação já estiver refletida e o mesmo efeito não exigir nova decisão, a
  RPC retorna o estado atual sem novo evento.
- Outra transição incompatível retorna `transicao_invalida`.
- Concluir tarefa de rotina conclui todas as execuções geradas/acumuladas que
  apontam à tarefa no mesmo commit.

## `public.excluir_tarefa`

Entrada: tarefa, versão esperada e justificativa.

- Supervisão no escopo ou Direção/Administração.
- Preenche campos de soft delete; não muda `status`.
- Preserva responsáveis, execuções e histórico.
- Repetição não cria segundo evento.

## Saída compartilhada

Comandos retornam `tarefa_id`, `status`, `versao`, timestamps relevantes,
responsáveis, acúmulo e capacidades recalculadas.

## Erros estáveis

- `acesso_negado`
- `campos_invalidos`
- `cadastro_inativo`
- `responsavel_invalido`
- `responsavel_duplicado`
- `tarefa_desatualizada`
- `transicao_invalida`
- `justificativa_obrigatoria`
- `registro_removido`
- `falha_temporaria`

IDs inexistentes e inacessíveis convergem para `acesso_negado`.

## Concorrência e repetição

- Primeira mudança na versão N produz N+1.
- Segunda decisão concorrente baseada em N recebe `tarefa_desatualizada`.
- Após resposta incerta, o cliente relê antes de repetir.
- UI nunca reenvia automaticamente após conflito.
- Bloqueio ou falha não cria auditoria de sucesso.

## Testes obrigatórios

- Criar avulsa e estratégia; rejeitar rotina manual.
- Operador bloqueado na criação/edição.
- Responsável/posto/cadastro fora do escopo.
- Todas as transições válidas e inválidas.
- Qualquer um entre vários responsáveis conclui uma única vez.
- Tarefa com validação e sem validação.
- Reabertura preserva eventos antigos.
- Duas sessões na mesma versão.
- Soft delete com justificativa e sem status artificial.
