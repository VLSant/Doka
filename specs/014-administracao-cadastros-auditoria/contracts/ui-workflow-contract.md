# Contract: Fluxos da Interface Administrativa

## Navigation

`Cadastros` torna-se disponível para Supervisão e Direção/Administração.
`Histórico / Auditoria` torna-se disponível para os mesmos perfis. Subnavegação
mostra somente recursos permitidos.

## List State Machine

```text
idle -> loading -> ready
                -> empty_scope
                -> empty_filters
                -> access_denied
                -> session_expired
                -> temporary_failure

ready -> refreshing -> ready | conflict | temporary_failure
```

Filtros válidos são serializados na URL. Limpar filtros preserva apenas o estado
padrão da entidade.

## Form State Machine

```text
clean -> dirty -> validating -> saving -> saved
                              -> field_error
                              -> conflict
                              -> access_denied
                              -> session_expired
                              -> temporary_failure
```

- Um envio em andamento desabilita novo envio.
- Falha recuperável preserva campos não sensíveis.
- Conflito preserva rascunho, mostra a versão atual e oferece recarregar.
- Mudança de autorização encerra a edição e remove dados não autorizados.

## Destructive Actions

Diálogo apresenta:

- ação exata: inativar ou excluir logicamente;
- entidade;
- dependências/impactos conhecidos;
- distinção entre inativação e soft delete;
- justificativa obrigatória quando crítica;
- confirmação explícita.

Não existe ação de restauração.

## Accessibility

- Labels e mensagens associados aos controles.
- Primeiro erro recebe foco após validação.
- Diálogo retém foco e devolve ao acionador.
- Tabelas possuem cabeçalhos; ações têm nomes acessíveis.
- Estado, ativo/inativo/removido e resultado não dependem somente de cor.
- Fluxos críticos funcionam em 1280×720 e 1440×900 por teclado.

## Audit Detail

Valores anterior e novo são apresentados por campo conhecido. JSON desconhecido
não é despejado bruto; aparece somente a projeção allowlisted. Entidade
removida/inexistente mantém o evento e mostra destino indisponível.

