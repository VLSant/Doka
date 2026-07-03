# Revisão pragmática do MVP Doka

**Data:** 02/07/2026
**Escopo:** auditoria de simplificação do MVP — sem alteração de código, migrations ou specs.

## 1. Diagnóstico principal

O Doka resolve um problema real e o que já foi construído funciona, mas o **processo de desenvolvimento está dimensionado para um produto enterprise, não para uma ferramenta interna de 5 a 10 usuários**. O maior risco do projeto não é o código já entregue — é repetir o mesmo peso de specs, auditoria, concorrência e testes nos 6 módulos que ainda faltam. Se as próximas specs seguirem o padrão das atuais, a segunda metade do MVP vai custar tanto quanto a primeira, sendo que ela é justamente a parte mais simples (CRUDs operacionais).

A recomendação central: **congelar o que está pronto, cortar o rito das próximas specs pela metade e entregar os módulos restantes em versão enxuta**, deixando kanban/calendário, templates configuráveis, tela de auditoria e automações para depois do uso real.

## 2. Inventário de evidências analisadas

**Documentos lidos integralmente:**

- `README.md`, `docs/01-prd-mvp.md`, `docs/02-regras-negocio.md`, `docs/05-banco-dados.md`, `docs/06-backlog-tecnico.md`
- `.specify/memory/constitution.md`
- `specs/010-tarefas-rotinas/spec.md` (íntegra) e `specs/014-administracao-cadastros-auditoria/spec.md` (parcial)

**Áreas dimensionadas e amostradas:**

- 10 specs existentes (001–008, 010, 014): 12.515 linhas somando spec/plan/tasks/data-model, mais contracts, checklists, research e quickstart por spec
- 34 migrations SQL (8.091 linhas): 16 tabelas, 88 policies RLS, 91 funções SQL
- 37 arquivos de teste SQL (4.036 linhas)
- 44 arquivos de teste frontend (unit/integration) + 8 suítes Playwright e2e (incluindo `accessibility.spec.ts` e `performance-session.spec.ts`)
- Frontend `src/`: ~6.300 linhas, módulos auth, access, importacoes-mms, assistencias-mms, navigation
- `docs/03-mapa-telas-fluxos.md` (1.217 linhas) e `docs/04-importacao-mms.md` (738 linhas) — dimensionados, não lidos na íntegra
- `scripts/importacao-mms/README.md`, `supabase/policies/*.md`, seeds

**Sobre a branch de automação:** a branch local `codex/automacao-importacao-mms-experimento` existe, mas está **totalmente contida em `main`** (é ancestral direto, sem commits próprios). Não há código de bot/extração de CSV commitado em nenhuma branch acessível. Não consegui confirmar nenhum experimento de automação nos arquivos disponíveis.

**Não encontrados (esperado):** specs 009, 011, 012, 013 (numeração reservada); nenhuma spec ou implementação de ocorrências, deslocamentos, custos extras ou dashboard.

## 3. Resumo executivo

**O que o Doka resolve:** espelho interno das assistências da MMS (importação de planilhas), acompanhamento de ocorrências operacionais (ex.: baixas feitas na MMS antes da execução real), tarefas/rotinas da equipe, deslocamentos extras e uma visão gerencial do dia — substituindo planilhas e controles espalhados.

**O projeto está proporcional?** O produto sim; o processo não. Evidências concretas de desproporção:

- A Spec 005 (login, navegação e recuperação de senha) tem 473 linhas de spec, 833 linhas de tasks e 8 suítes e2e — incluindo testes de performance e acessibilidade — para uma tela de login de uso interno.
- A Spec 010 (tarefas) tem **64 requisitos funcionais** e critérios de sucesso que exigem: consultas com 10.000 tarefas em 2 segundos, processamento concorrente de 1.000 ocorrências de rotina e testes de usabilidade com ≥90% dos participantes. A operação inteira tem 5 a 10 pessoas.
- A camada de importação MMS tem staging completo (linhas, erros, alertas, correções, operações de lote), reprocessamento, desfazer com análise prévia, tratamento de duplicatas multiposto, versionamento otimista por registro e triggers de bloqueio (`mms_bloquear_*`). São 91 funções SQL e 88 policies antes de existir qualquer módulo de ocorrências, tarefas ou dashboard.
- Cada feature passa por constitution check duas vezes, gera 8+ artefatos de documentação, e a constituição exige testes de RLS, soft delete, auditoria e raw_json para qualquer feature que toque o domínio.

