# Research: Central de Tarefas, Rotinas Recorrentes e Estratégias Operacionais

## 1. Fronteira de dados e comandos

**Decision**: Usar RPCs públicas estreitas para consultas e comandos. A SPA não
recebe privilégios de mutação direta nas cinco tabelas. As RPCs derivam o ator da
sessão, validam escopo e retornam projeções próprias para a interface.

**Rationale**: Criação com responsáveis, transições, auditoria, alterações de
rotina e acúmulo exigem efeitos atômicos. O padrão já existe nas Specs 006–008 e
evita que uma sequência parcial no navegador viole regras.

**Alternatives considered**:

- Operações diretas via Data API: espalham validações e transações pelo cliente.
- Edge Function/backend: adiciona camada sem necessidade; a operação é centrada
  em dados e cabe em funções PostgreSQL.

## 2. Modelagem da recorrência

**Decision**: Guardar tipo, intervalo, unidade, dias da semana, dia do mês e
`data_inicio` como âncora. Diária usa intervalo de um dia; semanal usa semanas e
dias selecionados; mensal usa meses e dia do mês; personalizada permite
intervalo em dias, semanas ou meses com os seletores aplicáveis.

**Rationale**: Uma representação estruturada é validável e cobre a decisão
aprovada sem expressão livre ou cron fornecido pelo usuário.

**Alternatives considered**:

- Texto cron por rotina: inadequado para usuário operacional e difícil de
  validar.
- JSON livre: permite combinações inválidas e consultas opacas.

## 3. Datas mensais e referência temporal

**Decision**: Usar `America/Bahia` como referência operacional. Datas são
persistidas como `date`, horários como `time`, e instantes de evento como
`timestamptz`. Dia mensal inexistente é reduzido ao último dia calendário do
mês. Uma tarefa de rotina vence na data prevista; o horário vem da rotina.

**Rationale**: Separa o calendário operacional de instantes globais e implementa
a resposta aprovada sem depender do fuso do navegador.

**Alternatives considered**:

- UTC como calendário de negócio: pode trocar o dia exibido.
- Pular o mês: contradiz a decisão aprovada.

## 4. Previsões futuras

**Decision**: Persistir execuções `prevista` numa janela móvel de 90 dias. Criar
ou editar rotina sincroniza essa janela; o job periódico a repõe. O calendário
consulta esses registros e nunca gera tarefa por leitura.

**Rationale**: O calendário precisa distinguir previsões reais, tarefas geradas
e acúmulos. Noventa dias cobrem visão diária, semanal e mensal sem materializar
todo o futuro.

**Alternatives considered**:

- Calcular previsões apenas na consulta: não entrega registro rastreável.
- Materializar toda a vigência sem limite: cresce sem controle em rotinas sem
  data final.

## 5. Momento e recuperação da geração

**Decision**: Um job Supabase Cron roda a cada cinco minutos. Ocorrências ficam
elegíveis para geração no início de sua data em `America/Bahia`. O job cria as
previsões ausentes e processa ocorrências vencidas em ordem cronológica, em
lotes limitados; novas execuções continuam até eliminar o atraso.

**Rationale**: A frequência reduz atraso operacional e recupera indisponibilidade
sem exigir uma chamada externa. O processamento em lotes respeita o limite
operacional recomendado para jobs.

**Alternatives considered**:

- Um job por rotina: escala e observabilidade piores.
- Geração no horário limite: disponibiliza a tarefa tarde demais.
- Apenas ocorrência atual: perderia períodos durante indisponibilidade.

## 6. Início retroativo

**Decision**: A primeira data processável é o maior valor entre `data_inicio` e
a data operacional de criação. Informar início passado não cria tarefas
anteriores à existência da rotina; recuperação posterior cobre todo período
desde essa primeira data.

**Rationale**: Diferencia recuperação de falha real de criação retroativa não
solicitada.

**Alternatives considered**:

- Retroagir sempre até `data_inicio`: pode criar grande volume inesperado.
- Ignorar `data_inicio` passada por completo: perderia a âncora da recorrência.

## 7. Idempotência, concorrência e acúmulo

**Decision**: Usar trava transacional do gerador, locks de linha, versão
monotônica, unicidade de execução ativa por rotina/data e unicidade de tarefa
originária. Ao processar uma ocorrência, a função bloqueia a rotina e procura
tarefa aberta anterior; se existir, cria/retém a execução `acumulada` apontando
à mesma tarefa, senão cria tarefa e marca `gerada`.

**Rationale**: Restrições no banco são a última barreira contra cron sobreposto,
duplo clique e requisição repetida. Estado persistido decide o resultado.

**Alternatives considered**:

