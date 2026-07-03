# Guia de Automação E2E — Sistema Doka (Specs 006–008)

Este documento é o insumo completo para a IA do Antigravity executar os testes E2E
do sistema interno Doka. Ele contém tudo o que é necessário para rodar os testes
corretamente, sem depender de outros arquivos do repositório.

---

## 1. Visão geral do sistema

O sistema é uma SPA React com autenticação via Supabase. Funciona em dois módulos
principais:

- **Importações MMS** — gerencia lotes de importação de arquivos CSV/XLSX com dados
  de assistências técnicas.
- **Assistências MMS** — exibe e permite corrigir os dados das assistências gerados
  pelas importações.

A URL base local é `http://localhost:5173` (dev) ou `http://localhost:4173` (preview
após build). Os testes devem usar a URL de preview.

---

## 2. Divisão de ferramentas

### O que o Playwright automatiza (já criado)

Os arquivos abaixo já existem no repositório em `tests/e2e/` e cobrem cenários
determinísticos com seed fixo:

| Arquivo | O que cobre |
|---|---|
| `assistencias-mms.spec.ts` | Bloqueio de acesso, lista/filtros/URL, removidas, detalhe em dois níveis, correção com validações, campos proibidos, posto alheio, histórico + link para lote |
| `importacoes-mms.spec.ts` | Bloqueio de acesso, lista/filtros, detalhe com abas, permissões por perfil, erro pendente bloqueia conclusão, diálogo de reprocessar, layout sem overflow |
| `accessibility.spec.ts` | axe-core WCAG nas páginas de lista/detalhe de ambos os módulos |

Para rodar o Playwright:
```
npm run build && npm run preview &
npx playwright test --project=desktop-chromium
```

### O que o TestSprite deve executar (este guia)

O TestSprite deve cobrir os cenários que o Playwright **não cobre** — aqueles que
dependem de comportamento emergente, dois usuários simultâneos, instabilidade de
rede ou massa de dados descartável:

| ID | Cenário | Por que é TestSprite e não Playwright |
|---|---|---|
| TS-07-A | Conflito de versão entre dois editores (Spec 007) | Requer duas sessões simultâneas no mesmo campo |
| TS-07-B | Resposta de rede incerta durante reprocessamento | Requer controle de conectividade no meio da operação |
| TS-07-C | Desfazer lote com análise desatualizada | Requer alterar estado entre análise e confirmação; massa descartável |
| TS-07-D | Duplo clique em confirmar reprocessamento | Teste de idempotência de ação rápida |
| TS-08-A | Conflito de correção sem perda de rascunho (Spec 008) | Dois usuários editando o mesmo campo |
| TS-08-B | Sessão expirada durante correção com rascunho preenchido | Simular expiração de token mid-flow |
| TS-08-C | Falha de rede durante filtragem e retry | Simular offline com ação de "Tentar novamente" |
| TS-KB | Navegação completa por teclado nos dois módulos | Validação de foco, tab-trapping, Escape e retorno de foco |

---

## 3. Credenciais e usuários de teste

### URL da aplicação

```
http://localhost:5173
```

### Contas disponíveis no seed

| Perfil | E-mail | Senha | Acesso |
|---|---|---|---|
| Operador operacional | `operador@doka.test` | `doka123` | Posto A — pode corrigir linhas do próprio posto |
| Supervisão | `supervisao@doka.test` | `doka123` | Posto A e B — pode concluir, reprocessar e desfazer |
| Direção/Administração | `direcao@doka.test` | `doka123` | Escopo global — todas as ações em todos os lotes |
| Sem perfil | `sem-perfil@doka.test` | `doka123` | Bloqueado — não acessa nenhuma rota protegida |
| Usuário inativo | `inativo@doka.test` | `doka123` | Bloqueado — conta desativada |

> Não existe no seed padrão um usuário com vínculo `consulta` pronto. Para o
> cenário TS-08-A e E2E-08-05, use o Operador operacional (`operador@doka.test`)
> como o perfil de menor privilégio disponível, ou crie manualmente um segundo
> usuário com `nivel_acesso = 'consulta'` no banco antes de executar.

---

## 4. Dados de referência (IDs determinísticos do seed)

### Lotes de importação (Spec 007)

