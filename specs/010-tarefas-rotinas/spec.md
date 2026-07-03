# Feature Specification: Central de Tarefas, Rotinas Recorrentes e Estratégias Operacionais

**Feature Branch**: `010-tarefas-rotinas`

**Created**: 2026-07-01

**Status**: Ready for Planning

**Input**: User description: "Criar a Central de Tarefas, Rotinas Recorrentes e Estratégias Operacionais para cadastrar, atribuir, acompanhar, concluir, validar e reabrir atividades manuais, gerar tarefas recorrentes de forma idempotente e acumular pendências sem duplicação."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar e atribuir uma atividade manual (Priority: P1)

Supervisão e Direção/Administração precisam cadastrar tarefas avulsas ou
estratégias operacionais, definir contexto, prazo, prioridade e responsáveis
e acompanhar a atividade desde sua criação.

**Why this priority**: O cadastro manual é a fonte oficial do módulo e entrega a
unidade mínima de trabalho acompanhável antes de qualquer recorrência.

**Independent Test**: Criar uma tarefa com todos os campos obrigatórios,
atribuir um ou mais responsáveis elegíveis e confirmar que somente usuários
autorizados a consultam e alteram.

**Acceptance Scenarios**:

1. **Given** uma Supervisão com escopo no Posto A, responsáveis ativos desse
   escopo e cadastros ativos, **When** cria uma tarefa válida, **Then** a tarefa
   nasce como `pendente`, fica visível aos usuários autorizados e registra sua
   criação no histórico centralizado.
2. **Given** uma estratégia vinculada a pessoa, cargo/função ou posto, **When**
   ela é cadastrada, **Then** usa o mesmo fluxo de tarefa e não cria um fluxo
   paralelo de acompanhamento.
3. **Given** responsável, posto, cargo/função ou prioridade inexistente,
   inativo, removido ou fora do escopo, **When** o usuário tenta salvar,
   **Then** a operação é recusada sem criação parcial ou evento falso de
   sucesso.
4. **Given** uma tarefa com vários responsáveis, **When** a atribuição é salva,
   **Then** cada responsável aparece uma única vez e a autoria permanece
   distinta da responsabilidade.

---

### User Story 2 - Executar, validar e reabrir uma tarefa (Priority: P1)

Um responsável precisa iniciar e concluir sua atividade, enquanto Supervisão
ou Direção/Administração precisa validar tarefas que exigem conferência e
reabrir tarefas com justificativa quando necessário.

**Why this priority**: O ciclo de execução transforma o cadastro em controle
operacional verificável e evita que conclusão, validação e reabertura sejam
confundidas.

**Independent Test**: Percorrer o fluxo de uma tarefa simples e de outra que
exige validação, incluindo tentativas inválidas, repetição de ações e
reabertura.

**Acceptance Scenarios**:

1. **Given** uma tarefa `pendente` e um responsável autorizado, **When** ele
   inicia a atividade, **Then** o status muda para `em_andamento` uma única vez.
2. **Given** uma tarefa simples `em_andamento`, **When** um responsável
   autorizado a conclui, **Then** o status muda para `concluida` e o fluxo pode
   terminar sem validação.
3. **Given** uma tarefa que exige validação em `em_andamento`, **When** ela é
   concluída, **Then** permanece `concluida`, aparece na fila de Validação e
   aguarda ação autorizada.
4. **Given** uma tarefa `concluida` que exige validação, **When** Supervisão do
   escopo ou Direção/Administração valida, **Then** o status muda para
   `validada` e a validação identifica ator e momento.
5. **Given** uma tarefa `concluida` ou `validada`, **When** um perfil autorizado
   informa justificativa e reabre, **Then** o status muda para `reaberta`, as
   conclusões e validações anteriores permanecem no histórico e a retomada
   ocorre pelo fluxo permitido.
6. **Given** usuário não responsável, Operador tentando validar ou reabrir,
   tarefa removida ou transição incompatível, **When** a ação é solicitada,
   **Then** ela é bloqueada sem alterar o estado nem registrar sucesso.

---

### User Story 3 - Gerar e acumular rotinas sem duplicação (Priority: P1)

Supervisão e Direção/Administração precisam cadastrar rotinas recorrentes e
ter cada ocorrência prevista rastreada, gerada uma única vez ou acumulada sobre
a tarefa aberta anterior.