- Chave idempotente gerada pelo navegador: não cobre o job nem concorrência.
- Last-write-wins: perde transições e pode duplicar auditoria.
- Fila externa: fora da arquitetura e escala do MVP.

## 8. Edição e versionamento de rotina

**Decision**: Toda mudança relevante incrementa `versao_regra`. Execuções
futuras ainda `prevista` da versão antiga viram `cancelada` com motivo; a nova
versão materializa suas datas. Execuções `gerada`, `acumulada` ou `concluida` e
tarefas existentes nunca são reescritas.

**Rationale**: Preserva o passado e permite explicar por que previsões futuras
mudaram.

**Alternatives considered**:

- Atualizar execuções existentes: apaga contexto histórico.
- Criar tabela completa de revisões: complexidade desnecessária; versão e
  snapshot na execução bastam para o MVP.

## 9. Concorrência de tarefas

**Decision**: `tarefas.versao` é comparada em toda edição ou transição.
RPCs bloqueiam o registro e retornam conflito se a versão divergir. Uma ação já
refletida no estado retorna o estado atual sem repetir auditoria; ação
incompatível retorna erro estável.

**Rationale**: Evita sobrescrita silenciosa e permite confirmar resposta incerta
por nova leitura.

**Alternatives considered**:

- Comparar somente `updated_at`: menos explícito no contrato.
- Reenvio automático: pode executar decisão desatualizada.

## 10. Autorização

**Decision**: Direção/Administração é global. Supervisão consulta e gerencia
postos com vínculo `supervisao`. Operador consulta tarefas/rotinas dos postos
com vínculo ativo, mas só inicia ou conclui tarefa quando é responsável ativo;
não cria, valida, reabre, remove ou administra rotina.

**Rationale**: Consolida Specs 001, 005 e 010. Visibilidade do menu é apenas
apresentação; RPC e RLS repetem a decisão.

**Alternatives considered**:

- Permitir Operador agir em qualquer tarefa do posto: amplia a decisão aprovada.
- Usar perfil informado pelo cliente: inseguro e sujeito a manipulação.

## 11. Consultas e interface

**Decision**: Lista usa cursor por prazo, horário, prioridade e ID. Kanban
reutiliza a mesma consulta agrupando o resultado por status. Calendário consulta
um intervalo máximo de 92 dias e une tarefas e execuções previstas. Filtros
ficam na URL. Não será adicionada biblioteca de calendário ou drag-and-drop.

**Rationale**: Mantém as três visões coerentes, payload limitado e acessibilidade
por teclado. Movimentação do kanban também fica disponível como ação explícita.

**Alternatives considered**:

- Três consultas independentes: risco de semântica divergente.
- Biblioteca nova: custo e superfície de manutenção sem necessidade no MVP.

## 12. Contrato para Dashboard

**Decision**: Expor uma consulta agregada, não consumida nesta feature, para
totais de hoje, pendentes, atrasadas, validação e agrupamentos por posto,
responsável e status, sempre sob o escopo do ator.

**Rationale**: Cumpre o contrato futuro sem implementar tela, KPI ou BI.

**Alternatives considered**:

- View pública comum: mais difícil limitar parâmetros, payload e exposição.
- Adiar o contrato: transfere sem necessidade uma decisão já fechada.

## 13. Segurança Supabase

**Decision**: Habilitar RLS em todas as tabelas, não conceder acesso a `anon`,
usar `TO authenticated` com predicados de escopo, indexar colunas usadas em
policies e filtrar consultas explicitamente. Funções privadas não recebem
`EXECUTE` de papéis web. RPCs privilegiadas usam `search_path = ''`, nomes
qualificados, ator derivado e grants explícitos.

**Rationale**: A documentação vigente alerta que autenticação sem predicado não
é autorização e que funções `SECURITY DEFINER` exigem endurecimento. O job roda
inteiramente no banco; não há segredo de serviço no navegador.

**Alternatives considered**:

- `user_metadata` para perfil/posto: editável pelo usuário.
- Tabelas expostas só com grants: RLS continuaria necessária.

## 14. Validação

**Decision**: Validar schema/RLS/recorrência em testes SQL transacionais e
frontend com Vitest/Testing Library. Navegação real, URL direta, teclado, foco e
layouts ficam em aceite manual executado pelo usuário. Executar lint, advisors e
planos com 10.000 tarefas e 1.000 ocorrências.

**Rationale**: Mocks não comprovam concorrência, grants, cron ou RLS; testes de
UI não substituem banco e vice-versa.

**Alternatives considered**:

- Somente testes frontend: não prova a fronteira autoritativa.
- Testar em produção: incompatível com o processo.

## Referências

- https://supabase.com/docs/guides/cron
- https://supabase.com/docs/guides/cron/quickstart
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/secure-data
- https://supabase.com/changelog
