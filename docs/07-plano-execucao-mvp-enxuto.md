# Plano vivo de execução do MVP enxuto

**Data inicial:** 03/07/2026
**Objetivo:** concluir os módulos restantes do Doka com foco em resultado
operacional, baixo custo de desenvolvimento e complexidade proporcional a um
sistema interno de 5 a 10 usuários.

Este documento é o ponto de continuidade entre sessões e agentes. Ele não é uma
nova spec e não substitui o PRD. Deve registrar o estado real da execução, o
próximo passo e as decisões tomadas durante a implementação.

---

## 1. Resultado esperado

Entregar os módulos restantes funcionando de ponta a ponta:

1. Central de Tarefas e Rotinas;
2. Central de Ocorrências;
3. Deslocamentos e Custos Extras;
4. Administração mínima;
5. Dashboard operacional.

O trabalho deve aproveitar as migrations já criadas, os padrões úteis do
frontend atual e a infraestrutura existente de autenticação, perfil, posto,
RLS, auditoria e Supabase.

O resultado esperado não é uma plataforma enterprise. É um MVP confiável que a
equipe consiga usar na operação diária.

---

## 2. Estado verificado em 03/07/2026

### 2.1 Implementação anterior já consolidada

- Autenticação e autorização por perfil/posto;
- navegação e shell da aplicação;
- importação e gestão de lotes;
- espelho e consulta de assistências;
- cadastros fundamentais no banco;
- design system e componentes básicos;
- auditoria e helpers privados já utilizados pelo projeto.

### 2.2 Trabalho iniciado pelo Fable 5

Foram criadas localmente quatro migrations ainda não rastreadas pelo Git. Em
03/07/2026, os nomes locais foram alinhados às versões registradas remotamente:

- `20260703024924_tarefas_rotinas.sql`;
- `20260703025222_ocorrencias.sql`;
- `20260703025406_lancamentos_operacionais.sql`;
- `20260703025446_administracao_minima.sql`.

Também foram criados:

- `src/services/catalog-service.ts`;
- `src/styles/operacional.css`.

Os dois arquivos de frontend ainda não são importados nem utilizados.

### 2.3 Estado remoto confirmado

As quatro migrations foram aplicadas no projeto remoto Supabase **Doka**.

O banco remoto contém:

- `tarefas`;
- `tarefa_responsaveis`;
- `rotinas`;
- `rotina_responsaveis`;
- `rotina_execucoes`;
- `ocorrencias`;
- `ocorrencia_comentarios`;
- `lancamentos_operacionais`.

As oito tabelas estão com RLS habilitado e ainda não possuem dados. O cron
`doka-gerar-tarefas-rotinas` está ativo a cada 30 minutos e possui ao menos uma
execução concluída.

### 2.4 Situação atual por módulo

| Módulo                 | Banco                       | Frontend     | Testes       | Estado       |
| ---------------------- | --------------------------- | ------------ | ------------ | ------------ |
| Tarefas e Rotinas      | Substancial                 | Não iniciado | Não iniciado | Parcial      |
| Ocorrências            | Substancial                 | Não iniciado | Não iniciado | Parcial      |
| Deslocamentos e Custos | Substancial                 | Não iniciado | Não iniciado | Parcial      |
| Administração          | Pequena base adicional      | Não iniciado | Não iniciado | Inicial      |
| Dashboard              | Sem implementação adicional | Placeholder  | Não iniciado | Não iniciado |

### 2.5 Pendências técnicas já identificadas

- Os nomes locais já correspondem às versões do histórico remoto; a revisão
  funcional do conteúdo e dos contratos ainda está em andamento.
- As migrations foram aplicadas, mas suas regras ainda não foram verificadas
  por testes funcionais de perfil, posto e transições.
- Os advisors registram avisos para RPCs `SECURITY DEFINER`; é necessário
  confirmar se cada exposição é intencional e se toda função deriva ator e
  autorização da sessão.
