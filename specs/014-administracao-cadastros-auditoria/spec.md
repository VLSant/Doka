# Feature Specification: Administração, Cadastros, Usuários, Permissões e Auditoria

**Feature Branch**: `014-administracao-cadastros-auditoria`

**Created**: 2026-07-01

**Status**: Ready for Planning

**Input**: User description: "Criar as interfaces administrativas do MVP para gerenciar usuários operacionais, postos, vínculos usuário/posto, cargos/funções, prioridades, tipos de ocorrência e metas de eficiência, além de disponibilizar uma consulta centralizada e segura do histórico de auditoria."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrar usuários e permissões operacionais (Priority: P1)

Direção/Administração precisa localizar usuários, manter seus dados operacionais,
perfil oficial, cargo, estado e vínculos com postos sem manipular credenciais e
sem deixar o Doka sem um administrador ativo.

**Why this priority**: Usuários e permissões determinam quem pode acessar toda a
operação. Erros nesse fluxo podem bloquear a equipe ou ampliar acesso indevido.

**Independent Test**: Usar identidades autenticadas e usuários operacionais
existentes para consultar, cadastrar ou associar, editar, ativar, inativar e
alterar perfil, cargo e vínculos; validar escopo, concorrência, auditoria e
proteção do último administrador.

**Acceptance Scenarios**:

1. **Given** uma Direção/Administração ativa, **When** pesquisa e filtra usuários,
   **Then** encontra registros por nome, e-mail, perfil, estado, cargo e posto,
   incluindo removidos somente quando seleciona explicitamente a revisão
   administrativa.
2. **Given** uma identidade elegível, **When** o cadastro operacional é
   concluído conforme o fluxo aprovado, **Then** existe no máximo um usuário
   operacional ativo associado à identidade e nenhuma senha, sessão, token ou
   segredo é exibido ou armazenado.
3. **Given** uma mudança de perfil, cargo, estado ou vínculo, **When** a operação
   é salva, **Then** a autorização é revalidada conforme a Spec 005 e a alteração
   fica registrada no histórico central.
4. **Given** que uma ação removeria ou inativaria o último
   `direcao_admin` ativo, **When** alguém tenta confirmá-la, **Then** a operação
   é recusada sem alterar o acesso existente e sem evento falso de sucesso.
5. **Given** dois administradores editando o mesmo usuário, **When** o segundo
   tenta salvar uma versão desatualizada, **Then** o sistema preserva a versão
   atual e apresenta o conflito para recarregamento.
6. **Given** Operador ou usuário fora do escopo, **When** abre a rota diretamente
   ou envia uma alteração, **Then** nenhum dado administrativo protegido é
   revelado e nenhuma mudança é aplicada.

---

### User Story 2 - Administrar postos e vínculos de acesso (Priority: P1)

Direção/Administração precisa manter postos e os vínculos entre usuários e
postos, compreendendo dependências e impactos antes de inativar ou remover um
registro que delimita acesso operacional.

**Why this priority**: Posto é a principal fronteira de escopo. Um vínculo
incorreto pode expor dados ou interromper trabalho operacional.

**Independent Test**: Criar e editar postos, adicionar e remover vínculos com
cada nível oficial e tentar inativar ou remover postos com dependências,
validando autorização, efeitos na próxima revalidação e auditoria.

**Acceptance Scenarios**:

1. **Given** uma Direção/Administração autorizada, **When** cria ou edita nome,
   código e descrição de um posto, **Then** as restrições vigentes são aplicadas
   e o histórico registra o resultado.
2. **Given** um usuário e posto ativos, **When** é criado vínculo com nível
   `operacional`, `supervisao` ou `consulta`, **Then** o escopo resultante segue
   os contratos vigentes e duplicidade ativa de usuário/posto é recusada.
3. **Given** um vínculo removido logicamente, **When** a sessão é revalidada,
   **Then** o acesso correspondente deixa de existir sem apagar o histórico.