| Lote | UUID | Situação |
|---|---|---|
| Predecessor do Posto A | `70000000-0000-4000-8000-000000000001` | Processado com sucesso |
| Lote atual multi-posto com erro | `70000000-0000-4000-8000-000000000002` | Com erro — lote principal dos testes |
| Lote do Posto B para desfazer | `70000000-0000-4000-8000-000000000003` | Elegível para desfazer |

### Postos

| Posto | UUID |
|---|---|
| Posto A | `40000000-0000-0000-0000-000000000001` |
| Posto B | `40000000-0000-0000-0000-000000000002` |

### Assistência de referência (Spec 008)

- **Número:** `ASS-100`
- **Posto:** Posto A
- **Data:** 24/06/2026
- **Cliente vigente (após seed):** `Cliente A corrigido no Doka`
- **Situação:** ativo, com múltiplas partes, pelo menos uma parte removida
- **UUID:** obtido navegando para `/app/assistencias-mms`, buscando `ASS-100` e
  copiando o ID da URL de detalhe (não é fixo no seed, é gerado pelo processamento
  do lote)

### Massa de desempenho

O seed cria 10.000 assistências com números `PERF-00001` a `PERF-10000` no Posto A,
datas distribuídas entre 2026-01-01 e 2026-06-29, status alternando Pendente (30%)
e Concluída (70%).

---

## 5. Cenários detalhados para o TestSprite

### TS-07-A — Conflito de versão entre dois editores (Spec 007)

**Objetivo:** verificar que quando dois usuários tentam corrigir o mesmo campo de
staging ao mesmo tempo, o segundo recebe conflito de versão, não sobrescreve o
primeiro e mantém o texto digitado.

**Perfis:** Sessão A = `direcao@doka.test`, Sessão B = `supervisao@doka.test`
(ou dois contextos de navegador com o mesmo perfil)

**Passos:**
1. Abrir em dois contextos independentes (janela normal + janela anônima):
   `/app/importacoes-mms/70000000-0000-4000-8000-000000000002/tratamento`
2. Em ambas as sessões, abrir o editor do mesmo campo na mesma linha de erro.
3. Na sessão A, preencher um valor diferente do valor atual e salvar.
4. Confirmar que sessão A exibe sucesso.
5. Na sessão B, sem recarregar, preencher um valor diferente e tentar salvar.
6. Confirmar que sessão B **não** salva silenciosamente.

**Aprova se:**
- Sessão A salva com sucesso.
- Sessão B recebe aviso explícito de conflito de versão (texto visível, não só cor).
- O texto que o usuário B digitou **permanece visível** no campo após o conflito
  (não é apagado).
- Ao recarregar a sessão B, o valor de A é o que aparece como atual.

---

### TS-07-B — Resposta de rede incerta durante reprocessamento (Spec 007)

**Objetivo:** verificar que a interface não declara sucesso falso quando a rede cai
durante uma operação de reprocessamento, e que ao voltar online ela permite
consultar o estado real sem criar uma operação duplicada.

**Perfil:** `direcao@doka.test`

**Pré-requisito:** usar um lote em estado que permita reprocessamento (não o lote
`70000000-0000-4000-8000-000000000002` com erro pendente — use o lote após corrigir
todos os erros, ou use massa descartável).

**Passos:**
1. Abrir o detalhe de um lote elegível para reprocessamento.
2. Clicar em **Reprocessar** e abrir o diálogo de confirmação.
3. Clicar em confirmar.
4. Imediatamente após o clique, simular queda de rede (ferramenta de throttling do
   TestSprite ou equivalente).
5. Aguardar o timeout ou mensagem de erro.
6. Restaurar a conectividade.
7. Seguir a orientação que a interface apresentar (geralmente "Consultar lote" ou
   "Tentar novamente").
8. Recarregar o detalhe do lote.

**Aprova se:**
- A interface **não** exibe "Reprocessado com sucesso" enquanto offline.
- Há mensagem indicando incerteza e orientação para consultar o lote.
- Ao recarregar, existe no máximo **uma** operação de reprocessamento registrada,
  nunca duas para o mesmo intervalo de tempo.
- O estado do lote é consistente (não fica em estado intermediário indefinido).

---

### TS-07-C — Desfazer lote com análise desatualizada (Spec 007)

**Objetivo:** verificar que se o estado do lote muda entre a análise de elegibilidade
e a confirmação do desfazer, a análise antiga é rejeitada.

