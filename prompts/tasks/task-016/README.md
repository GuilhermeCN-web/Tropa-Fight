# TASK-016 — Checkpoint PHASE-03

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-03 / HIGH
- **Dependências:** `DEPENDS_ON: TASK-015`
- **Objetivo:** Validar o fluxo comercial ponta a ponta
- **Especificação:** [docs/TASKS/TASK016.MD](../../../docs/TASKS/TASK016.MD)
- **Critérios:** carrinho → checkout → pagamento → pedido → histórico/rastreamento funciona; idempotência e integridade passam
- **ALLOWED_CHANGES:** testes, configuração, documentação e correções necessárias da PHASE-03; `TASKS.md`
- **FORBIDDEN_CHANGES:** novas funcionalidades administrativas da PHASE-04

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-016-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento do checkpoint | `prompt-task-016-etapa-002-planejamento-checkpoint.md` | GATE-002 | GATE-001 |
| 003 | Validação integrada e diagnóstico | `prompt-task-016-etapa-003-validacao-integrada.md` | GATE-003 | GATE-002 |
| 004 | Testes manuais do checkpoint | `prompt-task-016-etapa-004-testes-manuais.md` | GATE-004 | GATE-003 |
| 005 | Relatório e conclusão | `prompt-task-016-etapa-005-conclusao.md` | GATE-005 | GATE-004 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
