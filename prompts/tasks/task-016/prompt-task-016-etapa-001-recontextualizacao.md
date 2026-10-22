# TASK-016 — ETAPA 001 — Recontextualização e prontidão

## 1. OBJETIVO

Reconstituir estado e comprovar dependências/artefatos do checkpoint.

## 2. CONTEXTO

TASK-016: Checkpoint PHASE-03. Estado no backlog: BLOCKED. Fase/prioridade: PHASE-03 / HIGH.
Dependências: `DEPENDS_ON: TASK-015`. Requisitos/ADRs/UC: .
Objetivo registrado: Validar o fluxo comercial ponta a ponta
Critérios: carrinho → checkout → pagamento → pedido → histórico/rastreamento funciona; idempotência e integridade passam
DoD específica: PHASE-04 torna-se elegível
Fontes: AGENTS.md, README.md, TASKS.md, docs/TASKS/TASK016.MD, docs/adr/, docs/architecture/ e requisitos/código/testes pertinentes. A especificação detalhada define o escopo; não preencha lacunas por suposição.

## 3. PRÉ-CONDIÇÕES

1. Leia integralmente docs/TASKS/TASK016.MD e confirme o estado no backlog e especificação.
2. Verifique branch, git status, alterações preexistentes, histórico e evidências anteriores.
3. Confirme dependências DONE e valide artefatos; status textual isolado não é evidência.
4. Confirme DoR, requisitos, critérios, ALLOWED_CHANGES, FORBIDDEN_CHANGES, ADRs e decisões necessárias.
5. TASK BLOCKED, artefato/dependência ausente, contradição ou bloqueio impede avanço.

## 4. ENTRADAS NECESSÁRIAS

- TASKS.md, docs/TASKS/TASK016.MD, AGENTS.md, requisitos, ADRs, contratos, código e evidências pertinentes.
- ALLOWED_CHANGES: testes, configuração, documentação e correções necessárias da PHASE-03; `TASKS.md`
- FORBIDDEN_CHANGES: novas funcionalidades administrativas da PHASE-04
- Evidências dos Gates anteriores, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Inspecione especificação e código para listar caminhos reais; não adivinhe. Identifique arquivos permitidos, candidatos e protegidos. Mudança fora do escopo exige SCOPE ESCALATION.

## 6. PROCEDIMENTO DETALHADO

Inspecione documentos, branch, working tree, histórico, código, testes e relatórios das dependências. Confirme predecessoras DONE e artefatos presentes; falta ou conflito bloqueia.

## 7. RESTRIÇÕES

- Não avance sem Gate anterior aprovado por evidência, nem execute/alter estado de TASK posterior.
- Preserve alterações de terceiros; não descarte nem sobrescreva trabalho existente.
- Não invente requisito, regra comercial, contrato, integração ou decisão arquitetural.
- Testes automatizados complementam, mas não substituem testes manuais. Não declare execução manual sem observação e evidência.

## 8. VALIDAÇÕES

- Relacione requisito/critério/ADR/UC/TASK sem inventar rastreabilidade.
- Registre procedimento/comando, ambiente, esperado, observado, código de saída e evidência.
- Revise diff e classifique PRIMARY/INCIDENTAL/FORBIDDEN; nenhum FORBIDDEN pode permanecer.
- Aplique Quality Gates da especificação e AGENTS.md.

## 9. TRATAMENTO DE FALHAS

Interrompa avanço; registre operação/comando e erro literal; diagnostique causa e escopo; proponha menor correção permitida; corrija somente se ALLOWED_CHANGES autorizar; repita validação e registre resultado. Não ignore falha.

## 10. SCOPE ESCALATION

Se a alteração necessária não estiver autorizada, informe problema, impacto, motivo, mudança, arquivos, riscos, alternativas, recomendação e decisão necessária. Aguarde decisão; mantenha Gate bloqueado.

## 11. CRITÉRIOS DE APROVAÇÃO

- Critérios do backlog: carrinho → checkout → pagamento → pedido → histórico/rastreamento funciona; idempotência e integridade passam
- DoD específica: PHASE-04 torna-se elegível
- TASK/dependências/branch/working tree/artefatos verificados; sem bloqueio ignorado.
- Evidências completas/rastreáveis; nenhum bloqueio ou conflito pendente.

## 12. GATE DA ETAPA

GATE-001 — Recontextualização e prontidão

[ ] Pré-condições verificadas
[ ] Procedimento dentro do escopo concluído
[ ] Critérios e evidências registrados
[ ] Falhas revalidadas ou bloqueadas
[ ] Próxima etapa habilitada somente após aprovação verificável

Resultado: APROVADO / REPROVADO / BLOQUEADO. Sem evidência obrigatória, use BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-001 — Recontextualização e prontidão: EM EXECUÇÃO
GATE-002 — Planejamento do checkpoint: PENDENTE
GATE-003 — Validação integrada e diagnóstico: PENDENTE
GATE-004 — Testes manuais do checkpoint: PENDENTE
GATE-005 — Relatório e conclusão: PENDENTE

Mostre GATES CONCLUÍDOS X/Y, PENDENTES X/Y e BLOQUEADOS X/Y. Revalide Gates anteriores por evidência, não pela existência dos prompts.

## 14. RESULTADO OBRIGATÓRIO

Finalize com resumo preenchido:

```text
TASK: TASK-016
ETAPA: 001 — Recontextualização e prontidão
STATUS DA ETAPA: APROVADA | REPROVADA | BLOQUEADA
GATE-001: APROVADO | REPROVADO | BLOQUEADO
GATES TOTAIS: X; CONCLUÍDOS: X; PENDENTES: X; BLOQUEADOS: X
PROBLEMAS ENCONTRADOS:
- ...
CORREÇÕES REALIZADAS:
- ...
PENDÊNCIAS:
- ...
TESTES RELACIONADOS:
- ...
PRÓXIMA ETAPA: ...
PRÓXIMA ETAPA HABILITADA: SIM | NÃO
MOTIVO: ...
```
