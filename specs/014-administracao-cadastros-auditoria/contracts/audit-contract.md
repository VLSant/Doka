# Contract: Histórico e Auditoria Administrativa

## Source

`historico_auditoria` é a única fonte. Não existe tabela, cache persistente ou
histórico por módulo paralelo.

## Required Administrative Actions

- `criado`
- `atualizado`
- `ativado`
- `inativado`
- `perfil_alterado`
- `cargo_alterado`
- `vinculo_posto_criado`
- `vinculo_posto_alterado`
- `vinculo_posto_removido`
- `excluido_logicamente`

Tentativa bloqueada só gera evento se houver ação canônica vigente e segura;
nunca gera ação de sucesso.

## Event Context

Todo evento novo recebe:

- entidade e identificador;
- módulo canônico;
- ator derivado;
- valores anterior/novo allowlisted;
- postos afetados quando comprováveis;
- IDs relacionados quando comprováveis;
- data/hora do banco.

Evento global possui `postos_contexto` vazio e não aparece para Supervisão.
Evento multi-posto só aparece se todos os postos estiverem no escopo atual.

## Sanitization

Lista e detalhe removem recursivamente chaves equivalentes a:

- senha/password;
- token, refresh/access token;
- segredo/secret;
- credencial;
- recovery code/verifier/authorization;
- chave secreta/service role;
- `raw_json` e `raw_json_resumo`.

Campos desconhecidos não são liberados automaticamente: metadata exibida usa
allowlist por módulo e o restante fica oculto.

## Immutability

- `authenticated` não possui INSERT, UPDATE, DELETE, TRUNCATE ou SELECT direto
  na tabela.
- Escrita ocorre somente por triggers/helpers controlados.
- Leitura de aplicação ocorre pelas RPCs sanitizadas.
- Eventos não recebem soft delete.

## Pagination and Filters

Cursor: `created_at desc, id desc`.

Filtros combináveis:

- `entidade_tipo`, `entidade_id`;
- `usuario_id`;
- `criado_de`, `criado_ate`;
- `acao`, `modulo`;
- `posto_id`;
- `assistencia_id`, `ocorrencia_id`, `tarefa_id`,
  `lote_importacao_id`.

Filtros sempre reduzem o conjunto após a regra de visibilidade.

## Related Entity

O detalhe pode retornar rota/label da entidade relacionada. O link é omitido se
o módulo não existe ou se a autorização não pode ser comprovada. Ao navegar, a
rota e a consulta de destino revalidam acesso.