4. **Given** um posto com usuários, metas ou registros operacionais dependentes,
   **When** sua inativação ou remoção é solicitada, **Then** os impactos são
   apresentados antes da confirmação e nenhuma exclusão em cascata é realizada.
5. **Given** um posto inativo ou removido, **When** alguém tenta usá-lo em novo
   vínculo, meta ou registro operacional, **Then** a operação é recusada.
6. **Given** uma tentativa de conceder escopo superior ao do ator, **When** a
   alteração é enviada, **Then** ela é recusada pela autorização vigente.

---

### User Story 3 - Administrar cargos e cadastros auxiliares (Priority: P1)

Usuários autorizados precisam manter cargos/funções, prioridades, tipos de
ocorrência e metas de eficiência usando os cadastros existentes, sem criar
listas paralelas ou reescrever referências históricas.

**Why this priority**: Esses cadastros alimentam tarefas, ocorrências e
indicadores. Consistência e escopo precisam estar definidos antes do uso
operacional.

**Independent Test**: Manter cada cadastro, validar duplicidades, estados,
vigências, dependências e permissões dos três perfis, e comprovar que módulos
consumidores continuam referenciando registros históricos.

**Acceptance Scenarios**:

1. **Given** uma Direção/Administração, **When** cria, edita, ativa, inativa ou
   remove logicamente cargo/função, prioridade ou tipo de ocorrência, **Then**
   as validações específicas são aplicadas e o histórico é preservado.
2. **Given** uma Supervisão no próprio escopo, **When** cria ou mantém uma meta
   válida para posto autorizado, **Then** a operação é permitida; para posto
   fora do escopo, é recusada.
3. **Given** uma meta ativa com mesma combinação de posto, tipo de atividade e
   período sobreposto, **When** outra meta conflitante é salva ou reativada,
   **Then** a operação é recusada.
4. **Given** prioridade ou tipo de ocorrência inativo ou removido, **When** um
   formulário operacional solicita opções novas, **Then** o item não aparece,
   mas referências históricas existentes permanecem legíveis.
5. **Given** um Operador, **When** acessa um módulo consumidor, **Then** pode
   consultar somente opções ativas autorizadas e não acessa as telas de gestão.
6. **Given** uma Supervisão, **When** tenta gerenciar prioridade ou tipo de
   ocorrência global, **Then** a operação é recusada conforme a Spec 002.

---

### User Story 4 - Consultar histórico e auditoria com segurança (Priority: P1)

Direção/Administração e Supervisão precisam pesquisar eventos centralizados,
compreender o que mudou e navegar ao registro relacionado quando ainda existir e
continuar autorizado.

**Why this priority**: A administração altera acesso e dados estruturantes; a
rastreabilidade central é necessária para investigar mudanças e responder a
incidentes sem expor segredos.

**Independent Test**: Consultar eventos de entidades globais e vinculadas a
posto com os três perfis, combinar filtros, abrir detalhes e tentar navegar para
registros existentes, removidos, inexistentes e fora do escopo.

**Acceptance Scenarios**:

1. **Given** Direção/Administração, **When** abre a consulta geral, **Then**
   visualiza eventos autorizados do mais recente para o mais antigo e pode
   filtrar por entidade, identificador, ator, período, ação, módulo, posto,
   assistência, ocorrência, tarefa e importação.
2. **Given** uma Supervisão, **When** consulta o histórico, **Then** visualiza
   somente eventos operacionais com contexto comprovadamente dentro do próprio
   escopo; evento global ou sem contexto de posto suficiente não é exibido.
3. **Given** um Operador, **When** tenta abrir a consulta geral pelo menu ou URL,
   **Then** recebe acesso negado e nenhum evento é carregado.
4. **Given** um evento autorizado, **When** abre o detalhe, **Then** vê entidade,
   identificador, ação, ator, data, valores anterior e novo e apenas metadados
   permitidos em formato compreensível.
5. **Given** valor ou metadata contendo senha, token, segredo, credencial,
   autorização de recuperação ou dado MMS restrito, **When** o detalhe é
   exibido, **Then** o conteúdo sensível é omitido ou protegido.
