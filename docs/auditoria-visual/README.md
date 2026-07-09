# Catálogo de screenshots para auditoria visual

**Data:** 04/07/2026  
**Viewport:** 1440x900  
**Perfil autenticado:** Direção/Administração, escopo global  
**Origem:** aplicação local conectada ao ambiente configurado em `.env.local`

## Objetivo

Registrar a aparência atual das páginas e estados relevantes antes da análise
visual e da proposta de redesign. As capturas não representam aprovação do
layout; são a linha de base para comparar hierarquia, composição, densidade,
tipografia, cores, controles e consistência entre módulos.

## Método

- Foram usadas as rotas registradas em `src/app/router.tsx`.
- Nenhum registro foi criado, editado ou removido para produzir as imagens.
- As páginas foram capturadas depois do carregamento dos catálogos e dados.
- As capturas mostram o primeiro viewport de cada tela. Páginas longas podem
  exigir capturas complementares durante a análise detalhada.
- Estados de detalhe/edição que dependem de dados inexistentes foram
  registrados como lacunas, não simulados com IDs inválidos.

## Capturas

### Dashboard

| Tela                  | Rota             | Arquivo                                                     |
| --------------------- | ---------------- | ----------------------------------------------------------- |
| Dashboard operacional | `/app/dashboard` | [01-dashboard.png](screenshots/2026-07-04/01-dashboard.png) |

### Ocorrências

| Tela            | Rota                    | Arquivo                                                                     |
| --------------- | ----------------------- | --------------------------------------------------------------------------- |
| Lista           | `/app/ocorrencias`      | [02-ocorrencias-lista.png](screenshots/2026-07-04/02-ocorrencias-lista.png) |
| Nova ocorrência | `/app/ocorrencias/nova` | [03-ocorrencias-nova.png](screenshots/2026-07-04/03-ocorrencias-nova.png)   |

### Tarefas e Rotinas

| Tela             | Rota                                | Arquivo                                                             |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Lista de tarefas | `/app/tarefas-rotinas`              | [05-tarefas-lista.png](screenshots/2026-07-04/05-tarefas-lista.png) |
| Nova tarefa      | `/app/tarefas-rotinas/nova`         | [06-tarefas-nova.png](screenshots/2026-07-04/06-tarefas-nova.png)   |
| Lista de rotinas | `/app/tarefas-rotinas/rotinas`      | [07-rotinas-lista.png](screenshots/2026-07-04/07-rotinas-lista.png) |
| Nova rotina      | `/app/tarefas-rotinas/rotinas/nova` | [08-rotinas-nova.png](screenshots/2026-07-04/08-rotinas-nova.png)   |

### Assistências MMS

| Tela               | Rota/estado                            | Arquivo                                                                                           |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Lista              | `/app/assistencias-mms`                | [09-assistencias-lista.png](screenshots/2026-07-04/09-assistencias-lista.png)                     |
| Detalhe            | `/app/assistencias-mms/:assistenciaId` | [10-assistencias-detalhe.png](screenshots/2026-07-04/10-assistencias-detalhe.png)                 |
| Dialog de correção | detalhe, ação “Corrigir cliente”       | [11-assistencias-dialog-correcao.png](screenshots/2026-07-04/11-assistencias-dialog-correcao.png) |

### Importações MMS

| Tela            | Rota                                      | Arquivo                                                                               |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Lista           | `/app/importacoes-mms`                    | [12-importacoes-lista.png](screenshots/2026-07-04/12-importacoes-lista.png)           |
| Nova importação | `/app/importacoes-mms/nova`               | [13-importacoes-nova.png](screenshots/2026-07-04/13-importacoes-nova.png)             |
| Detalhe         | `/app/importacoes-mms/:loteId`            | [14-importacoes-detalhe.png](screenshots/2026-07-04/14-importacoes-detalhe.png)       |
| Tratamento      | `/app/importacoes-mms/:loteId/tratamento` | [15-importacoes-tratamento.png](screenshots/2026-07-04/15-importacoes-tratamento.png) |

### Deslocamentos e Custos