**Perfil:** Sessão principal = `direcao@doka.test`, Sessão secundária =
`supervisao@doka.test`

**Pré-requisito:** lote `70000000-0000-4000-8000-000000000003` elegível para desfazer.
Este teste consome o lote — reaplicar o seed depois se precisar repetir.

**Passos — parte 1 (validações de formulário):**
1. Abrir o lote `70000000-0000-4000-8000-000000000001` (inelegível para desfazer).
2. Clicar em **Analisar desfazer**.
3. Confirmar que os motivos de bloqueio aparecem em texto, não apenas visualmente.
4. Tentar confirmar — deve ser impossível (botão desabilitado ou ausente).

**Passos — parte 2 (análise desatualizada):**
1. Abrir o lote `70000000-0000-4000-8000-000000000003` como `direcao@doka.test`.
2. Clicar em **Analisar desfazer** e obter a análise de elegibilidade.
3. **Sem confirmar**, abrir em outra sessão (como `supervisao@doka.test`) o mesmo
   lote e executar uma ação que mude seu estado (por exemplo: reprocessar, se
   possível, ou qualquer operação de escrita).
4. Voltar à sessão principal e tentar confirmar o desfazer com a análise original.
5. A confirmação deve ser rejeitada com mensagem de análise desatualizada.
6. Analisar novamente.
7. Preencher justificativa válida (mínimo 10 caracteres).
8. Confirmar o desfazer.

**Aprova se:**
- Lote inelegível exibe motivos de bloqueio em texto.
- Análise antiga é rejeitada após mudança de estado (não aceita a assinatura velha).
- Justificativa com menos de 10 caracteres é bloqueada com mensagem.
- Após desfazer confirmado: lote fica com status `Cancelado`.
- O arquivo original, as linhas de staging, as correções anteriores e o histórico
  de auditoria **não são excluídos** — apenas o efeito nas assistências é revertido.
- O lote predecessor do Posto A é restaurado como lote ativo daquele posto/data.

---

### TS-07-D — Duplo clique rápido em confirmar reprocessamento (Spec 007)

**Objetivo:** verificar que clicar duas vezes rapidamente no botão de confirmação
não gera duas operações de reprocessamento.

**Perfil:** `direcao@doka.test`

**Passos:**
1. Abrir um lote elegível para reprocessamento.
2. Clicar em **Reprocessar** para abrir o diálogo.
3. Clicar duas vezes muito rapidamente no botão de confirmação (duplo clique ou
   dois cliques em sequência rápida).
4. Aguardar a conclusão.
5. Abrir a aba de **Operações** ou **Auditoria** do lote.

**Aprova se:**
- Existe exatamente **uma** operação de reprocessamento registrada.
- O botão fica desabilitado/indisponível após o primeiro clique (visual de loading).
- Não há estado de erro nem operação duplicada.

---

### TS-08-A — Conflito de correção sem perda de rascunho (Spec 008)

**Objetivo:** verificar que quando dois usuários tentam corrigir o mesmo campo da
mesma assistência, o segundo recebe aviso de conflito sem perder o que digitou.

**Assistência:** `ASS-100`, Posto A, data 24/06/2026
**Perfis:** Sessão A = `direcao@doka.test`, Sessão B = `direcao@doka.test` (ou
`operador@doka.test` no próprio posto)

**Campo a usar:** Cliente (nível da assistência)

**Passos:**
1. Abrir `ASS-100` em duas sessões independentes.
2. Em ambas as sessões, clicar em **Corrigir** no campo Cliente.
3. Na sessão A: preencher `Cliente novo A` e justificativa `Teste de conflito sessão A`. Salvar.
4. Confirmar que sessão A exibe sucesso e o vigente atualiza para `Cliente novo A`.
5. Na sessão B: sem recarregar, preencher `Cliente novo B` e justificativa
   `Teste de conflito sessão B`. Tentar salvar.

**Aprova se:**
- Sessão B **não** salva silenciosamente.
- Sessão B exibe aviso visível de conflito de versão (texto, não só cor).
- O campo de **valor** na sessão B ainda contém `Cliente novo B` (não apaga o rascunho).
- O campo de **justificativa** na sessão B ainda contém o texto digitado.
- Ao recarregar a sessão B, o valor atual é `Cliente novo A` (de A, não de B).

---