6. **Given** uma navegação para registro relacionado, **When** o destino é
   solicitado, **Then** a autorização atual é revalidada; registro removido ou
   inexistente não apaga nem invalida o evento histórico.

---

### User Story 5 - Operar formulários e listagens administrativas confiáveis (Priority: P2)

Usuários autorizados precisam usar listagens e formulários em português
brasileiro, acessíveis e resistentes a falhas, repetição e mudanças
concorrentes.

**Why this priority**: A camada administrativa reúne ações de alto impacto; os
estados de interface devem evitar duplicidade, falso sucesso e decisões sem
contexto.

**Independent Test**: Percorrer todas as telas por teclado, combinar filtros,
simular vazio, erro, acesso negado, sessão expirada, clique duplo, resposta
incerta e conflito concorrente.

**Acceptance Scenarios**:

1. **Given** qualquer listagem administrativa, **When** carrega, não encontra
   dados, não encontra resultados filtrados ou sofre erro, **Then** apresenta
   estados distintos e uma ação segura de recuperação.
2. **Given** um formulário com erro de campo, **When** o envio é recusado,
   **Then** a mensagem aparece junto ao campo e o estado seguro já preenchido é
   preservado.
3. **Given** uma ação destrutiva, **When** é iniciada, **Then** exige confirmação
   e, quando crítica, justificativa antes de executar.
4. **Given** clique duplo, repetição de solicitação ou resposta incerta, **When**
   o fluxo continua, **Then** o estado persistido é consultado antes de repetir
   efeitos ou apresentar sucesso.
5. **Given** perda de sessão, perfil ou escopo durante edição, **When** o usuário
   salva, **Then** a autorização é revalidada e a operação é recusada sem efeito
   quando não for mais permitida.
6. **Given** navegação por teclado, **When** o usuário percorre controles,
   diálogos e resultados, **Then** a ordem é utilizável, o foco é visível e
   nenhuma informação depende apenas de cor.

### MVP da Feature

O MVP mínimo implementável inclui as User Stories 1 a 4: gestão segura de
usuários/permissões, postos/vínculos, cadastros auxiliares e consulta central de
auditoria. A User Story 5 define os requisitos transversais obrigatórios dessas
telas e não constitui módulo independente.

### Edge Cases

- Duas pessoas editam simultaneamente o mesmo usuário, perfil, posto, cargo ou
  cadastro auxiliar.
- A ação atual inativaria ou removeria o último Direção/Administração ativo.
- O próprio administrador tenta retirar seu acesso crítico sem outro
  administrador ativo.
- Um usuário, posto ou vínculo é inativado enquanto o formulário está aberto.
- Inclusões concorrentes tentam criar o mesmo vínculo usuário/posto.
- Um posto com assistências, importações, tarefas ou metas é inativado ou
  removido logicamente.
- Uma meta aberta ou limitada sobrepõe total ou parcialmente outra vigência.
- Uma recriação após soft delete conflita com registro ativo equivalente.
- Um vínculo removido é apresentado historicamente, mas não concede acesso.
- A sessão expira ou o perfil/escopo muda durante consulta ou mutação.
- O usuário tenta acessar rota, registro ou ação fora do escopo por URL,
  parâmetros manipulados ou solicitação direta.
- Uma resposta mutável fica incerta ou é repetida após atualização da página.
- Um evento de auditoria não possui contexto de posto ou referencia entidade
  removida/inexistente.
- Valores auditados contêm campos sensíveis ou dados técnicos restritos.
- Filtros combinados não retornam resultados ou a coleção muda entre páginas.

## Requirements *(mandatory)*

### Constitution Alignment *(mandatory)*

- **MMS como fonte operacional externa**: a feature não altera MMS, `raw_json`,
  chave operacional, correspondência de Área de Trabalho ou regra de
  `removido`; cadastros administrativos não substituem dados oficiais MMS.
- **MVP operacional e escopo controlado**: a feature entrega somente
  administração essencial e consulta de auditoria. Não cria hierarquia avançada,
  permissões por campo, módulos operacionais, dashboards ou integrações.
