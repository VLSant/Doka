# Contract: Mutações Administrativas

## Common Input

- Criação: `p_id` UUID gerado pelo cliente, dados allowlisted.
- Atualização/estado/remoção: `p_id`, `p_versao_esperada`.
- Soft delete e remoção de vínculo: `p_justificativa` obrigatória.
- Ator, perfil, postos e campos de controle nunca são aceitos do cliente.

## RPC Groups

| Recurso | Salvar | Estado/remoção |
| --- | --- | --- |
| Usuário | `salvar_usuario_administracao` | `alterar_estado_usuario_administracao` |
| Posto | `salvar_posto_administracao` | `alterar_estado_posto_administracao` |
| Vínculo | `salvar_vinculo_usuario_posto_administracao` | `remover_vinculo_usuario_posto_administracao` |
| Cargo/função | `salvar_cargo_funcao_administracao` | `alterar_estado_cargo_funcao_administracao` |
| Prioridade | `salvar_prioridade_administracao` | `alterar_estado_prioridade_administracao` |
| Tipo de ocorrência | `salvar_tipo_ocorrencia_administracao` | `alterar_estado_tipo_ocorrencia_administracao` |
| Meta | `salvar_meta_eficiencia_administracao` | `alterar_estado_meta_eficiencia_administracao` |

`alterar_estado_*` aceita apenas `ativar`, `inativar` ou
`excluir_logicamente`. Não existe ação `restaurar`.

## Atomic Behavior

1. Resolver ator e autorização.
2. Bloquear recurso/lock administrativo necessário.
3. Ler estado persistido e comparar versão.
4. Validar unicidade, dependências, posto e regras da entidade.
5. Aplicar mudança e campos de controle.
6. Registrar um evento em `historico_auditoria`.
7. Retornar estado, versão e capacidades atuais.

Qualquer falha reverte todos os passos.

## Referential Delete Protection

- A exclusão física de identidade Auth com usuário operacional associado é
  bloqueada por FK `ON DELETE RESTRICT`.
- A exclusão física de usuário ou posto com vínculo em `usuarios_postos` é
  bloqueada por FK `ON DELETE RESTRICT`.
- Nenhuma RPC administrativa oferece DELETE físico.

## Last Administrator

Mudança de perfil, inativação ou soft delete de `direcao_admin` adquire advisory
lock transacional canônico, bloqueia a linha alvo e confirma que outro
administrador válido permanece. A própria identidade não recebe exceção.

## Idempotency

- Repetição de criação com mesmo `p_id` e payload equivalente retorna o registro
  atual sem novo evento.
- Mesmo `p_id` com payload incompatível retorna
  `chave_idempotencia_conflitante`.
- Repetição de estado já alcançado retorna o estado atual sem duplicar evento.
- Após erro de comunicação, o cliente consulta detalhe pelo ID antes de repetir.

## Canonical Errors

| Código | Significado |
| --- | --- |
| `acesso_negado` | Sessão/perfil/escopo inválido |
| `registro_desatualizado` | Versão esperada divergiu |
| `registro_inexistente` | Recurso não encontrado em consulta administrativa autorizada |
| `registro_removido` | Mutação proibida em removido |
| `ultimo_administrador` | Ação deixaria o sistema sem administração |
| `dependencias_ativas` | Ação exige revisão/confirmacão de impactos |
| `duplicidade_ativa` | Identidade, vínculo, nome ou nível conflita |
| `vigencia_sobreposta` | Meta conflita com outra ativa |
| `justificativa_obrigatoria` | Exclusão/remoção sem motivo válido |
| `chave_idempotencia_conflitante` | UUID já usado com outro payload |
| `falha_temporaria` | Falha recuperável |
