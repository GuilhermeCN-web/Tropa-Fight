# Prompts operacionais das TASKs — Tropa Fight

Workflows gerados a partir do backlog e especificações. **Gerar prompts não executa nem conclui TASKs.** Reconsulte TASKS.md antes de usar; os estados são fotografia da geração.

| TASK | Descrição | Etapas | Dependências | Pasta | Primeiro prompt |
|---|---|---:|---|---|---|
| TASK-001 | Inicializar aplicação e fundação de qualidade | 6 | `DEPENDS_ON: NONE` | `task-001/` | `task-001/prompt-task-001-etapa-001-recontextualizacao.md` |
| TASK-002 | Definir infraestrutura, ambientes e observabilidade | 6 | `DEPENDS_ON: TASK-001` | `task-002/` | `task-002/prompt-task-002-etapa-001-recontextualizacao.md` |
| TASK-003 | Identidade, autenticação e autorização | 6 | `DEPENDS_ON: TASK-001` | `task-003/` | `task-003/prompt-task-003-etapa-001-recontextualizacao.md` |
| TASK-004 | Auditoria, privacidade e notificações base | 6 | `DEPENDS_ON: TASK-003` | `task-004/` | `task-004/prompt-task-004-etapa-001-recontextualizacao.md` |
| TASK-005 | Checkpoint PHASE-01 | 5 | `DEPENDS_ON: TASK-002,TASK-003,TASK-004` | `task-005/` | `task-005/prompt-task-005-etapa-001-recontextualizacao.md` |
| TASK-006 | Catálogo de produtos e categorias | 6 | `DEPENDS_ON: TASK-005` | `task-006/` | `task-006/prompt-task-006-etapa-001-recontextualizacao.md` |
| TASK-007 | Variantes, preços e disponibilidade | 6 | `DEPENDS_ON: TASK-006` | `task-007/` | `task-007/prompt-task-007-etapa-001-recontextualizacao.md` |
| TASK-008 | Busca, filtros, ordenação e experiência de catálogo | 6 | `DEPENDS_ON: TASK-006` | `task-008/` | `task-008/prompt-task-008-etapa-001-recontextualizacao.md` |
| TASK-009 | Estoque e movimentações | 6 | `DEPENDS_ON: TASK-007,TASK-008` | `task-009/` | `task-009/prompt-task-009-etapa-001-recontextualizacao.md` |
| TASK-010 | Checkpoint PHASE-02 | 5 | `DEPENDS_ON: TASK-009` | `task-010/` | `task-010/prompt-task-010-etapa-001-recontextualizacao.md` |
| TASK-011 | Carrinho e cálculo comercial | 6 | `DEPENDS_ON: TASK-010` | `task-011/` | `task-011/prompt-task-011-etapa-001-recontextualizacao.md` |
| TASK-012 | Cupons e promoções | 6 | `DEPENDS_ON: TASK-011` | `task-012/` | `task-012/prompt-task-012-etapa-001-recontextualizacao.md` |
| TASK-013 | Checkout, endereço e frete | 6 | `DEPENDS_ON: TASK-012` | `task-013/` | `task-013/prompt-task-013-etapa-001-recontextualizacao.md` |
| TASK-014 | Pagamentos e idempotência | 6 | `DEPENDS_ON: TASK-013` | `task-014/` | `task-014/prompt-task-014-etapa-001-recontextualizacao.md` |
| TASK-015 | Pedidos, histórico e rastreamento | 6 | `DEPENDS_ON: TASK-014` | `task-015/` | `task-015/prompt-task-015-etapa-001-recontextualizacao.md` |
| TASK-016 | Checkpoint PHASE-03 | 5 | `DEPENDS_ON: TASK-015` | `task-016/` | `task-016/prompt-task-016-etapa-001-recontextualizacao.md` |
| TASK-017 | Avaliações e favoritos | 6 | `DEPENDS_ON: TASK-016` | `task-017/` | `task-017/prompt-task-017-etapa-001-recontextualizacao.md` |
| TASK-018 | Administração de catálogo, estoque e pedidos | 6 | `DEPENDS_ON: TASK-017` | `task-018/` | `task-018/prompt-task-018-etapa-001-recontextualizacao.md` |
| TASK-019 | Cupons, avaliações e usuários administrativos | 6 | `DEPENDS_ON: TASK-018` | `task-019/` | `task-019/prompt-task-019-etapa-001-recontextualizacao.md` |
| TASK-020 | Notificações, auditoria e observabilidade | 6 | `DEPENDS_ON: TASK-019` | `task-020/` | `task-020/prompt-task-020-etapa-001-recontextualizacao.md` |
| TASK-021 | Segurança, acessibilidade e testes E2E | 6 | `DEPENDS_ON: TASK-020` | `task-021/` | `task-021/prompt-task-021-etapa-001-recontextualizacao.md` |
| TASK-022 | Checkpoint PHASE-04 e readiness de lançamento | 5 | `DEPENDS_ON: TASK-021` | `task-022/` | `task-022/prompt-task-022-etapa-001-recontextualizacao.md` |

## Regras globais

- Respeite AGENTS.md, TASKS.md, docs/TASKS/TASKNNN.MD, ADRs, arquitetura, requisitos, dependências e Scope Guard.
- TASK BLOCKED, dependência incompleta, artefato inválido, decisão ausente ou conflito interrompe o fluxo.
- Não invente requisito/aprovação; falha exige diagnóstico, correção autorizada e revalidação.
- Testes manuais exigem execução e registro pelo responsável; automação é complementar.
- Atualize estado real e pare ao concluir; não inicie TASK seguinte automaticamente.

Estado inicial: TASK-001 READY; TASK-002 a TASK-022 BLOCKED conforme TASKS.md. Isso não comprova prontidão. Todos os Gates começam pendentes.