- Não existem testes novos, páginas novas, rotas novas ou integração frontend.
- Nenhum commit foi criado para o trabalho iniciado.

Não reaplicar migrations até reconciliar o histórico local e remoto.

---

## 3. Decisões definitivas de produto

Estas decisões foram confirmadas pelo proprietário do produto:

1. Operador pode criar tarefa somente para si.
2. Operador não pode criar tarefa para outro usuário.
3. Supervisão pode criar tarefas para si e para outros usuários de qualquer
   perfil dentro de seu escopo de posto.
4. Direção/Administração pode criar tarefas para qualquer usuário em escopo
   global.
5. Deslocamentos são lançados manualmente pela interface no MVP.
6. Exportação ou importação CSV de deslocamentos fica para uma versão futura.
7. Deslocamentos e custos extras formam um único módulo para o usuário.
8. As restrições existentes de perfil, posto e RLS permanecem.
9. Ocorrências continuam seguindo a regra oficial vigente de vínculo com
   assistência.

---

## 4. Método de execução enxuto

### 4.1 Princípios

- Trabalhar por fatias verticais utilizáveis, não por volume de documentação.
- Ler somente a parte do PRD e das regras relacionada ao módulo em execução.
- Detalhar o módulo imediatamente antes de implementá-lo.
- Usar a migration existente como ponto de partida, sem presumir que está
  correta.
- Reutilizar componentes e padrões existentes.
- Preferir lista, formulário e detalhe simples.
- Usar acesso direto sob RLS para CRUD simples.
- Usar RPC somente para transição, auditoria ou operação que precise ser
  atômica.
- Não criar abstração antes de haver uso real.
- Não implementar requisito futuro parcialmente.
- Não refatorar módulos já entregues sem necessidade para integração.
- Não criar ou reescrever specs como etapa obrigatória.
- Atualizar este documento conforme o trabalho avançar.

### 4.2 O que não será feito nesta etapa

- Kanban;
- calendário de tarefas;
- drag-and-drop;
- exportação CSV de deslocamentos;
- e-mail ou WhatsApp;
- BI avançado;
- gráficos complexos;
- templates dinâmicos de ocorrência;
- state machines para CRUDs simples;
- testes artificiais de escala;
- novas suítes Playwright;
- navegação automatizada, screenshots ou homologação E2E;
- arquitetura para usuários ou volume hipotéticos.

### 4.3 Qualidade mínima obrigatória

- RLS por perfil e posto;
- ator derivado da sessão;
- nenhuma chave privilegiada no frontend;
- soft delete operacional;
- auditoria nas ações críticas;
- transições críticas atômicas;
- validação de entrada;
- estados de loading, vazio e erro;
- typecheck, lint, testes permitidos e build;
- migrations locais coerentes com o banco remoto.

---

## 5. Estratégia geral de execução

### Fase 0 — estabilizar a base recebida

Objetivo: garantir que o próximo trabalho não seja construído sobre contratos
incertos.

Passos:

1. Confirmar novamente branch, status e arquivos não rastreados.
2. Comparar os nomes e versões das migrations locais com o histórico remoto.
3. Definir uma reconciliação não destrutiva do histórico.
4. Não reaplicar as quatro migrations.
5. Revisar tabelas, constraints, índices, triggers, grants, RLS e funções.
6. Verificar especialmente:
   - Operador criando tarefa somente para si;
   - Supervisão limitada por posto;
   - Direção/Administração global;
   - transições de tarefa;
   - regra de acúmulo da recorrência;
   - ocorrência vinculada à assistência;
   - custo extra exigindo assistência;
   - validação de lançamentos;
   - proteção do último administrador;
   - auditoria das ações críticas.
7. Verificar o cron e impedir agendamentos duplicados.
8. Registrar qualquer correção necessária em nova migration, sem editar
   retroativamente o que já foi aplicado.
9. Revisar `catalog-service.ts` e `operacional.css` antes de adotá-los.