| Tela            | Rota                      | Arquivo                                                           |
| --------------- | ------------------------- | ----------------------------------------------------------------- |
| Lista           | `/app/custos-extras`      | [16-custos-lista.png](screenshots/2026-07-04/16-custos-lista.png) |
| Novo lançamento | `/app/custos-extras/novo` | [17-custos-novo.png](screenshots/2026-07-04/17-custos-novo.png)   |

### Administração

| Tela/estado          | Rota             | Arquivo                                                                                     |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| Usuários             | `/app/cadastros` | [18-cadastros.png](screenshots/2026-07-04/18-cadastros.png)                                 |
| Postos e vínculos    | `/app/cadastros` | [19-cadastros-postos-vinculos.png](screenshots/2026-07-04/19-cadastros-postos-vinculos.png) |
| Cadastros auxiliares | `/app/cadastros` | [20-cadastros-auxiliares.png](screenshots/2026-07-04/20-cadastros-auxiliares.png)           |
| Metas de eficiência  | `/app/cadastros` | [21-cadastros-metas.png](screenshots/2026-07-04/21-cadastros-metas.png)                     |

### Histórico e Auditoria

| Tela                  | Rota                       | Arquivo                                                     |
| --------------------- | -------------------------- | ----------------------------------------------------------- |
| Histórico e auditoria | `/app/historico-auditoria` | [22-auditoria.png](screenshots/2026-07-04/22-auditoria.png) |

### Autenticação e estados globais

| Tela                               | Rota                        | Arquivo                                                                                   |
| ---------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Login                              | `/login`                    | [23-login.png](screenshots/2026-07-04/23-login.png)                                       |
| Recuperar senha                    | `/recuperar-senha`          | [24-recuperar-senha.png](screenshots/2026-07-04/24-recuperar-senha.png)                   |
| Redefinição sem autorização válida | `/redefinir-senha`          | [25-redefinir-senha-invalida.png](screenshots/2026-07-04/25-redefinir-senha-invalida.png) |
| Sessão expirada                    | `/sessao-expirada`          | [26-sessao-expirada.png](screenshots/2026-07-04/26-sessao-expirada.png)                   |
| Falha temporária                   | `/falha-temporaria`         | [27-falha-temporaria.png](screenshots/2026-07-04/27-falha-temporaria.png)                 |
| Acesso negado                      | `/acesso-negado`            | [28-acesso-negado.png](screenshots/2026-07-04/28-acesso-negado.png)                       |
| Configuração operacional           | `/configuracao-operacional` | [29-configuracao-operacional.png](screenshots/2026-07-04/29-configuracao-operacional.png) |
| Página não encontrada              | rota inexistente            | [30-nao-encontrada.png](screenshots/2026-07-04/30-nao-encontrada.png)                     |

## Cobertura pendente

As seguintes páginas existem no router, mas não tiveram captura representativa
porque não havia registro correspondente nas listagens acessíveis:

- detalhe e edição de Ocorrência;
- detalhe e edição de Tarefa;
- edição de Rotina;
- detalhe e edição de Deslocamento/Custo.

A tela válida de redefinição de senha também depende de um fluxo real de
recuperação e não deve ser simulada com autorização inválida.

Para completar essas lacunas, é necessário usar registros reais existentes ou
obter autorização para criar uma massa visual descartável. Não usar IDs
inventados, pois isso capturaria apenas estados de erro.

## Próxima etapa

Executar uma análise visual por padrão de tela, não apenas por módulo:

1. shell e navegação;
2. listas e filtros;
3. formulários;
4. detalhes e histórico;
5. administração;
6. dialogs e estados de feedback;
7. autenticação.

A análise deve produzir recomendações de redesign, prioridades e referências
visuais sem alterar o código nesta etapa.

---

## Capturas pós-redesign — 05/07/2026

**Viewport:** 1440x900  
**Perfil autenticado:** Direção/Administração, escopo global  
**Pasta:** `screenshots/2026-07-05-pos-redesign/`