- **Perfil, posto e RLS**: os perfis `operador`, `supervisao` e
  `direcao_admin`, os vínculos, níveis e regras de autorização das Specs 001,
  002 e 005 permanecem vigentes; menu e rota não substituem autorização de
  dados.
- **Modelagem auditável em português**: a feature reutiliza entidades em
  português, diferencia inativação, soft delete, status operacional e remoção
  de vínculo, e usa exclusivamente `historico_auditoria`.
- **Importação MMS rastreável e idempotente**: lotes e evidências MMS são apenas
  fontes de eventos consultáveis conforme autorização; nenhuma regra de
  importação é redefinida.
- **Produto e interface**: todas as telas usam português brasileiro, design
  system Doka, experiência desktop-first, acessibilidade por teclado, foco
  visível e comunicação não dependente somente de cor.

### Scope Boundaries

- A feature implementa interfaces, consultas, validações e fluxos sobre
  `usuarios`, `postos`, `usuarios_postos`, `cargos_funcoes`, `prioridades`,
  `tipos_ocorrencia`, `metas_eficiencia` e `historico_auditoria` existentes.
- Não existe cadastro separado de responsáveis: módulos consumidores usam
  usuários existentes elegíveis por perfil, estado, cargo e posto.
- Não existe cadastro genérico de status: cada módulo mantém seus estados
  oficiais.
- Não são criados novos perfis, entidades administrativas paralelas, histórico
  paralelo, RLS paralelo ou outro modelo de soft delete.
- Restauração de registro removido permanece indisponível no MVP até existir
  regra explícita aprovada para a entidade; reativação de registro apenas
  inativo continua distinta de restauração.
- Provisionamento de autenticação, se aprovado, não redefine login, sessão ou
  recuperação de senha da Spec 005.
- Ficam fora do escopo tarefas, rotinas, ocorrências, custos, produtividade,
  dashboards, BI, exportação avançada, aplicativo mobile, DELETE físico e
  mudanças MMS.

### Permission Rules

| Área/Ação | Operador | Supervisão | Direção/Administração |
| --- | --- | --- | --- |
| Área administrativa | Sem acesso | Acesso somente às áreas explicitamente autorizadas | Acesso global |
| Usuários | Sem acesso | Consulta do próprio escopo, sem gestão | Gestão global |
| Postos | Sem acesso administrativo | Consulta do próprio escopo, sem gestão | Gestão global |
| Vínculos usuário/posto | Sem acesso | Consulta do próprio escopo, sem gestão | Gestão global |
| Cargos/funções | Consulta de ativos em módulos consumidores | Consulta de ativos, sem gestão | Gestão global |
| Prioridades | Consulta de ativos em módulos consumidores | Consulta de ativos | Gestão global |
| Tipos de ocorrência | Consulta de ativos em módulos consumidores | Consulta de ativos | Gestão global |
| Metas de eficiência | Consulta de ativas nos postos autorizados | Gestão somente nos postos do escopo | Gestão global |
| Auditoria geral | Sem acesso | Consulta operacional do próprio escopo | Consulta global |
| Soft delete | Não permitido | Somente onde houver permissão explícita | Permitido quando aplicável, com justificativa crítica |

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar entradas administrativas para
  Usuários e Permissões, Postos, Cargos e Funções, Prioridades, Tipos de
  Ocorrência, Metas de Eficiência e Histórico/Auditoria conforme perfil.
- **FR-002**: Ocultar entrada de menu MUST NOT substituir autorização de rota,
  ação ou dados.
- **FR-003**: Acesso pelo menu e por URL direta MUST produzir o mesmo resultado
  de autorização e MUST NOT revelar conteúdo protegido.
- **FR-004**: Toda consulta ou mutação MUST revalidar sessão, usuário operacional,
  perfil e escopo aplicável.
- **FR-005**: O sistema MUST usar somente os perfis oficiais `operador`,
  `supervisao` e `direcao_admin`.
