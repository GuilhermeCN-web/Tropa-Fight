# TASK-013 — Checkout, endereço e frete

- **Status inicial:** BLOCKED
- **Fase/prioridade:** PHASE-03 / CRITICAL
- **Dependências:** `DEPENDS_ON: TASK-012`
- **Objetivo:** Implementar checkout, endereços, cálculo/seleção de entrega e criação de pedido
- **Especificação:** [docs/TASKS/TASK013.MD](../../../docs/TASKS/TASK013.MD)
- **Critérios:** endereço pertence ao cliente; pedido preserva preço/itens no momento da compra; estoque é validado de forma consistente; checkout inválido não cria pedido parcial
- **ALLOWED_CHANGES:** módulos checkout/orders/shipping; persistência; APIs; testes; `TASKS.md`
- **FORBIDDEN_CHANGES:** gateway real sem aprovação, regras de devolução não definidas, integrações logísticas não aprovadas

## Sequência

| Ordem | Etapa | Arquivo | GATE | Dependência |
|---:|---|---|---|---|
| 001 | Recontextualização e prontidão | `prompt-task-013-etapa-001-recontextualizacao.md` | GATE-001 | — |
| 002 | Planejamento da implementação | `prompt-task-013-etapa-002-planejamento.md` | GATE-002 | GATE-001 |
| 003 | Implementação controlada | `prompt-task-013-etapa-003-implementacao.md` | GATE-003 | GATE-002 |
| 004 | Revisão e validação automatizada | `prompt-task-013-etapa-004-revisao-validacao.md` | GATE-004 | GATE-003 |
| 005 | Testes manuais | `prompt-task-013-etapa-005-testes-manuais.md` | GATE-005 | GATE-004 |
| 006 | Conclusão e atualização de estado | `prompt-task-013-etapa-006-conclusao.md` | GATE-006 | GATE-005 |

## Regras de avanço

Cada Gate exige evidência verificável. TASK BLOCKED, dependência/artefato ausente ou decisão pendente bloqueia o fluxo. Falha exige diagnóstico, correção autorizada e reexecução. Teste automatizado não substitui teste manual. Scope escalation aguarda decisão.

## Testes manuais previstos

Derive casos dos critérios e da seção de testes da especificação. Registre ID, objetivo, pré-condições, comandos, passos, esperado, obtido, evidência e status. Todos começam NÃO EXECUTADO. O responsável executa manualmente em Windows/WSL/Linux aplicável; não invente resultados.

Conclusão exige Gates, critérios, DoD e testes manuais obrigatórios aprovados com evidência. Atualize TASKS.md com estado real e pare. Todos os Gates iniciam PENDENTES; gerar prompts não executa TASK.