**Maiores oportunidades de simplificação:**

1. Cortar o rito de specs pela metade daqui pra frente (specs de 1–2 páginas: telas, tabelas, regras, permissões).
2. Reescrever a Spec 010 em versão enxuta antes de implementar (é a próxima da fila e é a mais inflada).
3. Entregar ocorrências com tipos fixos (a tabela `tipos_ocorrencia` já existe desde a Spec 002) em vez de templates configuráveis.
4. Deslocamentos como lançamento manual + exportação CSV, sem e-mail automático.
5. Dashboard como contadores simples, sem metas/alertas na primeira versão.
6. Reduzir a tela de administração (Spec 014) a CRUDs mínimos e adiar a tela de auditoria.

## 4. Diagnóstico por módulo

### 4.1 Importação MMS / Espelho operacional

- **Problema que resolve:** trazer os serviços da MMS para dentro do Doka várias vezes ao dia, com rastreabilidade.
- **Status:** implementado (Specs 003, 004, 006, 007, 008). É o núcleo técnico e está funcionando.
- **O que está bem definido:** chave operacional (posto + data + assistência + parte), preservação de `raw_json`, marcação de removidos, lote único multiposto.
- **O que ficou complexo demais:** reprocessamento, desfazer com análise prévia, correção campo a campo com valores efetivos e versionamento otimista, classificação de duplicatas. Isso já custou dezenas de migrations corretivas (6 correções só na Spec 003, 5 na 006/007).
- **Recomendação:** **não mexer**. Simplificação retroativa aqui é retrabalho puro. A lição é não repetir esse padrão nos próximos módulos. O painel de indicadores por status/posto (pedido do módulo) ainda não existe — entra no Dashboard (4.5).
- **Adiar:** bot de extração automática (não há código iniciado), cron diário, insights via WhatsApp. Quando chegar a hora, começar como script local que baixa o CSV e usa o fluxo de importação já existente — a fronteira certa já está pronta.

### 4.2 Tarefas e rotinas

- **Problema que resolve:** centralizar tarefas, cobranças e rotinas recorrentes.
- **Status:** spec pronta (010), não implementada.
- **O que está bem definido:** modelo de dados (tarefas, responsáveis, rotinas, execuções — docs/05 §22–26), status simples, atraso como condição calculada, regra de rotina acumulada (não duplicar tarefa aberta).
- **O que está complexo demais na spec 010:** 64 FRs; três visualizações obrigatórias (lista + kanban + calendário); recuperação cronológica de ocorrências perdidas após indisponibilidade; idempotência sob processamento concorrente; detecção de conflito de versão em edições; SC-005/SC-009 com volumes de 1.000–10.000 itens.
- **Divergência com a visão atual:** o FR-050 proíbe Operador de criar tarefa avulsa; a visão atual do produto é que **todo usuário cria tarefas para si**. Precisa ser re-ratificado antes de implementar.
- **Versão mais simples aceitável:** tarefas com título, responsável(is), prazo, prioridade, status; rotinas diária/semanal/quinzenal/mensal geradas de forma simples (ao carregar a Central, gerar execuções pendentes do período — sem worker, sem recuperação concorrente); visualização em **lista** primeiro; calendário se sair barato; kanban depois; qualquer usuário cria tarefa para si, supervisão/direção criam para outros.

### 4.3 Ocorrências