- **FR-006**: O sistema MUST NOT confiar em ator, perfil, posto ou escopo
  informados livremente pelo cliente como prova de autorização.
- **FR-007**: Operações administrativas privilegiadas MUST ocorrer por fronteira
  segura e MUST NOT expor credencial privilegiada ou segredo no navegador.
- **FR-008**: O sistema MUST bloquear usuário sem perfil operacional ativo,
  inativo, removido ou sem escopo válido conforme a Spec 005.

- **FR-009**: A gestão de usuários MUST listar, pesquisar por nome/e-mail e
  filtrar por perfil, estado, cargo/função e posto vinculado.
- **FR-010**: A gestão de usuários MUST permitir abrir detalhe, consultar
  vínculos e histórico administrativo e executar somente ações autorizadas.
- **FR-011**: O fluxo “Cadastrar usuário” MUST apenas associar o usuário
  operacional a uma identidade `auth.users` previamente criada e MUST NOT
  criar, convidar ou provisionar identidades de autenticação.
- **FR-012**: Cada identidade autenticada MUST possuir no máximo um usuário
  operacional ativo associado.
- **FR-013**: O cadastro operacional MUST NOT exibir, editar, persistir ou
  auditar senha, sessão, token, segredo, autorização de recuperação ou
  credencial.
- **FR-014**: Direção/Administração MUST poder editar nome operacional, perfil
  oficial, cargo/função e estado do usuário globalmente.
- **FR-015**: Mudança de perfil, cargo, estado ou vínculo MUST produzir efeito
  na próxima revalidação segura conforme a Spec 005.
- **FR-016**: Inativar ou remover usuário MUST preservar autoria, referências e
  histórico existentes.
- **FR-017**: O sistema MUST impedir que qualquer ação deixe o projeto sem ao
  menos um `direcao_admin` ativo, não removido e com identidade operacional
  válida.
- **FR-018**: Autoalteração crítica MUST ser bloqueada quando eliminar o último
  acesso administrativo válido.
- **FR-019**: Alterações concorrentes do mesmo usuário MUST ser detectadas e
  MUST NOT sobrescrever silenciosamente o estado mais recente.

- **FR-020**: A gestão de postos MUST listar, pesquisar e filtrar registros
  ativos, inativos e removidos.
- **FR-021**: Direção/Administração MUST poder criar e editar nome, código e
  descrição, ativar, inativar e remover logicamente posto quando permitido.
- **FR-022**: O detalhe do posto MUST apresentar usuários, metas e uso
  operacional relevante vinculados antes de uma ação crítica.
- **FR-023**: Posto inativo ou removido MUST NOT ser usado em novos vínculos,
  metas ou registros operacionais.
- **FR-024**: Inativar ou remover posto MUST NOT apagar nem alterar em cascata
  assistências, importações, tarefas, metas, vínculos históricos ou auditoria.
- **FR-025**: A administração de postos MUST preservar as regras vigentes de
  correspondência MMS e MUST NOT criar equivalência automática de nomes.
- **FR-026**: O código e a identificação do posto MUST respeitar unicidade e
  normalização vigentes.

- **FR-027**: A interface de vínculos MUST permitir consultar postos do usuário
  e usuários do posto, adicionar vínculo e selecionar nível `operacional`,
  `supervisao` ou `consulta`.
- **FR-028**: O sistema MUST impedir duplicidade ativa de
  `usuario_id + posto_id`.
- **FR-029**: Novo vínculo MUST exigir usuário e posto ativos, não removidos e
  compatíveis com o escopo do ator.
- **FR-030**: Remoção de vínculo MUST ser lógica, preservar autor/data/histórico
  e revogar o acesso na próxima revalidação.
- **FR-031**: Usuário MUST NOT conceder nível ou posto fora do próprio escopo
  autorizado.
- **FR-032**: Restauração de vínculo removido MUST permanecer indisponível sem
  regra explícita aprovada.
- **FR-033**: Inclusões concorrentes MUST NOT criar vínculos ativos duplicados.