### TS-08-B — Sessão expirada durante correção com rascunho preenchido (Spec 008)

**Objetivo:** verificar que ao expirar a sessão enquanto o diálogo de correção está
aberto com rascunho preenchido, a interface não apresenta falsa confirmação de
gravação.

**Perfil:** `operador@doka.test`

**Passos:**
1. Fazer login como `operador@doka.test`.
2. Abrir `ASS-100` e clicar em **Corrigir** em qualquer campo autorizado.
3. Preencher valor e justificativa no diálogo (não salvar ainda).
4. Em outra aba, fazer logout da aplicação (ou limpar os cookies `sb-*` do
   localStorage).
5. Voltar à aba com o diálogo aberto e tentar salvar.

**Aprova se:**
- A aplicação **não** exibe "Correção salva com sucesso".
- A interface indica que a sessão foi encerrada ou que é necessário fazer login
  novamente.
- Não há dados gravados no banco (verificar recarregando e inspecionando o histórico
  de `ASS-100`).

---

### TS-08-C — Falha de rede durante filtragem e retry (Spec 008)

**Objetivo:** verificar que quando a rede falha durante uma listagem/filtragem, a
interface não exibe lista vazia como se não houvesse dados, e oferece ação de retry.

**Perfil:** `direcao@doka.test`

**Passos:**
1. Abrir `/app/assistencias-mms` e aguardar a lista carregar.
2. Simular queda de rede.
3. Aplicar um filtro (por exemplo: número `PERF-00001`).
4. Observar o estado da interface enquanto offline.
5. Clicar em **Tentar novamente** (botão de retry), se disponível.
6. Restaurar a conectividade.
7. Clicar em **Tentar novamente** novamente.

**Aprova se:**
- Com rede cortada: a interface exibe estado de falha com texto explicativo, não
  lista vazia silenciosa.
- Existe botão ou ação de "Tentar novamente" visível.
- Após restaurar a rede e clicar em retry: a lista carrega os resultados corretos.
- Não há duplicação de itens na lista após o retry.

---

### TS-KB — Navegação completa por teclado (ambos os módulos)

**Objetivo:** verificar que todas as funções dos dois módulos são acessíveis sem
mouse, que os diálogos retêm o foco, que o Escape funciona e que o foco retorna
ao controle de origem.

**Perfil:** `direcao@doka.test`

**Módulo Importações MMS (`/app/importacoes-mms`):**

1. Pressionar `Tab` a partir do início da página.
2. Percorrer: cabeçalho, menu de navegação, filtros, tabela de lotes, paginação.
3. Confirmar que cada controle tem rótulo visível ou `aria-label`.
4. Navegar até o lote `70000000-0000-4000-8000-000000000002` usando teclado.
5. Abrir o detalhe com `Enter`.
6. Percorrer as abas do detalhe com `Tab` e ativar com `Enter` ou `Espaço`.
7. Se o botão **Reprocessar** estiver visível, ativá-lo com `Enter`.
8. Confirmar que o foco vai para dentro do diálogo.
9. Percorrer o diálogo com `Tab` e `Shift+Tab` — o foco **não deve escapar**.
10. Fechar com `Esc` e confirmar que o foco retorna ao botão **Reprocessar**.

**Módulo Assistências MMS (`/app/assistencias-mms`):**

1. Percorrer: cabeçalho, filtros, tabela de assistências.
2. Navegar até `ASS-100` e abrir com `Enter`.
3. Percorrer o detalhe: sumário, partes, histórico.
4. Ativar o botão **Corrigir** de Cliente com `Enter`.
5. Confirmar que o foco vai para o campo de novo valor dentro do diálogo.
6. Preencher valor e justificativa usando apenas teclado.
7. Tentar confirmar sem justificativa — verificar que a mensagem de erro é
   anunciada (texto visível, associado ao campo).
8. Fechar com `Esc` e confirmar retorno de foco ao botão **Corrigir**.
9. Reabrir com `Enter`, preencher ambos os campos e confirmar com `Enter`.
10. Confirmar que o diálogo fecha e o foco retorna ao elemento de contexto.

