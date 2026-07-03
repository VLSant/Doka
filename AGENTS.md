<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/010-tarefas-rotinas/plan.md
<!-- SPECKIT END -->

## Fluxo de trabalho atual do MVP

Para os módulos restantes, priorize resultado operacional e entrega incremental,
com complexidade proporcional a um sistema interno de 5 a 10 usuários.

- Não exija o ciclo completo do Spec Kit antes de implementar.
- Trabalhe por fatia vertical: banco existente, service, telas, rotas, testes
  mínimos e build.
- Ao iniciar um módulo, consulte somente as partes relevantes do PRD, regras de
  negócio, migrations e código existente.
- Priorize listas, formulários e detalhes simples.
- Adie kanban, calendários, automações, gráficos e abstrações futuras.
- Use CRUD direto sob RLS quando seguro e RPCs pequenas somente para operações
  críticas ou atômicas.
- Mantenha testes mínimos para permissões, regras críticas e fluxo principal.
- Não execute Playwright, testes E2E, navegação automatizada, browser,
  computer use ou homologação visual nesta etapa.
- Desenvolva módulos independentes em paralelo, mas centralize router,
  migrations e arquivos compartilhados para evitar conflitos.
- Corrija problemas encontrados posteriormente durante a homologação e o uso
  real, sem tentar antecipar todos os cenários possíveis.
- Não abra mão de RLS, perfil/posto, ausência de segredos no frontend, auditoria
  crítica, soft delete e coerência das migrations.

Ordem atual:

1. Estabilizar e reconciliar as migrations já aplicadas.
2. Integrar a fundação frontend compartilhada.
3. Desenvolver em paralelo Tarefas/Rotinas, Ocorrências e
   Deslocamentos/Custos.
4. Implementar Administração mínima.
5. Implementar o Dashboard.
6. Executar typecheck, lint, testes essenciais e build.
7. Entregar para homologação e evoluir conforme feedback operacional.

Use `docs/07-plano-execucao-mvp-enxuto.md` como registro vivo de progresso e
continuidade entre sessões. Atualize esse documento após cada etapa relevante.