- **FR-034**: A gestão de cargos/funções MUST listar, pesquisar, criar, editar,
  ativar, inativar, remover logicamente e consultar usuários, uso e histórico
  conforme autorização.
- **FR-035**: Nome de cargo/função MUST ser obrigatório, normalizado e único
  entre registros ativos equivalentes.
- **FR-036**: Cargo/função inativo ou removido MUST NOT aparecer em novas
  seleções.
- **FR-037**: Inativar ou remover cargo/função MUST NOT reescrever usuários,
  tarefas, rotinas ou referências históricas.
- **FR-038**: Para usuários, postos, vínculos e cargos/funções, Supervisão MUST
  ficar restrita à consulta do próprio escopo e MUST NOT criar, editar, ativar,
  inativar, remover, restaurar ou alterar vínculos, perfis ou permissões.

- **FR-039**: A gestão de prioridades MUST reutilizar integralmente validações,
  permissões, estados, soft delete e auditoria da Spec 002.
- **FR-040**: Somente Direção/Administração MUST gerenciar prioridades;
  Supervisão e Operador MUST consultar apenas ativas em módulos consumidores.
- **FR-041**: Prioridade MUST exigir nome, nível positivo e cor válida e MUST
  rejeitar nome normalizado ativo ou nível ativo duplicado.
- **FR-042**: A gestão de tipos de ocorrência MUST reutilizar integralmente
  validações, permissões, estados, soft delete e auditoria da Spec 002.
- **FR-043**: Somente Direção/Administração MUST gerenciar tipos de ocorrência;
  Supervisão e Operador MUST consultar apenas ativos em módulos consumidores.
- **FR-044**: Tipo de ocorrência MUST rejeitar nome normalizado ativo duplicado,
  e Reclamação MUST permanecer um tipo, não um módulo separado.
- **FR-045**: Inativar ou remover prioridade ou tipo MUST preservar referências
  históricas e MUST NOT criar ou alterar ocorrências/tarefas.

- **FR-046**: A gestão de metas MUST listar e combinar filtros por posto, tipo de
  atividade, vigência e estado.
- **FR-047**: Meta MUST possuir posto, tipo de atividade normalizado, percentual,
  início, fim opcional e estado ativo.
- **FR-048**: Percentual MUST ser maior que zero e no máximo 100.
- **FR-049**: Fim da vigência MUST ser igual ou posterior ao início.
- **FR-050**: O sistema MUST rejeitar sobreposição de vigências ativas para o
  mesmo posto e tipo de atividade, inclusive em reativação e concorrência.
- **FR-051**: Nova meta ou reativação MUST rejeitar posto inexistente, inativo
  ou removido.
- **FR-052**: Direção/Administração MUST gerenciar metas globalmente;
  Supervisão MUST gerenciar somente nos próprios postos; Operador MUST apenas
  consultar metas ativas autorizadas em módulos consumidores.
- **FR-053**: A gestão de metas MUST reutilizar integralmente validações,
  permissões, estados, soft delete e auditoria da Spec 002.

- **FR-054**: O sistema MUST diferenciar `ativo/inativo`, soft delete, status
  operacional e remoção de vínculo em textos, filtros e ações.
- **FR-055**: Inativação MUST NOT ser tratada como soft delete, e soft delete
  MUST NOT ser tratado como status operacional.
- **FR-056**: Nenhum fluxo comum MUST executar DELETE físico.
- **FR-057**: Soft delete MUST preencher os controles vigentes e MUST exigir
  justificativa para exclusões críticas.
- **FR-058**: Registros removidos MUST ficar ocultos nas consultas padrão;
  Direção/Administração MAY incluí-los explicitamente para revisão.
- **FR-059**: Soft delete MUST preservar histórico e referências existentes.
- **FR-060**: Restauração de registro removido MUST NOT ser presumida ou
  apresentada sem regra explícita aprovada.

- **FR-061**: A consulta geral MUST usar `historico_auditoria` como única fonte
  central e MUST NOT criar histórico paralelo.
- **FR-062**: Eventos MUST ser listados do mais recente para o mais antigo, com
  paginação ou carregamento progressivo e ordenação estável.
