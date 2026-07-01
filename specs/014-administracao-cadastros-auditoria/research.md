# Research: Administração, Cadastros, Usuários, Permissões e Auditoria

## 1. Arquitetura da área administrativa

**Decision**: Manter a SPA React falando diretamente com RPCs PostgreSQL
autenticadas pelo cliente Supabase publicável.

**Rationale**: É o padrão já adotado nas Specs 005, 007 e 008. RLS continua como
defesa em profundidade, enquanto RPCs permitem autorização, validação,
concorrência, mudança e auditoria na mesma transação.

**Alternatives considered**:

- Edge Function/backend: rejeitado por adicionar implantação e segredo sem
  necessidade para cinco usuários.
- Escrita direta nas tabelas: rejeitada porque permite contornar validações
  atômicas, proteção do último administrador e contrato de versão.

## 2. Associação com Supabase Auth

**Decision**: Identidades serão criadas manualmente no painel do Supabase Auth.
A aplicação terá RPC exclusiva de Direção/Administração que lista somente `id` e
`email` de identidades ainda não associadas e RPC separada para criar o registro
em `usuarios`.

**Rationale**: Implementa `Q1: B`, evita Admin API/service role no navegador e
oferece uma seleção utilizável sem expor metadata, sessões ou credenciais.

**Alternatives considered**:

- Digitar UUID manualmente: seguro, mas sujeito a erro e inadequado ao
  formulário.
- Criar/convidar pela aplicação: fora da decisão aprovada.
- Expor `auth.users`: rejeitado; somente projeção mínima via função estreita.

## 3. Matriz da Supervisão

**Decision**: Remover policies de UPDATE de Supervisão em `postos` e
`usuarios_postos`; manter SELECT por escopo. Cargos/funções continuam somente
consulta de ativos. Metas continuam com gestão scoped da Spec 002.

**Rationale**: O schema atual diverge de `Q2: A`. A spec mais recente e
específica prevalece.

**Alternatives considered**:

- Apenas esconder botões: rejeitado porque não fecha acesso direto.
- Manter policies legadas: rejeitado por ampliar permissão.

## 4. Fronteira de mutação

**Decision**: Revogar INSERT/UPDATE direto de `authenticated` nas sete entidades
administrativas e publicar RPCs por recurso/ação. Toda função deriva ator de
`auth.uid()`, valida perfil/escopo e usa `search_path = ''`, allowlist de campos,
grants mínimos e transação única.

**Rationale**: Evita atualização de colunas de controle pelo cliente e garante
que mudança e auditoria sejam indivisíveis.

**Alternatives considered**:

- RPC genérica que recebe tabela/coluna: rejeitada por superfície ampla e baixa
  testabilidade.
- `service_role` no browser: proibido.

## 5. Concorrência e repetição

**Decision**: Adicionar `versao_registro bigint` monotônica às sete entidades.
Criações recebem UUID gerado no cliente; repetições com o mesmo ID devolvem o
estado equivalente ou conflito. Atualizações, estados e soft delete exigem
versão esperada. Resposta incerta provoca releitura antes de repetir.

**Rationale**: Cobre clique duplo, repetição e edição concorrente sem criar uma
tabela de operações paralela.

**Alternatives considered**:

- Apenas `updated_at`: rejeitado por empates e semântica imprecisa.
- Tabela de idempotência: rejeitada como complexidade desnecessária para este
  volume e escopo.

## 6. Proteção do último administrador

**Decision**: Toda alteração que possa retirar perfil/estado de
`direcao_admin` usa `pg_advisory_xact_lock` com chave constante, bloqueia a linha
alvo, reconta administradores válidos e só então altera.

**Rationale**: Um lock apenas na linha alvo não impede duas desativações
simultâneas de administradores diferentes.

**Alternatives considered**:

- Contagem sem serialização: rejeitada por condição de corrida.
- Linha/tabela artificial de lock: rejeitada; advisory lock transacional é
  suficiente e liberado no commit/rollback.

## 7. Contexto e sanitização da auditoria