- **Problema que resolve:** registrar internamente situações que a MMS não comporta (ex.: baixa dada como executada com montagem combinada para depois). É a brecha operacional mais sensível.
- **Status:** sem spec e sem implementação. Só existe a tabela `tipos_ocorrencia` (Spec 002) e a modelagem no docs/05 §20–21.
- **O que está bem definido:** modelo (ocorrência + comentários), status, abas Hoje/Abertas/Atrasadas, atraso calculado por data de retorno.
- **Divergência com a visão atual:** os docs fecham a decisão "ocorrência sempre precisa de assistência"; a visão atual diz "associação a uma assistência **quando aplicável**". Recomendo tornar o vínculo **opcional** (nem toda situação a acompanhar nasce de um serviço importado) e re-ratificar a decisão.
- **Sobre templates configuráveis:** não criar campos dinâmicos por tipo no MVP. Usar a tabela `tipos_ocorrencia` existente (direção/supervisão já podem cadastrar tipos novos) + campos fixos (descrição, responsável, data de retorno, observações). Campos por template é uma feature de plataforma, não de MVP.
- **Versão mais simples aceitável:** criar/editar ocorrência com tipo (da tabela existente), assistência opcional, responsável, prazo/data de retorno, status, comentários de acompanhamento; abas Hoje/Abertas/Atrasadas; filtros por status, tipo, responsável e posto; histórico apenas em mudança de status, reabertura e soft delete.

### 4.4 Deslocamentos

- **Problema que resolve:** substituir a planilha de deslocamentos extras e ajustes, com apuração por período para envio à MMS.
- **Status:** sem spec e sem implementação. O docs/05 §27 modela deslocamentos como principalmente **importados da MMS** — a visão atual mudou para **lançamento manual** com período de apuração e exportação. Outra divergência a ratificar.
- **Versão mais simples aceitável:** uma tabela `deslocamentos` (a modelagem do docs/05 serve com ajustes: tipo, montador/recurso, posto, data, descrição/motivo, valor, status de validação, período), uma tela de lançamento + listagem com filtro por período/posto/status, e **exportação CSV manual**. Sem e-mail automático, sem cálculo por mapas, sem múltiplas etapas de aprovação (pendente → validado, como custos extras).
- **Sobre custos extras:** o módulo separado de custos extras (docs/05 §28) não aparece na visão atual do produto. Recomendo **adiar** ou absorver como um tipo de deslocamento/lançamento — uma tabela a menos, uma tela a menos.

### 4.5 Dashboard

- **Problema que resolve:** visão rápida do dia para supervisão e direção.
- **Status:** sem spec; existe placeholder (`DashboardPage.tsx`).
- **O que está complexo demais nos docs:** três dashboards distintos por perfil, comparativo início × fechamento do dia, metas de eficiência com vigência, ranking de postos, alertas críticos.
- **Versão mais simples aceitável:** **uma tela** com filtro de posto/período e contadores: total de serviços, executados, não executados, pendentes, removidos (dados já existem em `mms_assistencias`), ocorrências abertas/atrasadas, tarefas atrasadas, deslocamentos pendentes. O RLS já limita o que cada perfil vê — não precisa de três dashboards. Metas de eficiência (`metas_eficiencia` já existe no banco) e alertas entram numa segunda rodada, quando os dados forem confiáveis.

### 4.6 Usuários e permissões

- **Problema que resolve:** separar operação, supervisão e direção.
- **Status:** banco pronto (Specs 001, 002), autenticação pronta (Spec 005), telas administrativas especificadas (Spec 014) mas não implementadas. Hoje usuários/vínculos são geridos por SQL/painel Supabase.
- **O que está bem definido:** 3 perfis, RLS por perfil + posto, funções auxiliares reutilizáveis (`usuario_tem_acesso_posto` etc.), sem service_role no frontend (verificado no README e `.env` handling).
- **O que está complexo demais na Spec 014:** proteção de "último admin", controle de concorrência otimista em cadastros, tela completa de consulta de auditoria, análise de impacto antes de inativar posto. Para 5–10 usuários, gestão de usuários é um evento raro.
- **Versão mais simples aceitável:** tela de usuários (perfil, ativo, cargo), tela de postos, tela de vínculos usuário/posto e cadastros auxiliares (tipos de ocorrência, prioridades) — CRUDs diretos, restritos a direção/admin. **Adiar a tela de auditoria**: os dados já ficam em `historico_auditoria` e podem ser consultados por SQL quando precisar.

## 5. Onde o projeto parece complexo demais

