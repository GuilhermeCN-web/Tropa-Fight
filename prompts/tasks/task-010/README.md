# TASK-010 — Checkpoint PHASE-02

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-02 / HIGH
- **Dependências:** `DEPENDS_ON: TASK-009`
- **Objetivo:** Validar catálogo, variantes, busca e estoque
- **Especificação:** [docs/TASKS/TASK010.MD](../../../docs/TASKS/TASK010.MD)
- **Critérios:** build/lint/unit/integration/API passam; catálogo e estoque mantêm integridade
- **ALLOWED_CHANGES:** testes, documentação, configuração e correções necessárias da PHASE-02; `TASKS.md`
- **FORBIDDEN_CHANGES:** checkout, pagamento e pedidos

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-010-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento do checkpoint | `prompt-task-010-etapa-002-planejamento-checkpoint.md` | GATE-002 | GATE-001 |
| 003 | Validação integrada e diagnóstico | `prompt-task-010-etapa-003-validacao-integrada.md` | GATE-003 | GATE-002 |
| 004 | Testes manuais do checkpoint | `prompt-task-010-etapa-004-testes-manuais.md` | GATE-004 | GATE-003 |
| 005 | Relatório e conclusão | `prompt-task-010-etapa-005-conclusao.md` | GATE-005 | GATE-004 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