Saída da fase:

- contrato de banco confiável;
- migrations reconciliadas;
- lista curta de correções realmente necessárias;
- base pronta para desenvolvimento paralelo do frontend.

### Fase 1 — fundação frontend compartilhada

Objetivo: evitar que os módulos criem cinco versões diferentes das mesmas
estruturas.

Passos:

1. Validar e integrar o serviço compartilhado de catálogos.
2. Validar e integrar os estilos operacionais compartilhados.
3. Criar somente os componentes genéricos realmente necessários:
   - seletor;
   - estado/status;
   - filtros simples;
   - tabela;
   - diálogo de confirmação;
   - feedback de loading, vazio e erro.
4. Definir o padrão mínimo de service:
   - consulta;
   - criação/edição;
   - chamada de RPC crítica;
   - mapeamento pequeno de erros.
5. Não alterar o router ainda, exceto quando um módulo estiver pronto para uso.

Saída da fase:

- base pequena compartilhada;
- contratos frontend consistentes;
- módulos independentes para execução paralela.

### Fase 2 — três módulos operacionais em paralelo

Executar em paralelo:

- Tarefas e Rotinas;
- Ocorrências;
- Deslocamentos e Custos Extras.

Cada frente deve ser proprietária apenas de:

- seu diretório em `src/modules`;
- seus testes unitários e de integração;
- eventuais correções de tipos do próprio módulo.

O agente principal deve manter propriedade exclusiva de:

- `src/app/router.tsx`;
- `src/app/routes.ts`;
- arquivos CSS globais;
- serviços compartilhados;
- migrations corretivas;
- integração final.

Isso reduz conflitos entre agentes trabalhando no mesmo workspace.

### Fase 3 — Administração mínima

Iniciar quando os catálogos e necessidades reais dos três módulos operacionais
estiverem conhecidos.

O objetivo é administrar somente o necessário para a operação não depender de
SQL manual. A tela central de auditoria continua adiada.

### Fase 4 — Dashboard

Implementar por último, porque depende dos dados e estados definitivos de:

- assistências;
- tarefas;
- ocorrências;
- lançamentos operacionais.

O Dashboard será uma única tela de contadores e resumos simples. Não criar
gráficos ou indicadores sem definição operacional confiável.

### Fase 5 — integração e fechamento técnico

1. Integrar as rotas somente após cada módulo estar funcional.
2. Remover os placeholders correspondentes.
3. Executar todos os testes permitidos.
4. Corrigir regressões introduzidas.
5. Executar advisors remotos.
6. Confirmar que não existem segredos no bundle.
7. Registrar pendências de homologação manual.
8. Criar commits com escopo claro somente após revisão do diff.

---

## 6. Plano inicial por módulo

As tarefas abaixo são deliberadamente gerais. Antes de iniciar cada módulo, a
seção correspondente deve ser detalhada com base no PRD, regras de negócio,
migration aplicada e padrões existentes.

### 6.1 Central de Tarefas e Rotinas

#### Escopo inicial

- Listagem com recortes Hoje, Pendentes, Atrasadas, Validação e Concluídas;
- formulário de tarefa;
- detalhe e edição;
- iniciar e concluir;
- validar e reabrir;
- formulário e listagem de rotinas;
- recorrência diária, semanal, quinzenal e mensal;
- indicação de origem recorrente;
- histórico crítico;
- permissões confirmadas por perfil e posto.

#### Sequência geral

1. Auditar a migration e as RPCs.
2. Definir tipos do frontend a partir do schema real.
3. Criar service de tarefas e rotinas.
4. Criar listagem e filtros.
5. Criar formulário de tarefa.
6. Criar detalhe e ações de transição.
7. Criar formulário/listagem de rotina.
8. Integrar histórico essencial.
9. Criar rotas do módulo.
10. Criar testes mínimos de permissão, service e componentes.
11. Executar verificações técnicas.

