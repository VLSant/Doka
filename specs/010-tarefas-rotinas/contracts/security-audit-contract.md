# Contract: Segurança, RLS e Auditoria de Tarefas e Rotinas

## Matriz de acesso

| Ator | Consulta | Tarefa manual | Execução | Rotina | Validar/reabrir | Soft delete |
| --- | --- | --- | --- | --- | --- | --- |
| Sem perfil ativo | Não | Não | Não | Não | Não | Não |
| Operador | Postos vinculados | Não cria/edita | Somente como responsável | Não administra | Não | Não |
| Supervisão | Postos com vínculo `supervisao` | Cria/edita no escopo | Consulta no escopo | Administra no escopo | No escopo | Com justificativa |
| Direção/Admin | Global | Global | Global | Global | Global | Com justificativa |

## RLS

- Habilitada em `tarefas`, `tarefa_responsaveis`, `rotinas`,
  `rotina_responsaveis` e `rotina_execucoes`.
- `anon` não recebe acesso.
- Usuário sem `usuarios` ativo não lê linhas.
- Policies usam helpers vigentes de perfil/posto e colunas indexadas.
- Linhas filhas herdam escopo da tarefa ou rotina pai.
- Soft-deleted não aparece nas consultas operacionais.
- UPDATE, INSERT e DELETE diretos da SPA permanecem revogados.

## RPCs

- Entradas nunca aceitam ator ou perfil.
- Posto informado como dado sempre é revalidado.
- Funções privilegiadas usam `search_path = ''` e nomes qualificados.
- `PUBLIC` e `anon` perdem `EXECUTE`; `authenticated` recebe apenas RPCs
  públicas necessárias.
- Funções do job e helpers ficam em schema não exposto e sem execução web.
- Nenhuma chave secreta ou `service_role` chega ao navegador.

## Eventos obrigatórios

| Entidade | Eventos |
| --- | --- |
| Tarefa | criação, edição, prazo, início, conclusão, validação, reabertura, soft delete |
| Responsável da tarefa | adição e remoção |
| Rotina | criação, edição, pausa, reativação, inativação, soft delete |
| Responsável da rotina | adição e remoção |
| Execução | previsão, geração, acúmulo, conclusão, cancelamento |

Cada evento inclui entidade, ID, ação, ator quando humano, data/hora,
antes/depois quando aplicável, justificativa, posto e contexto mínimo.

Eventos automáticos:

- `usuario_id` nulo;
- `metadata.origem = supabase_cron`;
- rotina, versão, posto e data prevista;
- nenhuma credencial, token ou comando cron integral.

## Garantias

1. Auditoria é gravada somente após operação de domínio bem-sucedida.
2. Rollback remove também o evento da operação revertida.
3. Repetição sem novo efeito não cria evento.
4. Histórico não é apagado por soft delete.
5. `rotina_execucoes` não duplica `historico_auditoria`.
6. Operador vê apenas projeção de histórico de item autorizado, nunca listagem
   geral.
7. ID inexistente e fora do escopo têm resposta neutra.
8. Alteração de perfil/vínculo produz efeito na próxima consulta ou mutação.

## Cenários de segurança

- Operador tenta criar tarefa, editar prazo, validar, reabrir ou remover.
- Operador responsável e não responsável tentam concluir.
- Supervisão tenta mover tarefa/rotina para posto fora do escopo.
- Perfil ou vínculo é removido entre leitura e gravação.
- URL direta e chamada RPC usam ID de outro posto.
- Função privada é chamada por `anon` ou `authenticated`.
- Cliente tenta informar outro ator.
- Tarefa/rotina removida recebe comando.
- Histórico de outro posto é consultado diretamente.
- Job automático executa sem sessão de usuário e mantém escopo interno limitado
  à função privada.

## Verificação

- Inspecionar grants e RLS no catálogo.
- Executar testes com usuários dos três perfis e ao menos três postos.
- Executar Supabase security/performance advisors.
- Confirmar ausência de chave privilegiada no build.
- Confirmar índices de FKs, policies, filtros, cursores e job.