1. **Processo speckit completo por feature** — 8+ artefatos e ~1.200 linhas de documentação por spec, com constitution check duplo. Para o estágio atual, isso é a maior fonte de lentidão.
2. **Rigor de concorrência e idempotência em módulos manuais** — versionamento otimista, conflitos de edição simultânea e processamento concorrente aparecem nas Specs 008, 010 e 014. Com 5–10 usuários, conflito de edição é raríssimo e o custo de prevenir cada caso é alto.
3. **Testes e2e de acessibilidade e performance** (Spec 005) e critérios de sucesso com volumes de 10.000 registros (Spec 010) — proporção de produto SaaS público.
4. **Auditoria universal** — a constituição exige `historico_auditoria` para "toda ação crítica" e as specs estendem isso a praticamente toda edição. Histórico importa em status, validação, remoção e correção de dado importado; não em cada campo editado de uma tarefa.
5. **Documentação fundacional redundante** — docs/03 (1.217 linhas de mapa de telas) e docs/06 (backlog DOKA-001–060) foram superados pelas specs e pelo prompt de visão atual; manter os três sincronizados é trabalho sem retorno.
6. **Camada de importação com recursos raros** — desfazer com análise prévia, reprocessamento, duplicatas multiposto. Já está pago; apenas não estender.

## 6. O que cortar, simplificar ou adiar

| Item | Decisão | Motivo | Impacto esperado |
| --- | --- | --- | --- |
| Rito speckit completo (spec+plan+tasks+contracts+research+checklists) nas próximas features | Simplificar agora | ~1.200 linhas de docs por spec para módulos CRUD | Cada módulo restante sai em dias, não semanas |
| Spec 010: kanban + calendário obrigatórios | Simplificar agora (lista primeiro) | 3 visualizações triplicam o custo da tela mais usada | Central de tarefas entregue muito antes |
| Spec 010: recuperação concorrente/cronológica de ocorrências de rotina, SC de 1.000–10.000 itens | Cortar agora | Requisito de escala inexistente | Geração de rotina vira lógica simples e testável |
| Spec 010: proibição de Operador criar tarefa avulsa (FR-050) | Cortar (ratificar) | Contradiz a visão atual: todos criam tarefas para si | Menos regra de permissão; UX melhor |
| Ocorrência com assistência obrigatória | Simplificar (tornar opcional; ratificar) | Visão atual: vínculo "quando aplicável" | Ocorrências utilizáveis para qualquer acompanhamento |
| Templates configuráveis de ocorrência com campos dinâmicos | Adiar | Tabela `tipos_ocorrencia` já cobre a necessidade | Módulo de ocorrências vira CRUD direto |
| Módulo custos extras separado de deslocamentos | Adiar/fundir | Visão atual não o menciona; duas tabelas/telas quase iguais | Uma tela e uma tabela a menos |
| Deslocamentos importados da MMS | Cortar do MVP (ratificar) | Visão atual: lançamento manual + exportação | Modelo de dados mais simples |
| Envio automático de deslocamentos por e-mail | Adiar | Exportação CSV manual resolve a quinzena | Zero infraestrutura de e-mail no MVP |
| Dashboards distintos por perfil, metas, ranking, comparativo início×fechamento | Simplificar agora | RLS já filtra por perfil; dados de meta ainda não confiáveis | Uma tela de contadores entregável em poucos dias |
| Spec 014: tela de auditoria, proteção de último admin, concorrência otimista | Adiar (manter CRUDs mínimos) | Gestão de usuário é evento raro; auditoria consultável por SQL | Admin sai como 3–4 CRUDs simples |
| Testes e2e de acessibilidade/performance para novos módulos | Cortar agora | Proporção de produto público | Menos manutenção de suíte |
| Testes SQL exaustivos por módulo novo (padrão atual: ~8 arquivos/spec) | Simplificar (RLS + regra crítica apenas) | 37 arquivos SQL já exigem execução manual no remoto | Custo de teste proporcional ao risco |
| Auditoria em toda edição de campo | Simplificar (status, validação, remoção, correção MMS) | Histórico só onde gera decisão | Menos triggers e menos ruído |
| docs/03 e docs/06 como fonte viva | Cortar (marcar como histórico) | Superados pelas specs e pela visão atual | Menos documentação para sincronizar |
| Bot de extração MMS, WhatsApp, IA de e-mails, BI | Adiar (já era a intenção) | Visão futura; sem código iniciado | Foco no MVP |