**Why this priority**: A recorrência confiável reduz acompanhamento manual sem
produzir tarefas duplicadas ou perder períodos previstos.

**Independent Test**: Cadastrar uma rotina, processar a mesma ocorrência mais
de uma vez, deixar sua tarefa aberta no período seguinte, concluir a pendência
acumulada e processar uma ocorrência futura.

**Acceptance Scenarios**:

1. **Given** uma rotina ativa dentro de sua vigência, **When** chega uma
   ocorrência prevista, **Then** uma execução rastreável e no máximo uma tarefa
   correspondente são registradas com os valores vigentes da rotina.
2. **Given** a mesma ocorrência já processada, **When** o processo é repetido,
   **Then** nenhuma execução ou tarefa adicional é criada.
3. **Given** a tarefa da ocorrência anterior ainda aberta, **When** chega a
   ocorrência seguinte, **Then** a execução seguinte é registrada como
   acumulada, referencia a mesma tarefa e não cria uma tarefa duplicada.
4. **Given** uma tarefa acumulada, **When** ela continua aberta, **Then** lista,
   kanban e calendário mostram a pendência e desde quando ocorre o acúmulo.
5. **Given** a tarefa acumulada concluída ou tratada, **When** chega uma
   ocorrência futura elegível, **Then** a rotina pode gerar uma nova tarefa
   normalmente.
6. **Given** uma rotina pausada, inativa, removida, encerrada ou fora da
   vigência, **When** uma data é avaliada, **Then** nenhuma nova tarefa é
   gerada e o histórico anterior permanece intacto.

---

### User Story 4 - Acompanhar o mesmo trabalho em três visualizações (Priority: P2)

Operação, Supervisão e Direção/Administração precisam alternar entre lista,
kanban e calendário sem mudar o conjunto autorizado, os filtros ou o significado
dos estados.

**Why this priority**: As visualizações atendem acompanhamento direto, gestão do
fluxo e planejamento temporal sobre a mesma fonte de dados.

**Independent Test**: Aplicar a mesma combinação de filtros nas três
visualizações e comparar tarefas, atrasos, acúmulos, ocorrências previstas e
ações disponíveis.

**Acceptance Scenarios**:

1. **Given** filtros e aba ativos, **When** o usuário alterna entre lista,
   kanban e calendário, **Then** encontra o mesmo conjunto autorizado e mantém
   o contexto de consulta.
2. **Given** uma tarefa cujo limite venceu e que continua aberta, **When** ela é
   exibida, **Then** aparece como atrasada sem alterar seu status oficial.
3. **Given** uma movimentação no kanban, **When** ela representa transição
   permitida ao usuário, **Then** produz o mesmo resultado do fluxo detalhado;
   caso contrário, é recusada.
4. **Given** o calendário, **When** exibe tarefa gerada, ocorrência futura e
   tarefa acumulada, **Then** distingue os três conceitos e a simples
   visualização não cria uma tarefa.
5. **Given** ausência de dados, filtros sem resultado, falha temporária, sessão
   inválida ou acesso negado, **When** uma visualização é aberta, **Then** cada
   condição apresenta estado próprio e não simula sucesso.

---

### User Story 5 - Preservar segurança, histórico e remoção lógica (Priority: P2)

Usuários autorizados precisam operar tarefas e rotinas dentro do próprio escopo,
e Supervisão ou Direção/Administração precisam investigar mudanças sem perda do
histórico.

**Why this priority**: O módulo controla trabalho de pessoas e precisa impedir
vazamento entre postos, alterações retroativas e perda de evidência.

**Independent Test**: Executar consultas e ações com os três perfis, por menu e
URL direta, alterar responsáveis, prazos e rotinas, remover logicamente um
registro e consultar seu histórico autorizado.

**Acceptance Scenarios**:

1. **Given** um Operador com postos vinculados, **When** consulta a Central,
   **Then** não recebe tarefas, rotinas ou execuções de postos fora de seu
   escopo.
2. **Given** Supervisão limitada aos Postos A e B, **When** consulta ou altera
   dados, **Then** somente itens desses postos são alcançados.
3. **Given** Direção/Administração ativa, **When** consulta o módulo, **Then**
   possui visão global e histórico completo conforme as políticas vigentes.
4. **Given** uma URL ou solicitação direta para item não autorizado, **When** o
   acesso ocorre, **Then** nenhum dado é exibido nem a existência do item é
   confirmada.
