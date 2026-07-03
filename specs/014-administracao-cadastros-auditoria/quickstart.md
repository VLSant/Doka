# Quickstart: Validação da Administração, Cadastros e Auditoria

## Purpose

Validar a implementação fim a fim sem duplicar os contratos. Esta feature só
está pronta quando banco, RLS, RPCs, UI e auditoria passam em conjunto.

Testes automatizados de navegador/E2E ficam fora desta execução. A homologação
visual, por teclado, URL direta e viewports será realizada manualmente pelo
usuário a partir dos cenários abaixo.

## Prerequisites

- Node.js 24 LTS e dependências instaladas.
- Projeto Supabase de desenvolvimento vinculado.
- Cinco identidades Auth pré-criadas.
- Usuários operacionais: ao menos dois `direcao_admin`, uma Supervisão e dois
  Operadores.
- Três postos, vínculos dos três níveis e cadastros ativos/inativos/removidos.
- Migration da Spec 014 criada com `supabase migration new
  administracao_cadastros_auditoria` e aplicada no ambiente de teste.

## Static and App Verification

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Esperado: todos concluem sem erro e nenhum segredo aparece no bundle.

## Database Verification

Descobrir comandos na versão instalada:

```powershell
supabase --version
supabase db --help
supabase test --help
```

No ambiente local, quando disponível:

```powershell
supabase db reset
supabase test db
supabase db lint
```

No projeto remoto de desenvolvimento, executar cada teste SQL dentro de
`BEGIN`/`ROLLBACK` e revisar advisors antes de promover a migration.

## Scenario 1 — Permission Matrix

1. Operador abre `/app/cadastros` e `/app/historico-auditoria`.
2. Supervisão abre usuários/postos/vínculos/cargos e tenta alterar cada um.
3. Supervisão cria/edita meta no próprio posto e tenta em posto alheio.
4. Direção/Administração executa gestão global.

Esperado: Operador negado; Supervisão consulta sem escrever fundação, gerencia
somente metas scoped; Direção/Administração gerencia globalmente. URL direta e
RPC direta produzem o mesmo resultado.

## Scenario 2 — Auth Association

1. Criar identidade no painel Auth sem `usuarios`.
2. Listar identidades disponíveis como Direção/Administração.
3. Associar a identidade.
4. Repetir o mesmo pedido e tentar associar a mesma identidade a outro UUID.

Esperado: projeção retorna somente ID/e-mail; primeira associação cria um
usuário; repetição equivalente não duplica; conflito é recusado; nenhum segredo
é retornado.

## Scenario 3 — Last Administrator

Com dois administradores, abrir edições simultâneas e tentar inativar/remover os
dois.

Esperado: no máximo uma operação conclui; ao menos um administrador válido
permanece; operação recusada não registra sucesso.

## Scenario 4 — Concurrency and Idempotency

Para cada recurso:

1. Abrir o mesmo registro em duas sessões.
2. Salvar na primeira.
3. Salvar a versão antiga na segunda.
4. Repetir criação, estado e remoção após simular resposta incerta.

Esperado: versão antiga gera `registro_desatualizado`; estado atual é preservado;
nenhum efeito/evento duplica.

## Scenario 5 — Soft Delete and Dependencies

1. Inativar e depois ativar um cadastro.
2. Excluir logicamente com justificativa.
3. Tentar restaurar.
4. Inativar posto com assistências/importações/metas.

Esperado: inativação e remoção são distintas; removido some da lista padrão;
restauração não existe; dependências são preservadas; não ocorre cascade nem
DELETE físico.

Validar adicionalmente que a tentativa controlada de excluir fisicamente uma
identidade Auth associada, um usuário com vínculos ou um posto com vínculos é
recusada pelas FKs `ON DELETE RESTRICT`.

## Scenario 6 — Audit Scope and Sanitization

Gerar eventos globais, scoped, multi-posto e contendo chaves sensíveis de teste.
Consultar como os três perfis e combinar todos os filtros.

Esperado:

- Direção/Administração vê todos os eventos sanitizados.
- Supervisão vê apenas eventos cujo contexto completo está no próprio escopo.
- Operador é negado.
- Evento sem contexto não aparece à Supervisão.
- Senha, token, segredo, credencial, recovery e `raw_json` nunca aparecem.
- Entidade removida mantém evento sem link inseguro.

## Scenario 7 — UI and Accessibility (homologação manual do usuário)

Validar 1280×720 e 1440×900:

- teclado, foco e diálogos;
- loading, vazio, filtros vazios, erro, conflito e sessão expirada;
- envio duplicado;
- filtros na URL;
- atualização após mutação.

Esperado: todos os fluxos críticos são concluíveis por teclado e nenhum estado
depende somente de cor.

## Performance Acceptance

Com 10.000 itens/eventos no escopo:

- executar listas sem filtro amplo proibido;
- percorrer páginas por cursor;
- combinar busca, estado, posto, período e ação;
- inspecionar planos das consultas críticas.

Esperado: 95% apresentam resultado/progresso em até 2 s; índices são usados nas
colunas de cursor, filtro, FK e RLS; não há OFFSET crescente ou varredura de JSON
como caminho principal.

## Manual Homologation Handoff

Ao concluir a implementação, o executor deve marcar este documento como
`Aguardando homologação manual do usuário`, registrar ambiente/commit validado e
não executar automação de navegador. O usuário preencherá os resultados dos sete
cenários manuais.
