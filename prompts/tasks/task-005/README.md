# TASK-005 — Checkpoint PHASE-01

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-01 / HIGH
- **Dependências:** `DEPENDS_ON: TASK-002,TASK-003,TASK-004`
- **Objetivo:** Validar fundação técnica, segurança, decisões arquiteturais, infraestrutura e rastreabilidade
- **Especificação:** [docs/TASKS/TASK005.MD](../../../docs/TASKS/TASK005.MD)
- **Critérios:** build/lint/testes passam; decisões críticas estão registradas; nenhum bloqueio relevante foi ignorado
- **ALLOWED_CHANGES:** testes, documentação, configuração e correções necessárias da PHASE-01; `TASKS.md`
- **FORBIDDEN_CHANGES:** funcionalidades comerciais das fases seguintes

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-005-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento do checkpoint | `prompt-task-005-etapa-002-planejamento-checkpoint.md` | GATE-002 | GATE-001 |
| 003 | Validação integrada e diagnóstico | `prompt-task-005-etapa-003-validacao-integrada.md` | GATE-003 | GATE-002 |
| 004 | Testes manuais do checkpoint | `prompt-task-005-etapa-004-testes-manuais.md` | GATE-004 | GATE-003 |
| 005 | Relatório e conclusão | `prompt-task-005-etapa-005-conclusao.md` | GATE-005 | GATE-004 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