#### Simplificações mantidas

- Lista apenas;
- sem kanban;
- sem calendário;
- sem paginação complexa enquanto o volume real não exigir;
- sem versionamento otimista universal;
- sem processamento de escala artificial.

### 6.2 Central de Ocorrências

#### Escopo inicial

- Lista com Hoje, Abertas e Atrasadas;
- nova ocorrência;
- vínculo obrigatório com assistência conforme regra vigente;
- tipo, prioridade, responsável, posto e retorno;
- detalhe e edição;
- comentários;
- transição, encerramento e reabertura;
- histórico crítico;
- filtros essenciais.

#### Sequência geral

1. Auditar a migration, RLS e triggers.
2. Confirmar como selecionar assistência sem duplicar lógica do módulo atual.
3. Definir tipos e service.
4. Criar lista e filtros.
5. Criar formulário.
6. Criar detalhe e comentários.
7. Criar ações de status, reabertura e remoção.
8. Criar rotas.
9. Criar testes mínimos.
10. Executar verificações técnicas.

#### Simplificações mantidas

- Sem templates dinâmicos;
- sem SLA avançado;
- sem automações;
- sem notificações externas;
- comentários simples, sem editor rico.

### 6.3 Deslocamentos e Custos Extras

#### Escopo inicial

- Um módulo e uma listagem unificada;
- lançamento manual;
- tipo deslocamento ou custo extra;
- data, posto, responsável, assistência quando aplicável, motivo e valor;
- edição e detalhe;
- validação;
- filtros por período, posto, tipo e status;
- total simples do conjunto filtrado;
- histórico crítico e soft delete.

#### Sequência geral

1. Auditar a migration e as regras de assistência.
2. Definir tipos e service.
3. Criar listagem unificada e filtros.
4. Criar formulário manual.
5. Criar detalhe e edição.
6. Criar validação e remoção.
7. Criar totais simples.
8. Criar rotas.
9. Criar testes mínimos.
10. Executar verificações técnicas.

#### Simplificações mantidas

- Sem CSV nesta versão;
- sem e-mail;
- sem mapas ou distância automática;
- sem comissão;
- sem múltiplas aprovações;
- sem análise financeira avançada.

### 6.4 Administração mínima

#### Escopo inicial

- Usuários operacionais;
- perfil, cargo e estado;
- postos;
- vínculos usuário/posto;
- cargos/funções;
- tipos de ocorrência;
- prioridades;
- proteção do último administrador.

#### Sequência geral

1. Auditar as policies administrativas existentes.
2. Confirmar quais operações já funcionam por CRUD direto.
3. Confirmar a associação segura com identidades do Supabase Auth.
4. Criar navegação administrativa simples.
5. Criar telas de usuários e vínculos.
6. Criar tela de postos.
7. Criar CRUDs auxiliares reutilizando um formulário simples.
8. Integrar proteção do último administrador.
9. Criar rotas protegidas.
10. Criar testes mínimos.
11. Executar verificações técnicas.

#### Simplificações mantidas

- Sem tela central de auditoria;
- sem análise visual de impacto;
- sem fluxo complexo de aprovação;
- sem concorrência otimista universal;
- metas de eficiência somente se forem necessárias ao Dashboard mínimo.

### 6.5 Dashboard operacional

#### Escopo inicial

- Uma única tela;
- filtro de posto e período;
- assistências totais, executadas, pendentes e removidas;
- ocorrências abertas e atrasadas;
- tarefas pendentes, atrasadas e aguardando validação;
- lançamentos pendentes de validação;
- resumo simples por posto quando útil.

#### Sequência geral

1. Confirmar os significados dos contadores no banco.
2. Escolher consultas diretas ou uma RPC agregadora pequena.
3. Criar service do Dashboard.
4. Substituir o placeholder.
5. Criar cartões e resumos simples.
6. Integrar filtros.
7. Criar testes de agregação e escopo.
8. Executar verificações técnicas.