5. **Given** uma remoção lógica autorizada com justificativa, **When** ela é
   concluída, **Then** o item desaparece das visões operacionais padrão, não é
   apagado fisicamente e mantém execuções e histórico.

### Edge Cases

- Dois usuários editam a mesma tarefa ou rotina a partir da mesma versão.
- Dois responsáveis tentam concluir a mesma tarefa ao mesmo tempo.
- Validação e reabertura são solicitadas concorrentemente.
- O usuário clica duas vezes ou repete a mesma solicitação após resposta
  incerta.
- A sessão expira ou o usuário perde perfil, vínculo ou posto durante uma ação.
- A rotina é alterada enquanto uma ocorrência está sendo processada.
- O processamento falha entre registrar a ocorrência prevista e associar a
  tarefa.
- A mesma ocorrência é processada simultaneamente ou após indisponibilidade.
- A tarefa tem somente data, ou data e horário limite, no momento de mudança do
  dia operacional.
- O dia configurado não existe em determinado mês.
- A rotina muda de responsáveis, posto, prioridade, prazo ou validação após já
  ter gerado tarefas.
- Uma tarefa acumulada perde um responsável ou recebe novo responsável na
  rotina original.
- Uma rotina é pausada ou removida após ocorrências futuras serem exibidas, mas
  antes de serem processadas.
- Uma tarefa `validada` recebe tentativa de edição direta sem reabertura.
- Um registro removido logicamente recebe tentativa de transição, edição ou
  nova atribuição.
- A lista é carregada enquanto o estado muda em outra visualização.

## Requirements *(mandatory)*

### Constitution Alignment *(mandatory)*

- **MMS como fonte operacional externa**: a feature não lê, altera nem cria
  dependência funcional com dados MMS; tarefas, rotinas e estratégias têm
  cadastro manual como fonte oficial.
- **MVP operacional e escopo controlado**: a feature entrega somente o controle
  manual e recorrente aprovado. Dashboard funcional, notificações externas,
  anexos, chat, gamificação, automação complexa e integrações permanecem fora do
  escopo.
- **Perfil, posto e RLS**: a feature reutiliza os três perfis, postos, vínculos
  e funções de autorização vigentes. Toda entidade operacional nova respeita
  RLS; menu, botão ou rota nunca substituem a autorização dos dados.
- **Modelagem auditável em português**: entidades e atributos seguem o padrão
  vigente, remoção operacional usa soft delete e toda ação crítica usa
  `historico_auditoria`, sem histórico paralelo.
- **Importação MMS rastreável e idempotente**: a feature não altera importações
  MMS; aplica idempotência própria às ocorrências de rotinas sem reutilizar ou
  redefinir a chave operacional MMS.
- **Produto e interface**: a Central usa português brasileiro, o design system
  Doka e experiência desktop-first, com estados comunicados por texto e não
  somente por cor.

### Scope Boundaries

- O MVP mínimo implementável é o cadastro manual, atribuição, lista simples,
  execução, conclusão e segurança por perfil/posto da primeira e segunda
  histórias. A recorrência idempotente e o acúmulo formam o próximo incremento
  independente. Kanban, calendário e gestão visual completam a entrega exigida.
- Estratégia é um tipo de tarefa no mesmo fluxo operacional; não é um módulo nem
  uma fonte de dados paralela.
- A feature cria somente tarefas, responsáveis, rotinas e execuções previstas,
  reutilizando usuários, postos, vínculos, cargos/funções, prioridades, perfis,
  autorização e auditoria existentes.
- O Dashboard não é implementado. A feature apenas disponibiliza consultas
  autorizadas para tarefas de hoje, pendentes, atrasadas, aguardando validação e
  agrupamentos por posto, responsável e status.
- Ficam fora do escopo notificações por WhatsApp/e-mail, anexos, chat,
  gamificação, bonificação, distribuição inteligente, dependências, subtarefas,
  aprovação em várias etapas, horas trabalhadas, calendários externos,
  aplicativo mobile, integrações automáticas com ocorrências, assistências ou
  MMS, administração dos cadastros base e relatórios avançados.

### State Transition Rules