**Decision**: Estender `historico_auditoria` com `modulo`,
`postos_contexto uuid[]`, `assistencia_id`, `ocorrencia_id` e `tarefa_id`;
reutilizar `lote_importacao_id`. Um trigger interno preenche contexto conhecido,
e um backfill conservador normaliza eventos existentes. Contexto desconhecido
permanece vazio e nunca é mostrado à Supervisão.

**Rationale**: Permite filtros indexáveis e visibilidade scoped sem interpretar
JSON arbitrário a cada linha. Continua sendo a mesma fonte histórica.

**Alternatives considered**:

- Nova tabela de índice/histórico: rejeitada por criar fonte paralela.
- Confiar apenas em `metadata.posto_id`: rejeitado por UUID inválido, eventos
  multi-posto, filtros futuros e risco de ampliar visibilidade.
- Resolver sempre por joins à entidade atual: rejeitado porque entidades podem
  estar removidas ou ainda não existir.

## 8. Leitura da auditoria

**Decision**: Revogar SELECT direto de `authenticated` sobre a tabela e expor
lista/detalhe por RPCs que sanitizam recursivamente chaves sensíveis e `raw_json`.
Direção/Administração vê o conjunto global sanitizado; Supervisão exige contexto
de posto não vazio e integralmente contido em seu escopo; Operador é bloqueado.

**Rationale**: RLS restringe linhas, mas não impede que JSON autorizado contenha
campo proibido. A projeção segura é necessária.

**Alternatives considered**:

- Sanitização apenas no React: rejeitada porque a Data API continuaria expondo.
- Column privileges isoladas: insuficientes para remover chaves dentro de JSON.

## 9. Consultas e índices

**Decision**: Listas usam filtros explícitos, limites 1–100 e cursores estáveis.
Auditoria usa `(created_at desc, id desc)`. Busca textual normalizada usa
`pg_trgm` já instalado. Serão adicionados apenas índices comprovadamente
alinhados a filtros, FKs e RLS.

**Rationale**: Evita OFFSET crescente e segue recomendações Supabase de filtrar
explicitamente e indexar colunas de policies.

**Alternatives considered**:

- Paginação por OFFSET: rejeitada por instabilidade e custo crescente.
- GIN amplo em todo JSON: rejeitado por custo de escrita e baixa seletividade.

## 10. Interface e rotas

**Decision**: Tornar `/app/cadastros` e `/app/historico-auditoria` disponíveis e
criar subrotas lazy-loaded. Filtros ficam na URL; formulários usam primitives
Doka existentes; ações destrutivas usam diálogo com impacto e justificativa.

**Rationale**: Preserva o roteador/guard/menu da Spec 005 e os padrões de estado
das Specs 007/008.

**Alternatives considered**:

- Uma única tela monolítica: rejeitada por acoplamento e baixa testabilidade.
- Novo sistema de componentes: rejeitado; design system vigente é suficiente.

## 11. Verificação Supabase

**Decision**: Criar a migration com `supabase migration new`, validar primeiro
em ambiente local quando disponível e depois no projeto remoto de
desenvolvimento; executar testes transacionais, lint e advisors.

**Rationale**: O schema remoto foi inspecionado sem mutação e confirmou 5
usuários, entidades existentes, RLS habilitada e as duas policies conflitantes.
Mudanças reais pertencem à implementação.

**Alternatives considered**:

- Aplicar DDL remoto durante o planejamento: rejeitado; esta fase produz apenas
  design.

## 12. Integridade referencial sem exclusão em cascata

**Decision**: Substituir as FKs legadas
`usuarios.auth_user_id -> auth.users.id`,
`usuarios_postos.usuario_id -> usuarios.id` e
`usuarios_postos.posto_id -> postos.id` de `ON DELETE CASCADE` para
`ON DELETE RESTRICT`.

**Rationale**: As entidades usam soft delete e precisam preservar vínculos,
autoria e histórico. Uma exclusão manual no painel Auth ou no banco não pode
apagar fisicamente o cadastro operacional ou seus vínculos.

**Alternatives considered**:

- Manter cascade porque DELETE não é concedido ao cliente: rejeitado, pois uma
  exclusão administrativa externa à SPA ainda acionaria o cascade.
- `ON DELETE SET NULL`: rejeitado porque identidade, usuário e posto são
  obrigatórios no vínculo vigente e a nulificação perderia integridade.
