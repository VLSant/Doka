# Contract: Autorização Administrativa

## Route Matrix

| Rota | Operador | Supervisão | Direção/Administração |
| --- | --- | --- | --- |
| `/app/cadastros` | Negado | Disponível em modo leitura/scoped | Disponível |
| `/app/cadastros/usuarios` | Negado | Consulta scoped | Gestão global |
| `/app/cadastros/usuarios/:id` | Negado | Consulta scoped | Gestão global |
| `/app/cadastros/postos` | Negado | Consulta scoped | Gestão global |
| `/app/cadastros/postos/:id` | Negado | Consulta scoped | Gestão global |
| `/app/cadastros/cargos-funcoes` | Negado | Consulta de ativos | Gestão global |
| `/app/cadastros/prioridades` | Negado | Consulta de ativos | Gestão global |
| `/app/cadastros/tipos-ocorrencia` | Negado | Consulta de ativos | Gestão global |
| `/app/cadastros/metas-eficiencia` | Negado | Gestão nos postos do escopo | Gestão global |
| `/app/historico-auditoria` | Negado | Consulta scoped | Consulta global |

## Evaluation Order

1. Confirmar sessão e identidade Auth.
2. Resolver usuário operacional ativo.
3. Revalidar perfil e postos.
4. Validar permissão da rota.
5. Validar entidade/posto da operação.
6. Validar estado persistido e versão.
7. Executar e auditar na mesma transação.

## Database Rules

- Remover `postos_supervisao_update` e
  `usuarios_postos_supervisao_update`.
- Revogar escrita direta de `authenticated` nas sete entidades mutáveis.
- Manter SELECT/RLS necessário à Spec 005 e aos consumidores vigentes.
- RPCs públicas têm `EXECUTE` somente para `authenticated`; `PUBLIC` e `anon`
  são revogados.
- Helpers internos ficam em `app_private`, com `search_path` vazio e execução
  direta revogada quando não usada por policies.
- Nenhuma autorização usa `user_metadata`, perfil ou posto enviados pelo
  cliente.

## Neutral Denial

Recurso inexistente e recurso fora do escopo retornam o mesmo
`acesso_negado` nas consultas de detalhe. A interface não revela existência,
dependências ou estado.