#### Simplificações mantidas

- Sem dashboards separados por perfil;
- sem gráficos complexos;
- sem ranking;
- sem previsão;
- sem BI;
- sem metas não confiáveis.

---

## 7. Paralelismo planejado

Considerando quatro posições de trabalho simultâneas, incluindo o agente
principal:

### Onda 1

| Frente           | Responsabilidade                                          |
| ---------------- | --------------------------------------------------------- |
| Agente principal | Fase 0, migrations, contratos compartilhados e integração |
| Agente 1         | Frontend de Tarefas e Rotinas                             |
| Agente 2         | Frontend de Ocorrências                                   |
| Agente 3         | Frontend de Deslocamentos e Custos                        |

Os agentes de módulo podem começar após o agente principal confirmar os schemas
e contratos mínimos. Correções de migration permanecem centralizadas.

### Onda 2

| Frente           | Responsabilidade                                         |
| ---------------- | -------------------------------------------------------- |
| Agente principal | Integração das três frentes, router e regressões         |
| Agente 1         | Administração mínima                                     |
| Agente 2         | Dashboard                                                |
| Agente 3         | Testes de banco e revisão de segurança dos módulos novos |

### Regras de coordenação

- Um único proprietário por arquivo compartilhado.
- Subagentes não alteram router, rotas globais ou migrations sem coordenação.
- Cada frente entrega código, testes e resumo de arquivos.
- O agente principal revisa e integra, não apenas concatena mudanças.
- Nenhuma frente declara conclusão sem evidência de teste.

---

## 8. Testes proporcionais ao risco

### Permitidos e esperados

- Vitest;
- React Testing Library com jsdom;
- testes de services com mocks;
- testes de componentes;
- consultas e verificações remotas pelo Supabase MCP;
- typecheck;
- lint;
- build.

### Proibidos nesta etapa

- Playwright;
- `npm run test:e2e`;
- controle de navegador;
- computer use;
- screenshots;
- smoke test visual automatizado;
- novas suítes E2E.

### Mínimo por módulo

1. Perfil e posto;
2. regra crítica do domínio;
3. fluxo principal do service;
4. formulário principal;
5. loading, vazio e erro;
6. proteção contra ação não autorizada.

Não fixar uma quantidade artificial de arquivos de teste. Criar apenas os
testes que protejam comportamento relevante.

---

## 9. Critério de conclusão por módulo

Um módulo só pode ser marcado como concluído quando:

- o schema remoto necessário existe e foi verificado;
- RLS e grants foram revisados;
- services usam dados reais;
- telas principais existem;
- rotas protegidas existem;
- placeholders foram removidos;
- regras de perfil e posto funcionam;
- ações críticas registram auditoria;
- testes permitidos relevantes passam;
- typecheck e lint passam para o escopo;
- build passa;
- limitações adiadas estão registradas.

A ausência de E2E não impede a conclusão técnica desta etapa. A homologação
visual será feita posteriormente pelo usuário.

---

## 10. Registro vivo de progresso

Atualizar esta tabela ao iniciar ou concluir uma frente.

