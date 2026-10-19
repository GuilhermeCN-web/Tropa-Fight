# TASK-018 — Administração de catálogo, estoque e pedidos

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-04 / HIGH
- **Dependências:** `DEPENDS_ON: TASK-017`
- **Objetivo:** Consolidar operações administrativas sobre produtos, estoque, pedidos e clientes
- **Especificação:** [docs/TASKS/TASK018.MD](../../../docs/TASKS/TASK018.MD)
- **Critérios:** cada função administrativa respeita permissões; operações críticas são auditadas; clientes não acessam recursos administrativos
- **ALLOWED_CHANGES:** módulos admin/catalog/inventory/orders/customers; testes; `TASKS.md`
- **FORBIDDEN_CHANGES:** permissões não aprovadas, alteração unilateral de RBAC, funcionalidades de ERP

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-018-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento da implementação | `prompt-task-018-etapa-002-planejamento.md` | GATE-002 | GATE-001 |
| 003 | Implementação controlada | `prompt-task-018-etapa-003-implementacao.md` | GATE-003 | GATE-002 |
| 004 | Revisão e validação automatizada | `prompt-task-018-etapa-004-revisao-validacao.md` | GATE-004 | GATE-003 |
| 005 | Testes manuais | `prompt-task-018-etapa-005-testes-manuais.md` | GATE-005 | GATE-004 |
| 006 | Conclusão e atualização de estado | `prompt-task-018-etapa-006-conclusao.md` | GATE-006 | GATE-005 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