As imagens abaixo foram refeitas após o redesign e mantêm a numeração do
catálogo anterior para permitir comparação direta.

| Tela | Antes | Depois |
| --- | --- | --- |
| Dashboard | [01](screenshots/2026-07-04/01-dashboard.png) | [01](screenshots/2026-07-05-pos-redesign/01-dashboard.png) |
| Ocorrências — lista | [02](screenshots/2026-07-04/02-ocorrencias-lista.png) | [02](screenshots/2026-07-05-pos-redesign/02-ocorrencias-lista.png) |
| Ocorrências — nova | [03](screenshots/2026-07-04/03-ocorrencias-nova.png) | [03](screenshots/2026-07-05-pos-redesign/03-ocorrencias-nova.png) |
| Tarefas — lista | [05](screenshots/2026-07-04/05-tarefas-lista.png) | [05](screenshots/2026-07-05-pos-redesign/05-tarefas-lista.png) |
| Rotinas — lista | [07](screenshots/2026-07-04/07-rotinas-lista.png) | [07](screenshots/2026-07-05-pos-redesign/07-rotinas-lista.png) |
| Assistências — lista | [09](screenshots/2026-07-04/09-assistencias-lista.png) | [09](screenshots/2026-07-05-pos-redesign/09-assistencias-lista.png) |
| Importações — lista | [12](screenshots/2026-07-04/12-importacoes-lista.png) | [12](screenshots/2026-07-05-pos-redesign/12-importacoes-lista.png) |
| Importações — nova | [13](screenshots/2026-07-04/13-importacoes-nova.png) | [13](screenshots/2026-07-05-pos-redesign/13-importacoes-nova.png) |
| Deslocamentos e custos — lista | [16](screenshots/2026-07-04/16-custos-lista.png) | [16](screenshots/2026-07-05-pos-redesign/16-custos-lista.png) |
| Histórico e auditoria | [22](screenshots/2026-07-04/22-auditoria.png) | [22](screenshots/2026-07-05-pos-redesign/22-auditoria.png) |
| Login | [23](screenshots/2026-07-04/23-login.png) | [23](screenshots/2026-07-05-pos-redesign/23-login.png) |
| Recuperar senha | [24](screenshots/2026-07-04/24-recuperar-senha.png) | [24](screenshots/2026-07-05-pos-redesign/24-recuperar-senha.png) |
| Redefinição inválida | [25](screenshots/2026-07-04/25-redefinir-senha-invalida.png) | [25](screenshots/2026-07-05-pos-redesign/25-redefinir-senha-invalida.png) |
| Sessão expirada | [26](screenshots/2026-07-04/26-sessao-expirada.png) | [26](screenshots/2026-07-05-pos-redesign/26-sessao-expirada.png) |
| Falha temporária | [27](screenshots/2026-07-04/27-falha-temporaria.png) | [27](screenshots/2026-07-05-pos-redesign/27-falha-temporaria.png) |
| Acesso negado | [28](screenshots/2026-07-04/28-acesso-negado.png) | [28](screenshots/2026-07-05-pos-redesign/28-acesso-negado.png) |
| Configuração operacional | [29](screenshots/2026-07-04/29-configuracao-operacional.png) | [29](screenshots/2026-07-05-pos-redesign/29-configuracao-operacional.png) |
| Página não encontrada | [30](screenshots/2026-07-04/30-nao-encontrada.png) | [30](screenshots/2026-07-05-pos-redesign/30-nao-encontrada.png) |

### Cobertura pós-redesign ainda pendente

- nova tarefa;
- nova rotina;
- novo deslocamento/custo;
- as quatro seções de Administração;
- detalhe e diálogo de correção de Assistência;
- detalhe e tratamento de Importação;
- detalhes e edições de Ocorrência, Tarefa, Rotina e Deslocamento/Custo.

Os detalhes e edições dos módulos novos continuam sem registros reais. Criar
massa visual descartável exige autorização explícita, pois altera o ambiente
configurado. A execução de 05/07/2026 também foi interrompida quando o navegador
interno deixou de responder; capturas presas em loading foram descartadas.