| Data       | Frente                                       | Estado                 | Resultado/evidência                                                                                                                                                                                                             | Próximo passo                                                                      |
| ---------- | -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 03/07/2026 | Auditoria inicial do trabalho do Fable       | Concluída              | Quatro migrations remotas confirmadas; frontend não integrado                                                                                                                                                                   | Estabilizar migrations                                                             |
| 03/07/2026 | Plano vivo de execução                       | Concluído              | Documento criado; nenhum código alterado                                                                                                                                                                                        | Iniciar Fase 0                                                                     |
| 03/07/2026 | Reconciliação nominal de migrations          | Concluída              | Arquivos locais renomeados para as versões remotas já aplicadas                                                                                                                                                                 | Revisar contratos e permissões                                                     |
| 03/07/2026 | Execução paralela dos módulos operacionais   | Concluída              | Tarefas, Ocorrências e Lançamentos implementados e publicados em PRs empilhados                                                                                                                                                 | Validar integração final                                                           |
| 03/07/2026 | Fundação frontend                            | Concluída              | Rotas, navegação e contratos compartilhados integrados                                                                                                                                                                          | Manter enxuta                                                                      |
| 03/07/2026 | Tarefas e Rotinas                            | Concluída              | CRUD, permissões, telas e testes essenciais implementados; PR #14                                                                                                                                                               | Homologação operacional                                                            |
| 03/07/2026 | Ocorrências                                  | Concluída              | CRUD, escopo por posto, responsável validado e testes essenciais; PR #15                                                                                                                                                        | Homologação operacional                                                            |
| 03/07/2026 | Deslocamentos e Custos                       | Concluída              | Tipos reunidos no mesmo módulo, CRUD manual e testes essenciais; PR #16                                                                                                                                                         | Homologação operacional                                                            |
| 03/07/2026 | Administração                                | Concluída              | Usuários, postos, vínculos e cadastros auxiliares mínimos; PR #17                                                                                                                                                               | Homologação administrativa                                                         |
| 03/07/2026 | Dashboard                                    | Concluída              | Indicadores e listas operacionais conectados aos dados reais; PR #18                                                                                                                                                            | Homologação operacional                                                            |
| 03/07/2026 | Fechamento técnico                           | Concluído              | 55 arquivos/223 testes, typecheck e build aprovados; lint sem erros                                                                                                                                                             | Publicar PR final e homologar manualmente                                          |
| 03/07/2026 | Testes SQL dos módulos novos no banco remoto | Concluída              | 4 arquivos em `supabase/tests/*_fluxo.sql` executados com sucesso no projeto Doka (com rollback): permissões por perfil/posto, transições, recorrência idempotente, acúmulo, validação de lançamentos, último admin e auditoria | Homologação manual das telas pelo usuário                                          |
| 03/07/2026 | Complementação do PRD fundador               | Concluída              | Produtividade/eficiência, metas, Dashboard gerencial, auditoria central, históricos, filtros e obrigatoriedades integrados; migration remota `20260703061153` reconciliada localmente                                           | Homologação manual dos fluxos ampliados                                            |
| 04/07/2026 | Validação da auditoria de design system      | Concluída              | Diagnóstico confrontado com o código e plano priorizado em `docs/08-plano-tarefas-auditoria-design-system.md`; nenhuma tela alterada                                                                                            | Executar a fundação mínima DS-001 a DS-004                                         |
| 04/07/2026 | Catálogo de screenshots                      | Parcial                | 29 capturas em 1440x900 catalogadas em `docs/auditoria-visual/README.md`; detalhes/edições sem dados não foram simulados                                                                                                        | Executar análise visual e decidir se será criada massa descartável para as lacunas |
| 04/07/2026 | Redesign e consolidação do design system     | Concluída tecnicamente | Tokens reconciliados; componentes compartilhados aplicados; aliases, hex visual e tipografia numérica eliminados de `src/modules`; validações executadas sem browser/E2E                                                        | Homologar visualmente as rotas em etapa posterior                                  |
| 04/07/2026 | Redesign de interação 2.0                    | Concluída tecnicamente | Shell colapsável, topbar contextual, listas search-first, filtros e formulários em Drawer, chips, skeletons, paginação, menus e toasts implementados; plano registrado em `docs/09-redesign-interacao-frontend.md`              | Homologar visualmente e decidir composição de detalhe de Assistência sobre a lista |
| 05/07/2026 | Screenshots pós-redesign                     | Parcial                | 18 capturas válidas em 1440x900 adicionadas em `docs/auditoria-visual/screenshots/2026-07-05-pos-redesign`; capturas presas em loading foram descartadas e o navegador interno deixou de responder                                | Retomar as telas pendentes; decidir se pode ser criada massa visual para detalhes e edições sem registros |
| 06/07/2026 | Padronização profissional de componentes     | Parcial                | Plano criado em `docs/10-plano-padronizacao-componentes-profissionais.md`; raios e tracking do design system ajustados; foco, teclado e ARIA reforçados em primitives compartilhados; lint/design-system, typecheck, build e teste unitário focado passaram | Continuar migração/revisão por tela e homologar visualmente quando a restrição de browser/E2E for removida |
| 06/07/2026 | Migração UI de Tarefas/Rotinas               | Parcial                | Formulários migrados para `Input`, `Select`, `Textarea` e `Checkbox`; rotina/lista/detalhe usam `Page`, `PageHeader`, `TableFrame` e `StatusBadge`; CSS local de campos, tabela, status e media query antiga removido; typecheck, lint-design-system e testes focados passaram | Continuar nas próximas telas com controles nativos restantes, começando por Ocorrências e Lançamentos |
| 06/07/2026 | Migração UI de Ocorrências                   | Parcial                | Formulário, detalhe e tabela migrados para primitives compartilhados; CSS local de controles/tabela/status removido; teste `tests/integration/occurrence-form.test.tsx` criado; testes focados de Ocorrências e design system passaram | Continuar pelos controles nativos restantes em Lançamentos e pontos específicos de Importações |
| 06/07/2026 | Migração UI de Lançamentos                   | Parcial                | `RadioOption` criado; formulário, tabela e detalhe migrados para primitives compartilhados; CSS local de controles/tabela/status removido; testes focados de Lançamentos e design system passaram | Revisar controles restantes em Importações MMS, preservando `input[type=file]` como exceção permitida |
| 06/07/2026 | Migração UI de Importações MMS               | Parcial                | `CorrectionEditor` migrado para `Input`; varredura de controles nativos em `src/modules` agora aponta somente o `input[type=file]` encapsulado em `FileDropzone`, exceção permitida; testes focados de correção e arquivo passaram | Executar validações finais e manter homologação visual para etapa permitida |
| 06/07/2026 | Migração UI de Administração                 | Parcial                | Tabelas de usuários, postos, vínculos e metas migradas para `TableFrame`; CSS local de tabela/status/campo legado removido; `AdminFields.Field` removido; testes focados de Administração passaram | Continuar limpeza visual em Dashboard, Assistências e Importações, sem mexer em regras de negócio |