| Estado atual | Ação válida | Próximo estado | Condições principais |
| --- | --- | --- | --- |
| `pendente` | Iniciar | `em_andamento` | Responsável autorizado e tarefa ativa |
| `em_andamento` | Concluir | `concluida` | Responsável autorizado; com ou sem validação |
| `concluida` | Validar | `validada` | Exige validação e perfil autorizado no escopo |
| `concluida` | Reabrir | `reaberta` | Supervisão do escopo ou Direção/Administração; justificativa obrigatória |
| `validada` | Reabrir | `reaberta` | Supervisão do escopo ou Direção/Administração; justificativa obrigatória |
| `reaberta` | Retomar | `em_andamento` | Responsável autorizado e tarefa ativa |

Qualquer transição não listada é inválida. Tarefa `concluida` sem exigência de
validação encerra o fluxo até eventual reabertura. Tarefa `validada` não pode
ser editada ou concluída novamente sem reabertura. Soft delete não é estado e
bloqueia novas transições.

### Functional Requirements

- **FR-001**: O sistema MUST manter tarefas dos tipos `avulsa`, `rotina` e
  `estrategia` no mesmo fluxo operacional.
- **FR-002**: Cada tarefa MUST possuir título, descrição, tipo, posto,
  prioridade, prazo, indicação de validação, autor, status, controles de
  auditoria e soft delete.
- **FR-003**: Horário limite, cargo/função e observações MAY ser informados
  quando aplicáveis.
- **FR-004**: Toda tarefa MUST possuir ao menos um responsável elegível ou uma
  regra de atribuição válida previamente aprovada.
- **FR-005**: Uma tarefa MAY possuir vários responsáveis e MUST NOT aceitar
  duplicidade ativa do mesmo responsável.
- **FR-006**: Responsáveis MUST ser usuários ativos, não removidos e compatíveis
  com o posto e o escopo da tarefa.
- **FR-007**: Remover ou substituir responsável MUST preservar a atribuição
  anterior no histórico e registrar a mudança.
- **FR-008**: A interface MUST distinguir criador, responsáveis, concluinte,
  validador e responsável pela reabertura.
- **FR-009**: Para tarefa com vários responsáveis, qualquer responsável ativo e
  autorizado MUST poder concluir a tarefa inteira em nome do conjunto, com
  registro inequívoco de quem realizou a conclusão.
- **FR-010**: Nova tarefa MUST iniciar em `pendente` e respeitar exclusivamente
  as transições da seção State Transition Rules.
- **FR-011**: Tarefa simples concluída MUST permanecer `concluida` sem exigir
  validação.
- **FR-012**: Tarefa que exige validação MUST permanecer `concluida` e
  identificada como aguardando validação até ação autorizada.
- **FR-013**: Somente Supervisão dentro do escopo ou Direção/Administração MUST
  poder validar.
- **FR-014**: Somente Supervisão dentro do escopo ou Direção/Administração MUST
  poder reabrir tarefa, sempre com justificativa.
- **FR-015**: Reabertura MUST preservar todas as conclusões e validações
  anteriores e registrar ator, momento e justificativa.
- **FR-016**: Transição inválida, repetida ou concorrente MUST ser bloqueada sem
  duplicar efeitos nem registrar sucesso enganoso.
- **FR-017**: O sistema MUST calcular atraso sem alterar o status: tarefa está
  atrasada quando ultrapassa seu prazo e horário aplicável enquanto permanece
  `pendente`, `em_andamento` ou `reaberta`.
- **FR-018**: Para tarefa sem horário limite, o prazo expira ao final do dia
  operacional oficial; para tarefa com horário, expira no instante combinado de
  data e horário conforme a referência temporal oficial do projeto.
- **FR-019**: A condição de atraso MUST aparecer de forma coerente nos filtros,
  lista, kanban, calendário e consultas futuras de dashboard.
- **FR-020**: O sistema MUST manter rotinas com nome, descrição, posto,
  prioridade, responsáveis padrão, recorrência, horário limite opcional,
  exigência de validação, início, fim opcional, autor, estado e controles de
  auditoria e soft delete.
- **FR-021**: Cargo/função, dias da semana e dia do mês MUST ser exigidos somente
  quando aplicáveis à recorrência ou regra de atribuição escolhida.
- **FR-022**: Os estados oficiais da rotina MUST ser `ativa`, `pausada` e
  `inativa`; rotina pausada, inativa, removida, encerrada ou fora da vigência
  MUST NOT gerar nova tarefa.