- **FR-063**: A consulta MUST pesquisar por entidade e identificador e combinar
  filtros por ator, período, ação, módulo/entidade, posto, assistência,
  ocorrência, tarefa e importação.
- **FR-064**: Direção/Administração MUST consultar o histórico completo
  autorizado; Supervisão MUST consultar somente histórico operacional do
  próprio escopo; Operador MUST NOT acessar a tela geral.
- **FR-065**: Ausência de contexto de posto MUST NOT tornar evento global
  visível para Supervisão.
- **FR-066**: Filtros MUST restringir resultados e MUST NOT ampliar visibilidade.
- **FR-067**: O detalhe MUST apresentar entidade, identificador, ação, ator,
  data, valor anterior, valor novo e metadata permitida de modo compreensível.
- **FR-068**: Senha, token, segredo, credencial e autorização de recuperação
  MUST nunca ser exibidos.
- **FR-069**: `raw_json` e dados técnicos MMS MUST permanecer sujeitos às
  restrições das specs correspondentes.
- **FR-070**: Eventos MUST ser imutáveis e MUST NOT ser removidos por operação
  comum.
- **FR-071**: Navegação ao registro relacionado MUST revalidar autorização e
  MUST tratar registro removido ou inexistente sem perder o evento.

- **FR-072**: Criação, edição, ativação, inativação, mudança de perfil/cargo,
  criação/alteração/remoção de vínculo e soft delete MUST registrar auditoria
  central após sucesso.
- **FR-073**: Evento MUST identificar entidade, identificador, ação, ator,
  valores anterior/novo, contexto e data/hora quando aplicáveis.
- **FR-074**: Operação bloqueada ou malsucedida MUST NOT gerar evento de
  sucesso.
- **FR-075**: Tentativa administrativa bloqueada MUST ser registrada somente
  quando o modelo vigente possuir ação segura e canônica para esse evento.

- **FR-076**: Listagens MUST distinguir carregamento, vazio, filtros sem
  resultado, erro temporário, acesso negado, item inativo/removido e conflito.
- **FR-077**: Listagens MUST ter filtros combináveis, ordenação consistente,
  paginação ou carregamento progressivo e atualização após operação.
- **FR-078**: Formulários MUST usar PT-BR, labels claras, indicação de
  obrigatoriedade e validação junto ao campo.
- **FR-079**: Formulários MUST impedir envio duplicado, preservar estado seguro
  em falha recuperável e confirmar ações destrutivas.
- **FR-080**: Formulários MUST funcionar por teclado, exibir foco visível e
  MUST NOT depender somente de cor.
- **FR-081**: Toda mutação MUST detectar estado desatualizado e orientar
  recarregamento em vez de sobrescrever silenciosamente.
- **FR-082**: Após resposta incerta, o sistema MUST consultar o estado
  persistido antes de repetir efeitos ou anunciar sucesso.

### Key Entities *(include if feature involves data)*

- **Usuário operacional**: identidade interna associada a uma identidade
  autenticada, com nome, perfil oficial, cargo/função, estado e vínculos.
- **Posto**: delimitador principal de escopo operacional, com identificação,
  estado e dependências históricas.
- **Vínculo usuário/posto**: concessão de escopo com nível oficial, estado,
  autoria e data, removível logicamente.
- **Cargo/função**: classificação reutilizada por usuários, tarefas e rotinas.
- **Prioridade**: classificação global ordenada e visual dos módulos
  consumidores, conforme a Spec 002.
- **Tipo de ocorrência**: classificação global de ocorrências, incluindo
  Reclamação como tipo, conforme a Spec 002.
- **Meta de eficiência**: percentual vigente por posto e tipo de atividade,
  conforme a Spec 002.
- **Histórico de auditoria**: fonte central imutável para eventos críticos,
  atores, valores e contexto autorizado.

### Dependencies

- Spec 001: usuários, postos, vínculos, cargos/funções, perfis, autorização,
  RLS, soft delete e `historico_auditoria`.