## 7. Novo MVP recomendado

**Módulos finais (6):**

1. Importação MMS + espelho de assistências — **pronto** (não mexer)
2. Ocorrências — versão enxuta (tipos fixos via `tipos_ocorrencia`, assistência opcional, abas Hoje/Abertas/Atrasadas)
3. Tarefas e rotinas — versão enxuta (lista; recorrência simples; acúmulo sem duplicar)
4. Deslocamentos — lançamento manual + validação + exportação CSV
5. Dashboard — uma tela de contadores com filtros de posto/período
6. Administração mínima — usuários, postos, vínculos, cadastros auxiliares

**Telas mínimas novas:** lista+detalhe de ocorrências, nova ocorrência; lista de tarefas + formulário + cadastro de rotina; lista+formulário de deslocamentos + exportar; dashboard; 4 CRUDs administrativos. Total: ~10 telas, todas seguindo os padrões já estabelecidos na Spec 008.

**Tabelas essenciais novas:** `ocorrencias`, `ocorrencia_comentarios`, `tarefas`, `tarefa_responsaveis`, `rotinas`, `rotina_responsaveis`, `rotina_execucoes`, `deslocamentos`. Oito tabelas — todas já modeladas no docs/05, precisando só dos ajustes de decisão (assistência opcional em ocorrências; deslocamento manual). Nada de tabelas genéricas ou de templates.

**Permissões essenciais:** manter exatamente o modelo existente (3 perfis + vínculo por posto + funções `app_private` reutilizáveis). Nenhum papel novo, nenhuma permissão por campo.

**Testes essenciais por módulo novo:** 1 teste SQL de RLS + 1 teste SQL da regra crítica (ex.: rotina acumulada não duplica; atraso calculado) + testes unitários apenas para lógica não trivial de frontend (ex.: cálculo de recorrência). Nada de e2e novo até a homologação final.

**Automações adiadas:** bot MMS, cron, e-mail automático de deslocamentos, insights/WhatsApp, monitoramento de e-mails, BI.

## 8. Ajustes sugeridos nos documentos fundacionais

- **README.md:** atualizar a seção "Estado atual" (ainda diz "fase inicial de estruturação técnica", contradizendo 8 specs implementadas) e a seção "O que o Doka faz" conforme as decisões re-ratificadas.
- **docs/01 e docs/02:** continuam úteis como referência de regras. Registrar em nota as decisões alteradas (ocorrência sem assistência obrigatória; deslocamento manual; custos extras adiados; Operador cria tarefa para si) em vez de reescrever tudo.
- **docs/03 (mapa de telas) e docs/06 (backlog):** marcar como documentos históricos/superados no cabeçalho. As specs e este relatório passam a orientar o restante.
- **docs/05 (banco):** ainda é o melhor guia para as tabelas que faltam; usar como base direta das próximas migrations com os ajustes acima.
- **Constituição (.specify/memory/constitution.md):** amendar duas regras de processo: (a) specs no formato curto para módulos CRUD internos; (b) exigência de testes proporcionais (RLS + regra crítica) em vez da lista completa por feature. Sem isso, qualquer agente que seguir a constituição vai reproduzir o peso atual.
- **Registrar as 4 decisões divergentes** (seção 11, ação 1) em um arquivo curto de decisões, para os agentes não tratarem os docs antigos como verdade.

## 9. Ajustes técnicos sugeridos

- **Banco:** nenhuma mudança retroativa. As 16 tabelas, 88 policies e 91 funções existentes funcionam e estão testadas; mexer agora é risco sem ganho. As 8 tabelas novas devem reutilizar os helpers `app_private` existentes e o padrão de policies das Specs 001/002 — sem criar novas famílias de funções por módulo.
- **Novos módulos sem RPCs complexas:** os módulos manuais (ocorrências, tarefas, deslocamentos) podem operar com CRUD direto sob RLS + triggers simples de auditoria em status/remoção — reservar RPCs para operações realmente atômicas (ex.: gerar execuções de rotina).
- **Frontend:** manter os padrões da Spec 008 (services + pages + components por módulo). Não criar state machines (como `import-machine.ts`) para CRUDs simples.
- **Testes:** manter a suíte existente como está (regressão do núcleo); para o novo ciclo, seguir a proporção da seção 7. Evitar crescer os 37 arquivos SQL executados manualmente — agrupar os testes novos por módulo em 1–2 arquivos.
- **Duplicidades:** não encontrei duplicidade relevante de código; a tabela `mms_operacoes_lote` e `mms_correcoes_importacao` não constam no docs/05 mas têm função clara (workflow da Spec 006/007) — apenas documentar.