- **FR-023**: As recorrências mínimas MUST incluir diária, semanal, mensal e
  personalizada. A recorrência personalizada MUST permitir intervalo
  configurável em dias, semanas ou meses e, quando aplicável, seleção de dias
  da semana ou dia do mês.
- **FR-024**: Quando o dia configurado não existir em determinado mês, a
  ocorrência mensal ou personalizada MUST ser prevista para o último dia
  calendário desse mês.
- **FR-025**: Após indisponibilidade, todas as ocorrências perdidas desde o
  último processamento confirmado MUST ser recuperadas em ordem cronológica,
  registradas individualmente e submetidas à regra de acúmulo para impedir
  tarefas duplicadas.
- **FR-026**: Cada ocorrência prevista de rotina MUST possuir registro próprio,
  data prevista, estado e vínculo com a tarefa quando houver.
- **FR-027**: Uma ocorrência prevista MUST produzir no máximo uma tarefa, mesmo
  sob processamento repetido, concorrente ou retomado.
- **FR-028**: A criação da ocorrência e sua associação a uma tarefa válida MUST
  ser indivisível do ponto de vista do usuário; falha intermediária MUST NOT
  deixar execução gerada sem tarefa válida nem múltiplas tarefas.
- **FR-029**: A tarefa gerada MUST herdar o posto, cargo/função, prioridade,
  responsáveis, prazo, horário e exigência de validação vigentes para aquela
  ocorrência.
- **FR-030**: Mudanças em rotina MUST afetar somente ocorrências futuras ainda
  não processadas e MUST NOT reescrever tarefas ou execuções anteriores.
- **FR-031**: Tarefas e execuções geradas MUST preservar os valores históricos
  usados na geração, mesmo após alteração dos cadastros ou da rotina.
- **FR-032**: Se a tarefa anterior da rotina permanecer aberta, a próxima
  ocorrência MUST ser registrada como `acumulada`, MUST referenciar a mesma
  tarefa e MUST NOT criar outra tarefa.
- **FR-033**: A execução acumulada MUST identificar desde quando a pendência
  está acumulada e preservar responsáveis e contexto histórico da tarefa.
- **FR-034**: Após a tarefa acumulada ser concluída ou tratada, uma ocorrência
  futura elegível MAY gerar nova tarefa; ocorrências acumuladas passadas MUST
  permanecer no histórico.
- **FR-035**: Repetir o processamento MUST NOT duplicar execução `acumulada`,
  tarefa, conclusão, validação, reabertura ou evento de sucesso.
- **FR-036**: O sistema MUST oferecer lista, kanban e calendário sobre o mesmo
  conjunto autorizado de tarefas, rotinas e execuções.
- **FR-037**: As três visualizações MUST compartilhar filtros por responsável,
  posto, cargo/função, status, atraso, prioridade, data/período, tipo, validação
  e origem.
- **FR-038**: A Central MUST oferecer os recortes Hoje, Pendentes, Atrasadas,
  Concluídas, Rotinas e Validação.
- **FR-039**: A lista MUST ordenar por prazo e prioridade, identificar atraso e
  acúmulo e apresentar somente ações autorizadas para o estado atual.
- **FR-040**: O kanban MUST usar colunas dos status oficiais; atraso MUST ser
  destaque, não coluna ou status adicional.
- **FR-041**: Movimentação no kanban MUST executar somente uma transição válida
  e MUST NOT contornar autorização ou validação.
- **FR-042**: O calendário MUST exibir tarefas por vencimento e ocorrências
  previstas por data, distinguindo tarefa gerada, ocorrência futura e tarefa
  acumulada.
- **FR-043**: Consultar ou navegar no calendário MUST NOT, por si só, gerar
  tarefa ou alterar execução.
- **FR-044**: Os formulários MUST validar campos obrigatórios, elegibilidade dos
  cadastros e escopo antes de salvar e MUST informar conflito de concorrência.
- **FR-045**: Alteração de rotina MUST informar que o impacto se limita a
  ocorrências futuras e MUST impedir alteração retroativa silenciosa.
- **FR-046**: O sistema MUST diferenciar carregamento, vazio, filtros sem
  resultado, erro temporário, sessão expirada e acesso negado.
- **FR-047**: Usuário autenticado sem perfil ativo MUST NOT acessar o módulo.
- **FR-048**: Operador MUST consultar somente tarefas atribuídas a ele e tarefas
  visíveis de seus postos conforme as regras vigentes; MUST NOT acessar postos
  não vinculados.