- Spec 002: prioridades, tipos de ocorrência, metas de eficiência, validações,
  escopo e auditoria.
- Spec 005: autenticação, sessão, rotas, menu e revalidação de autorização.
- Specs 007 e 008: padrões atuais de filtros, formulários, concorrência,
  idempotência, autorização e auditoria de interface.
- Spec 010: contratos consumidores de usuários, postos, cargos/funções e
  prioridades, sem trazer tarefas ou rotinas para esta feature.
- Design system Doka para experiência PT-BR, acessível e desktop-first.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes com os três perfis e ao menos três postos, 100% das
  consultas, rotas e mutações administrativas impedem acesso fora do perfil e
  escopo vigentes.
- **SC-002**: 100% das tentativas de remover ou inativar o último
  Direção/Administração válido são bloqueadas sem alterar acesso ou registrar
  sucesso.
- **SC-003**: Pelo menos 90% dos administradores de aceite localizam um usuário,
  alteram uma configuração permitida e confirmam o histórico em até 3 minutos,
  sem ajuda.
- **SC-004**: 100% das duplicidades de usuário/identidade, vínculo ativo,
  prioridade, tipo de ocorrência e meta sobreposta previstas nos contratos são
  recusadas.
- **SC-005**: 100% das ações administrativas críticas concluídas geram
  exatamente um evento central com ator e mudança compreensíveis; ações
  recusadas geram zero eventos falsos de sucesso.
- **SC-006**: Em 100% dos testes, inativação, soft delete, status operacional e
  remoção de vínculo produzem estados distintos e preservam referências e
  histórico.
- **SC-007**: 100% dos eventos sem contexto suficiente ou fora do escopo ficam
  invisíveis à Supervisão, e 100% das tentativas do Operador de abrir a
  auditoria geral são negadas.
- **SC-008**: Nenhuma tela ou detalhe de auditoria exibe senha, token, segredo,
  credencial, autorização de recuperação ou conteúdo MMS restrito nos cenários
  de segurança.
- **SC-009**: Pelo menos 95% das listagens, pesquisas e mudanças de filtro
  apresentam resultado ou progresso em até 2 segundos no volume de aceite de
  10.000 usuários/postos/eventos no escopo consultado.
- **SC-010**: Em testes de acessibilidade, 100% dos fluxos críticos são
  concluíveis por teclado, possuem foco visível e comunicam estado sem depender
  somente de cor.
- **SC-011**: Em 100% dos testes de clique duplo, repetição, concorrência e
  resposta incerta, nenhum vínculo, evento ou efeito administrativo é
  duplicado e nenhuma versão atual é sobrescrita silenciosamente.
- **SC-012**: 100% das telas administrativas avaliadas distinguem carregamento,
  vazio, filtros sem resultado, erro, acesso negado, sessão expirada e conflito
  sem apresentar falso sucesso.

## Assumptions

- As Specs 001, 002, 005, 007, 008 e os contratos consumidores da Spec 010
  permanecem vigentes e prevalecem sobre documentos fundacionais genéricos.
- Direção/Administração possui escopo global sem depender de vínculo individual;
  Supervisão e Operador dependem de escopo ativo nos termos vigentes.
- Reativação altera somente `ativo`; restauração de soft delete não faz parte
  do MVP sem regra futura explícita.
- Registros históricos continuam legíveis mesmo quando a entidade relacionada
  estiver inativa, removida ou inexistente.
- A tela de auditoria apresenta uma projeção segura e compreensível dos eventos,
  sem alterar a fonte nem expor campos proibidos.
- As cinco identidades de autenticação previstas serão criadas previamente no
  serviço de autenticação; a interface administrativa apenas fará a associação
  ao cadastro operacional correspondente.
- Supervisão consulta usuários, postos, vínculos e cargos/funções do próprio
  escopo, mas toda gestão dessas entidades permanece exclusiva de
  Direção/Administração.
- Paginação, mecanismo de concorrência, fronteira privilegiada, funções,
  contratos de consulta, componentes e estrutura de código serão decididos no
  planejamento.