---

## 11. Instruções para retomada em outro chat

Ao retomar:

1. Ler este documento integralmente.
2. Ler o `AGENTS.md`.
3. Executar `git status --short`.
4. Não descartar arquivos não rastreados.
5. Confirmar o projeto remoto Supabase **Doka** pelo MCP.
6. Consultar o histórico remoto de migrations.
7. Verificar a última linha concluída no registro de progresso.
8. Continuar pelo próximo passo registrado.
9. Antes de implementar um módulo, detalhar neste documento as tarefas reais
   daquele módulo após revisar PRD, regras, migration e frontend existente.
10. Atualizar o registro ao final de cada etapa, inclusive em caso de bloqueio.

O próximo passo atual é homologar manualmente o redesign nas rotas catalogadas
em `docs/auditoria-visual/README.md`. A implementação técnica do plano
`docs/08-plano-tarefas-auditoria-design-system.md` foi concluída sem browser,
E2E ou homologação visual, conforme a restrição vigente do MVP.

### Complementação posterior do PRD fundador

Após a entrega enxuta, foram incorporados os requisitos mínimos adicionais:

- produtividade e eficiência diária, semanal e por período;
- confronto entre previstas, executadas, não executadas, pendentes, canceladas
  e removidas;
- metas e margem de frustração por posto;
- resumo por posto e alertas críticos no Dashboard;
- Histórico/Auditoria central e histórico contextual de tarefas, ocorrências e
  lançamentos;
- metas de eficiência na Administração;
- filtros adicionais e obrigatoriedades de formulários previstas no mapa de
  telas;