- **FR-049**: Operador MUST atualizar, iniciar e concluir somente tarefas
  permitidas; MUST NOT validar, reabrir, executar soft delete ou administrar
  rotinas.
- **FR-050**: Operador MUST NOT criar tarefas avulsas; sua atuação de escrita
  fica limitada a atualizar, iniciar e concluir tarefas permitidas.
- **FR-051**: Supervisão MUST consultar, criar e editar tarefas e rotinas,
  alterar responsáveis, validar, reabrir e executar soft delete com
  justificativa somente dentro de seu escopo.
- **FR-052**: Direção/Administração MUST possuir visão global e poder criar,
  editar, validar, reabrir, administrar rotinas, executar soft delete com
  justificativa e consultar histórico completo.
- **FR-053**: Toda consulta e mutação MUST revalidar perfil, posto,
  responsabilidade e estado persistido no momento da operação.
- **FR-054**: Acesso por menu, URL direta ou solicitação direta MUST produzir o
  mesmo resultado de autorização e MUST NOT revelar a existência de item fora
  do escopo.
- **FR-055**: Nenhuma decisão de autorização MUST confiar em perfil, usuário ou
  posto informados pelo cliente como prova de permissão.
- **FR-056**: Todas as tabelas operacionais do módulo MUST aplicar RLS e expor
  somente registros autorizados.
- **FR-057**: Nenhuma credencial privilegiada MUST estar disponível no
  navegador.
- **FR-058**: Criação, edição, mudança de responsáveis, início, conclusão,
  validação, reabertura, mudança de prazo, criação e alteração de rotina,
  geração, acúmulo, pausa, inativação e soft delete MUST gerar histórico
  centralizado após sucesso.
- **FR-059**: Operação recusada ou falha MUST NOT gerar auditoria falsa de
  sucesso.
- **FR-060**: Soft delete MUST exigir justificativa, MUST NOT ser representado
  como status, MUST ocultar o registro das visões padrão e MUST preservar
  tarefas concluídas, validações, execuções e histórico.
- **FR-061**: O sistema MUST detectar atualização baseada em estado antigo,
  preservar a versão mais recente e orientar recarregamento em vez de
  sobrescrever silenciosamente.
- **FR-062**: Após resposta incerta, o sistema MUST consultar o estado
  persistido antes de repetir efeitos ou apresentar sucesso.
- **FR-063**: A feature MUST disponibilizar consultas autorizadas para tarefas
  de hoje, pendentes, atrasadas, aguardando validação e agrupamentos por posto,
  responsável e status, sem implementar o Dashboard.
- **FR-064**: A interface MUST seguir o design system Doka, usar português
  brasileiro, foco visível, navegação por teclado, rótulos associados e
  comunicação que não dependa somente de cor.

### Permission Rules

| Perfil | Consulta | Tarefas | Rotinas | Validação e reabertura | Soft delete |
| --- | --- | --- | --- | --- | --- |
| Sem perfil ativo | Sem acesso | Sem acesso | Sem acesso | Sem acesso | Sem acesso |
| Operador | Atribuídas e visíveis nos postos autorizados | Atualiza/inicia/conclui apenas as permitidas; não cria | Sem administração | Não permitido | Não permitido |
| Supervisão | Postos do escopo | Cria, edita e altera responsáveis no escopo | Administra no escopo | Permitido no escopo | Permitido com justificativa no escopo |
| Direção/Administração | Global | Gestão global | Gestão global | Permitido globalmente | Permitido com justificativa |

### Key Entities *(include if feature involves data)*

- **Tarefa**: Atividade avulsa, gerada por rotina ou classificada como
  estratégia; contém contexto operacional, prazo, prioridade, validação,
  estado, autoria e rastreabilidade.
- **Responsabilidade de tarefa**: Vínculo histórico entre tarefa e usuário
  responsável, sem duplicidade ativa e distinto de autoria, conclusão,
  validação e reabertura.
- **Rotina**: Definição recorrente com contexto, responsáveis padrão,
  recorrência, vigência, estado e regras herdadas pelas ocorrências futuras.
- **Responsabilidade de rotina**: Vínculo entre rotina e responsáveis padrão
  elegíveis usados nas tarefas geradas.
- **Execução de rotina**: Ocorrência prevista, gerada, acumulada, concluída ou
  cancelada; registra a data esperada e a tarefa relacionada sem permitir
  duplicação.