**Aprova se (para ambos os módulos):**
- Toda funcionalidade é alcançável sem mouse.
- A ordem de Tab é lógica (da esquerda para a direita, de cima para baixo).
- O foco é sempre visível (outline ou highlight claro).
- Nenhum controle fica inacessível (sem "armadilhas de foco" fora dos diálogos).
- Dentro dos diálogos, o Tab dá a volta sem escapar (`aria-modal`/trap ativo).
- O `Esc` fecha o diálogo sem salvar.
- O foco retorna ao controle que abriu o diálogo ao fechar.
- Status, alerta, erro, "Removido" e "Cancelado" têm texto explícito — não são
  comunicados apenas por cor.
- Mensagens de validação são anunciadas e associadas ao campo que as gerou.

---

## 6. Critérios de aprovação por cenário

| ID | Aprovado quando | Reprovado quando |
|---|---|---|
| TS-07-A | Sessão B recebe conflito, texto do rascunho é preservado | B sobrescreve A silenciosamente ou perde o texto |
| TS-07-B | Interface não declara sucesso falso; uma operação no histórico | "Reprocessado com sucesso" exibido offline; duas operações |
| TS-07-C | Análise velha rejeitada; lote Cancelado; predecessores restaurados | Desfazer aceita assinatura antiga; dados de auditoria sumidos |
| TS-07-D | Uma operação de reprocessamento no histórico | Duas operações para o mesmo intervalo |
| TS-08-A | Sessão B vê aviso, rascunho preservado, A prevalece | B sobrescreve A ou apaga o que o usuário digitou |
| TS-08-B | Sem falsa confirmação de gravação; indica sessão encerrada | "Correção salva" exibido com sessão inválida |
| TS-08-C | Estado de falha explícito; retry funciona; sem duplicatas | Lista vazia sem mensagem; retry duplica registros |
| TS-KB | Tudo alcançável por Tab; foco visível; diálogos retêm foco | Controle inacessível; foco perdido; estado só por cor |

---

## 7. Dados de registro por cenário

Para cada cenário executado, registrar:

```
ID do cenário:
Data e hora:
Perfil(s) usado(s):
Navegador e versão:
Resolução:
Resultado: APROVADO | REPROVADO | BLOQUEADO
Comportamento observado:
Evidência: print ou vídeo
Observações:
```

---

## 8. Atenção — o que NÃO fazer

- **Nunca executar em produção.** Usar somente o ambiente de desenvolvimento local
  com seed aplicado.
- **Não armazenar tokens ou chaves.** O `.env.local` deve conter apenas
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Não enviar a chave `service_role` à SPA.** Se precisar alterar dados de
  usuário diretamente, use o painel Supabase ou o conector autenticado, nunca
  exponha a chave no frontend.
- **Cenários TS-07-C e TS-07-D consomem o lote.** Reaplicar o seed antes de
  repetir: `supabase/seed/importacao_mms_seed.sql` (ou equivalente que recrie os
  lotes `70000000-*`).
- **Não marcar tarefas das specs como concluídas** enquanto houver cenário
  `REPROVADO` ou `BLOQUEADO`.

---

## 9. Divisão final resumida

```
Playwright (já automatizado, rodar com npx playwright test):
  ✓ Bloqueio de acesso anônimo e sem perfil
  ✓ Lista + filtros + URL params (007 e 008)
  ✓ Detalhe de lote e de assistência
  ✓ Permissões por perfil (matriz de acesso)
  ✓ Erro pendente bloqueia Concluir
  ✓ Diálogo de reprocessar exige confirmação e fecha com Cancelar
  ✓ Campos proibidos sem botão de editar
  ✓ Posto alheio retorna negação neutra
  ✓ Histórico com link para lote de origem
  ✓ Validação do diálogo de correção (sem valor, sem justificativa, Escape)
  ✓ Layout sem overflow horizontal em 1280×720 e 1440×900
  ✓ axe-core WCAG A/AA em lista, detalhe e diálogo aberto

TestSprite (este guia — executar manualmente ou via IA):
  TS-07-A  Conflito de versão entre dois editores (Spec 007)
  TS-07-B  Rede incerta durante reprocessamento
  TS-07-C  Desfazer com análise desatualizada
  TS-07-D  Duplo clique em confirmar reprocessamento
  TS-08-A  Conflito de correção sem perda de rascunho (Spec 008)
  TS-08-B  Sessão expirada com diálogo e rascunho aberto
  TS-08-C  Falha de rede durante filtragem com retry
  TS-KB    Navegação completa por teclado (007 e 008)
```
