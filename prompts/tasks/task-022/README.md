# TASK-022 — Checkpoint PHASE-04 e readiness de lançamento

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-04 / HIGH
- **Dependências:** `DEPENDS_ON: TASK-021`
- **Objetivo:** Executar a validação final da V1, incluindo arquitetura, segurança, dados, backup, observabilidade, testes e rastreabilidade
- **Especificação:** [docs/TASKS/TASK022.MD](../../../docs/TASKS/TASK022.MD)
- **Critérios:** todos os Gates aplicáveis passam; backup/restauração é verificável; autenticação/autorização estão validadas; pagamentos/webhooks são consistentes; rastreabilidade está completa
- **ALLOWED_CHANGES:** testes, configuração de release, documentação operacional e `TASKS.md`
- **FORBIDDEN_CHANGES:** funcionalidades novas, alterações de escopo, atalhos de segurança, mudança arquitetural não aprovada

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-022-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento do checkpoint | `prompt-task-022-etapa-002-planejamento-checkpoint.md` | GATE-002 | GATE-001 |
| 003 | Validação integrada e diagnóstico | `prompt-task-022-etapa-003-validacao-integrada.md` | GATE-003 | GATE-002 |
| 004 | Testes manuais do checkpoint | `prompt-task-022-etapa-004-testes-manuais.md` | GATE-004 | GATE-003 |
| 005 | Relatório e conclusão | `prompt-task-022-etapa-005-conclusao.md` | GATE-005 | GATE-004 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