- **Usuário, posto, vínculo, cargo/função e prioridade**: Entidades existentes
  reutilizadas para identidade, escopo, atribuição, classificação e ordenação.
- **Histórico de auditoria**: Fonte central existente para eventos críticos,
  valores anteriores e novos, ator, justificativa e contexto.

### Dependencies

- Spec 001: usuários, postos, vínculos, perfis, RLS, funções de autorização,
  soft delete e `historico_auditoria`.
- Spec 002: cargos/funções e prioridades ativas.
- Spec 005: sessão, rotas protegidas, acesso por URL, menu, layout e estados
  globais.
- Specs 001–008 permanecem contratos vigentes; a Spec 008 serve apenas como
  padrão atual de interface, sem dependência funcional com Assistências MMS.
- Design system oficial Doka para experiência desktop-first.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pelo menos 90% dos usuários de aceite criam uma tarefa válida,
  atribuem responsáveis e a localizam na Central em até 2 minutos, sem ajuda.
- **SC-002**: Em 100% dos testes com os três perfis e ao menos três postos,
  nenhum usuário consulta ou altera tarefa, rotina ou execução fora de seu
  escopo, inclusive por URL e solicitação direta.
- **SC-003**: 100% das transições válidas produzem exatamente um novo estado e
  um evento auditável; 100% das transições inválidas preservam o estado e não
  registram sucesso.
- **SC-004**: 100% das tarefas que exigem validação permanecem identificadas na
  fila de Validação até ação autorizada.
- **SC-005**: Em processamento repetido e concorrente de pelo menos 1.000
  ocorrências previstas, cada ocorrência gera no máximo uma tarefa e nenhum
  efeito operacional é duplicado.
- **SC-006**: Em 100% dos cenários de acúmulo, a ocorrência seguinte referencia
  a tarefa aberta anterior, nenhuma tarefa duplicada é criada e o início do
  acúmulo permanece rastreável.
- **SC-007**: Lista, kanban e calendário apresentam o mesmo conjunto autorizado
  em 100% das combinações equivalentes de filtros testadas.
- **SC-008**: 100% das tarefas vencidas abertas são identificadas como
  atrasadas sem alteração do status oficial, incluindo tarefas somente com data
  e tarefas com horário limite.
- **SC-009**: Pelo menos 95% das consultas e mudanças de filtro apresentam
  resultado ou progresso em até 2 segundos com 10.000 tarefas no escopo de
  aceite.
- **SC-010**: Em testes de usabilidade, pelo menos 90% dos participantes
  distinguem sem ajuda tarefa gerada, ocorrência futura, tarefa acumulada,
  tarefa concluída aguardando validação e tarefa validada.
- **SC-011**: 100% das alterações em rotina preservam tarefas e execuções
  anteriores e afetam somente ocorrências futuras elegíveis.
- **SC-012**: 100% das remoções lógicas autorizadas desaparecem das visões
  padrão e preservam histórico e execuções anteriores.
- **SC-013**: 100% das telas testadas distinguem carregamento, vazio, filtros
  sem resultado, erro, sessão expirada e acesso negado sem apresentar falso
  sucesso.
- **SC-014**: Nenhum cenário de aceite implementa Dashboard, notificação
  externa, integração automática, histórico paralelo ou outro item fora do
  escopo.

## Assumptions

- Cadastro manual é a fonte oficial de tarefas, rotinas e estratégias.
- As Specs 001–008 são contratos vigentes e prevalecem para identidade, perfis,
  postos, cadastros base, autenticação, autorização e auditoria.
- Direção/Administração possui escopo global sem depender de vínculo individual
  com posto; Supervisão e Operador dependem de escopo ativo.
- `concluida` é estado final operacional para tarefa simples e estado de espera
  para tarefa que exige validação; `validada` é final até eventual reabertura.
- Tarefa concluída, inclusive aguardando validação, não permanece atrasada; o
  atraso mede execução pendente, em andamento ou reaberta.
- Alterações de responsáveis em uma rotina valem para ocorrências futuras; uma
  tarefa acumulada mantém os responsáveis e o contexto histórico já atribuídos.
- A experiência refinada para celular permanece fora do ciclo, mas os fluxos
  críticos mantêm acessibilidade básica.
- Detalhes de agendamento, processamento, persistência e estrutura de código
  pertencem ao planejamento.