- atualização do tipo da tarefa e limpeza de campos opcionais.

Os status operacionais continuam sendo enums oficiais do domínio, não cadastros
livres, para preservar as transições e regras já protegidas no banco.
Responsáveis continuam sendo usuários operacionais, evitando um cadastro
paralelo sem função adicional.
### Atualizacao de 06/07/2026 - Migracao UI de Assistencias MMS

Estado parcial. `AssistanceTable` passou a delegar estrutura visual para
`TableFrame`; badges locais foram substituidos por `StatusBadge`; o detalhe
passou a usar `Page`; e o CSS local ficou restrito a composicao de filtros,
cabecalho legado, grids de fatos/valores e historico. Testes focados de
Assistencias MMS e design system passaram. Proximo passo: continuar limpeza
visual em Dashboard e Importacoes, mantendo homologacao visual para etapa
permitida.

### Atualizacao de 06/07/2026 - Migracao UI do Dashboard

Estado parcial. A tabela de produtividade por posto passou a usar `TableFrame`;
colunas numericas foram marcadas com `data-numeric`; CSS legado de filtros
nativos, tabela propria e counters antigos foi removido; e o CSS local ficou
restrito a grids, links de metricas, comparativo de produtividade e alertas.
Testes focados de Dashboard e design system passaram. Proximo passo: continuar
limpeza visual em Importacoes MMS, preservando `input[type=file]` como excecao
permitida.

### Atualizacao de 06/07/2026 - Migracao UI de Importacoes MMS

Estado parcial. `LotsTable` e as tabelas de erros/alertas do preview passaram a
usar `TableFrame`; colunas numericas foram marcadas com `data-numeric`; CSS
legado de tabela, tabs e inputs antigos foi removido; e o CSS local ficou
restrito a filtros, resumo do lote, largura minima de tabelas e itens brutos.
Testes focados de Importacoes MMS e design system passaram. O `input[type=file]`
do `FileDropzone` permanece como excecao permitida.

### Atualizacao de 06/07/2026 - Auditoria e refinamento do design system

Estado parcial. Eventos da auditoria passaram a usar `Card`; CSS local da
auditoria ficou restrito a timeline, filtros e comparacao JSON; e `Avatar`,
`Button`, `Drawer` e `Input` foram ajustados para remover valores visuais
literais remanescentes em favor dos tokens oficiais. `LoadingState` tambem foi
normalizado para tokens de raio e borda. Testes focados de rotas protegidas,
route guard e design system passaram.

### Atualizacao de 06/07/2026 - Comportamento de DropdownMenu

Estado parcial. `DropdownMenu` recebeu `aria-haspopup`, `aria-controls`, foco
inicial no primeiro item, fechamento por Escape com retorno de foco ao
disparador e navegacao por ArrowUp/ArrowDown/Home/End. Estados
`focus-visible` foram adicionados ao disparador e aos itens. Teste unitario de
design system passou a cobrir o contrato de teclado e foco do menu.

### Atualizacao de 09/07/2026 - Fundacao Tailwind v4 e shadcn/ui

Estado parcial. Tailwind CSS v4 foi adicionado de forma aditiva via
`@tailwindcss/vite`, sem preflight, preservando o CSS puro existente. A base
shadcn/ui foi isolada em `src/components/shadcn/ui`, com `components.json`,
alias `@/`, `cn()` em `src/lib/utils.ts` e tokens shadcn mapeados para as
variaveis oficiais Doka. A rota lazy `/app/design-system` foi criada como spec
viva inicial dos componentes tematizados. O lint do design system passou a
ignorar explicitamente diretorios shadcn, mantendo a protecao do CSS legado.
`npm run typecheck`, `npm run lint` e `npm run build` passaram; o build usa
`vite --configLoader native` para evitar falha do bundler de configuracao do
Vite com o binario nativo do Tailwind no Windows.
