# Data Model: Administração, Cadastros, Usuários, Permissões e Auditoria

## Design Rule

Todas as entidades de domínio já existem. A feature não cria tabela de usuário,
posto, permissão, cadastro ou histórico. A migration apenas estende controles
técnicos necessários à interface segura.

## Shared Versioning

As tabelas `usuarios`, `postos`, `usuarios_postos`, `cargos_funcoes`,
`prioridades`, `tipos_ocorrencia` e `metas_eficiencia` recebem:

- `versao_registro bigint not null default 1`;
- check `versao_registro > 0`;
- trigger BEFORE UPDATE que define `new.versao_registro =
  old.versao_registro + 1`, sem aceitar versão do cliente.

Toda mutação de registro existente exige `versao_esperada`. Divergência produz
`registro_desatualizado` e nenhuma mudança/auditoria de sucesso.

## Existing Entity Extensions

### usuarios

`auth_user_id` continua obrigatório, único entre não removidos e referenciado a
`auth.users`. A FK passa de `ON DELETE CASCADE` para `ON DELETE RESTRICT`.

Extensão: `versao_registro`.

Regras adicionais:

- Criação associa identidade Auth existente e ainda não associada.
- Não cria, convida ou edita identidade Auth.
- `email` operacional é preenchido pela projeção segura da identidade, não
  aceito como prova livre do cliente.
- Alterar perfil, inativar ou remover `direcao_admin` usa lock global e não pode
  eliminar o último administrador válido.
- Removido não pode ser restaurado nesta feature.
- Excluir uma identidade em `auth.users` enquanto existir o cadastro
  operacional é bloqueado; primeiro deve-se inativar ou remover logicamente o
  usuário conforme o fluxo aprovado, sem DELETE físico.

Estados:

- Ativo: `ativo = true and deleted_at is null`.
- Inativo: `ativo = false and deleted_at is null`.
- Removido: `deleted_at is not null`.

### postos

Extensão: `versao_registro`.

Regras adicionais:

- Supervisão perde qualquer policy de escrita e mantém consulta scoped.
- Inativação/soft delete retorna resumo de dependências antes da confirmação.
- Não há cascade; dependências permanecem.
- Removido não é reativável/restaurável.

### usuarios_postos

Extensões:

- `updated_at timestamptz not null default now()`;
- `updated_by uuid null references usuarios(id) on delete set null`;
- `versao_registro`.

Integridade referencial:

- `usuario_id -> usuarios.id ON DELETE RESTRICT`;
- `posto_id -> postos.id ON DELETE RESTRICT`;
- nenhuma exclusão física indireta por cascade.

Regras adicionais:

- Direção/Administração é o único perfil que cria, muda nível ou remove.
- Unique parcial vigente `(usuario_id, posto_id) where deleted_at is null`
  continua soberana.
- Usuário e posto precisam estar ativos e não removidos.
- Soft delete revoga o acesso e exige justificativa.
- Restauração fica indisponível.

### cargos_funcoes

Extensão: `versao_registro`.

Regras adicionais:

- Gestão exclusiva de Direção/Administração.
- Nome normalizado equivalente não pode duplicar registro vigente.
- Inativação/remoção não reescreve consumidores.

### prioridades

Extensão: `versao_registro`.

As validações, índices e regras da Spec 002 permanecem: nome e nível ativos
únicos, cor válida, gestão global exclusiva de Direção/Administração.

### tipos_ocorrencia

Extensão: `versao_registro`.

As validações e regras da Spec 002 permanecem. Reclamação continua sendo tipo de
ocorrência.

### metas_eficiencia

Extensão: `versao_registro`.

Permanecem:

- percentual `(0,100]`;
- vigência final maior ou igual à inicial;
- exclusão de sobreposição ativa por posto/tipo/período;
- posto ativo e não removido na criação/reativação;
- gestão global de Direção/Administração e scoped de Supervisão.

## historico_auditoria

Fonte central existente e append-only.

Novos campos:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `modulo` | text | Classificação canônica; `outros` quando não reconhecido |
| `postos_contexto` | uuid[] | Default vazio; todos os postos afetados pelo evento |
| `assistencia_id` | uuid nullable | Contexto normalizado, sem FK para preservar evento |
| `ocorrencia_id` | uuid nullable | Contexto futuro/normalizado, sem FK |
| `tarefa_id` | uuid nullable | Contexto futuro/normalizado, sem FK |

`lote_importacao_id` existente continua sendo o contexto de importação.

Não são criadas FKs nos campos de contexto: o evento precisa sobreviver à
ausência, remoção lógica ou futura indisponibilidade da entidade relacionada.

### Context Normalization

Trigger BEFORE INSERT interno:

- deriva `modulo` de `entidade_tipo`;
- deriva postos da própria entidade, metadata validada e relações conhecidas;
- deriva assistência/lote quando a relação é inequívoca;
- nunca aceita contexto do navegador como prova de autorização;
- mantém array vazio quando não consegue provar contexto.

Backfill conservador aplica as mesmas regras a eventos existentes. Falha em
resolver não inventa contexto.

### Audit Visibility

- Direção/Administração: todos os eventos, sempre pela projeção sanitizada.
- Supervisão: somente eventos operacionais com `postos_contexto` não vazio e
  integralmente contido nos postos atuais de supervisão.
- Operador: sem consulta geral.
- Evento global ou contexto vazio: invisível à Supervisão.

### Audit Indexes

- `(created_at desc, id desc)`;
- `(usuario_id, created_at desc, id desc)`;
- `(acao, created_at desc, id desc)`;
- `(modulo, created_at desc, id desc)`;
- GIN em `postos_contexto`;
- parciais em `assistencia_id`, `ocorrencia_id`, `tarefa_id` e
  `lote_importacao_id` quando não nulos.

## Auth Identity Projection

Não é tabela nova. RPC administrativa consulta `auth.users` e retorna somente:

- `auth_user_id`;
- `email`;
- indicador `ja_associada`.

São excluídos senha, confirmação, tokens, sessões, telefones, metadata, fatores
e quaisquer credenciais.

## State Transition Matrix

| Origem | Ação | Destino | Permitido |
| --- | --- | --- | --- |
| Ativo | Inativar | Inativo | Conforme matriz e dependências |
| Inativo | Ativar | Ativo | Revalidando unicidade/dependências |
| Ativo/Inativo | Soft delete | Removido | Direção/Administração; justificativa |
| Removido | Restaurar | — | Não permitido no MVP |
| Vínculo vigente | Remover | Vínculo removido | Direção/Administração; justificativa |
| Vínculo removido | Restaurar | — | Não permitido no MVP |

## Mutation Invariants

- Ator sempre derivado da sessão.
- Campos `created_by`, `updated_by`, `deleted_by`, timestamps e versão são
  definidos no banco.
- Criação usa UUID fornecido pelo cliente para repetição segura.
- Mesmo UUID + mesmo estado desejado devolve estado atual; UUID + payload
  incompatível produz `chave_idempotencia_conflitante`.
- Auditoria é escrita na mesma transação e somente após validações.
- Erro/rollback não gera evento de sucesso.
