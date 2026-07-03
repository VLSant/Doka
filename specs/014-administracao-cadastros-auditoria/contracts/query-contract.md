# Contract: Consultas Administrativas

## Common Envelope

Listas retornam:

```text
{
  itens: [...],
  proximo_cursor: object | null,
  capacidades: object
}
```

Limite padrão 50, mínimo 1 e máximo 100. Cursor inválido produz
`cursor_invalido`; filtro desconhecido produz `filtros_invalidos`.

## Query RPCs

| RPC | Perfis | Filtros/cursor principais |
| --- | --- | --- |
| `listar_usuarios_administracao` | Supervisão scoped; Direção/Admin global | busca, perfil, ativo, cargo, posto, removidos; nome/id |
| `obter_usuario_administracao` | Supervisão scoped; Direção/Admin global | `usuario_id`; inclui vínculos, cargo, versão e capacidades |
| `listar_identidades_auth_disponiveis` | Direção/Admin | busca; email/id; somente projeção mínima |
| `listar_postos_administracao` | Supervisão scoped; Direção/Admin global | busca, ativo/removido; nome/id |
| `obter_posto_administracao` | Supervisão scoped; Direção/Admin global | `posto_id`; dependências, versão e capacidades |
| `listar_cargos_funcoes_administracao` | Supervisão ativos; Direção/Admin global | busca, estado; nome/id |
| `listar_prioridades_administracao` | Supervisão ativos; Direção/Admin global | busca, estado; nível/id |
| `listar_tipos_ocorrencia_administracao` | Supervisão ativos; Direção/Admin global | busca, estado; nome/id |
| `listar_metas_eficiencia_administracao` | Supervisão scoped; Direção/Admin global | posto, tipo, vigência, estado; início/id |
| `listar_historico_auditoria` | Supervisão scoped; Direção/Admin global | entidade/id, ator, período, ação, módulo, posto e IDs relacionados; data/id |
| `obter_evento_auditoria` | Supervisão scoped; Direção/Admin global | `evento_id`; projeção sanitizada |

## Capabilities

Cada item/detalhe retorna capacidades derivadas no banco, como `editar`,
`ativar`, `inativar`, `excluir_logicamente`, `gerenciar_vinculos` e
`abrir_relacionado`. A UI pode ocultar ações por capacidade, mas a RPC de
mutação revalida tudo.

## Removed Records

- Padrão: removidos ocultos.
- Apenas Direção/Administração pode pedir inclusão de removidos.
- Supervisão nunca recebe removidos de usuários, postos, vínculos ou cargos.
- Registros relacionados removidos podem aparecer como resumo histórico sem
  habilitar ação.

## Related Navigation

Evento retorna `destino` apenas quando o módulo existe e a autorização atual
permite. A abertura da rota revalida novamente; o destino não funciona como
token de acesso.

