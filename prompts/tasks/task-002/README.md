# TASK-002 — Definir infraestrutura, ambientes e observabilidade

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-01 / HIGH
- **Dependências:** `DEPENDS_ON: TASK-001`
- **Objetivo:** Definir ambientes, estratégia de configuração, segredos, persistência, backups, monitoramento e recuperação
- **Especificação:** [docs/TASKS/TASK002.MD](../../../docs/TASKS/TASK002.MD)
- **Critérios:** decisões de infraestrutura registradas; estratégia de backup e restauração definida; RPO/RTO documentados ou explicitamente pendentes
- **ALLOWED_CHANGES:** `docs/adr/**`; `docs/architecture/**`; configuração de ambientes; infraestrutura de desenvolvimento/homologação; `TASKS.md`
- **FORBIDDEN_CHANGES:** credenciais reais, produção sem aprovação, código comercial, decisões não aprovadas sobre provedores

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-002-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento da implementação | `prompt-task-002-etapa-002-planejamento.md` | GATE-002 | GATE-001 |
| 003 | Implementação controlada | `prompt-task-002-etapa-003-implementacao.md` | GATE-003 | GATE-002 |
| 004 | Revisão e validação automatizada | `prompt-task-002-etapa-004-revisao-validacao.md` | GATE-004 | GATE-003 |
| 005 | Testes manuais | `prompt-task-002-etapa-005-testes-manuais.md` | GATE-005 | GATE-004 |
| 006 | Conclusão e atualização de estado | `prompt-task-002-etapa-006-conclusao.md` | GATE-006 | GATE-005 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