## 10. Riscos que não devem ser ignorados

Mesmo simplificando, **não abrir mão de:**

1. **RLS por perfil + posto em toda tabela operacional nova** — é a única barreira real de acesso numa SPA sem backend próprio.
2. **Nenhuma chave sensível no frontend** — manter a disciplina atual de `VITE_` só para valores publicáveis.
3. **Chave operacional MMS + raw_json + marcação de removido** — é o contrato do espelho; já está pronto, não flexibilizar.
4. **Soft delete com justificativa em remoções** — barato de manter (padrão já existe) e evita perda de dado operacional.
5. **Histórico nas ações que geram briga operacional** — mudança de status de ocorrência, validação de deslocamento/tarefa, correção de dado importado, soft delete. É o que protege a equipe em discussões com a MMS.
6. **Validação nas fronteiras** — parser de importação (pronto) e formulários de entrada (campos obrigatórios, tipos). Não validar menos que isso.
7. **Não editar `raw_json`** — regra já implementada via triggers de bloqueio; preservar.

Simplificar demais aqui criaria exatamente os problemas que o Doka nasceu para resolver (perda de rastro e dado não confiável).

## 11. Próximas ações priorizadas

1. **Ratificar 4 decisões de produto** (30 min, você): (a) ocorrência com assistência opcional; (b) todo usuário cria tarefa para si; (c) deslocamentos manuais com exportação CSV, sem importação MMS; (d) custos extras adiados/fundidos em deslocamentos. Registrar num arquivo curto de decisões em `docs/`.
2. **Amendar constituição e README** com o modo enxuto (specs curtas, testes proporcionais) — 1 sessão de agente.
3. **Reescrever a Spec 010 em versão enxuta e implementar tarefas/rotinas** — cortar para ~15 FRs: CRUD de tarefas, responsáveis, rotina com geração simples, acúmulo, lista com abas, RLS. Kanban/calendário ficam como fase 2 do módulo.
4. **Spec curta + implementação de Ocorrências** — maior dor operacional (controle de baixas a acompanhar); reutiliza `tipos_ocorrencia` e o padrão de tela da Spec 008.
5. **Spec curta + implementação de Deslocamentos** — tabela, tela de lançamento, validação, exportação CSV por período.
6. **Dashboard mínimo** — uma tela de contadores sobre dados já existentes + ocorrências/tarefas/deslocamentos.
7. **Administração mínima** — implementar só os CRUDs da Spec 014 (usuários, postos, vínculos, cadastros auxiliares); adiar tela de auditoria e salvaguardas avançadas.
8. **Homologação com dados reais** — 2 semanas de uso pela equipe com planilhas reais do dia; ajustar pelo feedback antes de qualquer automação.

Itens 3, 4 e 5 são independentes entre si; se houver agentes em paralelo, ocorrências e deslocamentos podem andar juntos após o item 1.

## Decisão recomendada

**Siga o caminho do corte de processo, não do corte de código.** Não refatore nem simplifique retroativamente nada das Specs 001–008 — esse custo já foi pago e o núcleo (importação + espelho) é a parte mais difícil e está pronta. Concentre toda a simplificação no ciclo restante: ratifique as 4 decisões de produto, reescreva a Spec 010 em formato enxuto, e entregue os 5 módulos que faltam (tarefas, ocorrências, deslocamentos, dashboard, admin mínimo) como CRUDs diretos sob o RLS e os padrões de tela que já existem — specs de 1–2 páginas, ~15 requisitos por módulo, 2 testes SQL por módulo, lista antes de kanban/calendário, exportação manual antes de e-mail, tipos fixos antes de templates. Com esse formato, o MVP fecha com aproximadamente metade do esforço que o padrão atual consumiria, sem abrir mão de RLS, soft delete, raw_json e histórico onde importa.
