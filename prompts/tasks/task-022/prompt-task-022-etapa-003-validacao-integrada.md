# TASK-022 — ETAPA 003 — Validação integrada e diagnóstico

## 1. OBJETIVO

Inspecionar evidências e executar Gates automatizados aplicáveis.

## 2. CONTEXTO

TASK-022: Checkpoint PHASE-04 e readiness de lançamento. Estado no backlog: BLOCKED. Fase/prioridade: PHASE-04 / HIGH.
Dependências: `DEPENDS_ON: TASK-021`. Requisitos/ADRs/UC: .
Objetivo registrado: Executar a validação final da V1, incluindo arquitetura, segurança, dados, backup, observabilidade, testes e rastreabilidade
Critérios: todos os Gates aplicáveis passam; backup/restauração é verificável; autenticação/autorização estão validadas; pagamentos/webhooks são consistentes; rastreabilidade está completa
DoD específica: V1 pronta para decisão de lançamento, com todas as pendências restantes explicitamente registradas e aceitas
Fontes: AGENTS.md, README.md, TASKS.md, docs/TASKS/TASK022.MD, docs/adr/, docs/architecture/ e requisitos/código/testes pertinentes. A especificação detalhada define o escopo; não preencha lacunas por suposição.

## 3. PRÉ-CONDIÇÕES

1. Leia integralmente docs/TASKS/TASK022.MD e confirme o estado no backlog e especificação.
2. Verifique branch, git status, alterações preexistentes, histórico e evidências anteriores.
3. Confirme dependências DONE e valide artefatos; status textual isolado não é evidência.
4. Confirme DoR, requisitos, critérios, ALLOWED_CHANGES, FORBIDDEN_CHANGES, ADRs e decisões necessárias.
5. TASK BLOCKED, artefato/dependência ausente, contradição ou bloqueio impede avanço.

## 4. ENTRADAS NECESSÁRIAS

- TASKS.md, docs/TASKS/TASK022.MD, AGENTS.md, requisitos, ADRs, contratos, código e evidências pertinentes.
- ALLOWED_CHANGES: testes, configuração de release, documentação operacional e `TASKS.md`
- FORBIDDEN_CHANGES: funcionalidades novas, alterações de escopo, atalhos de segurança, mudança arquitetural não aprovada
- Evidências dos Gates anteriores, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Inspecione especificação e código para listar caminhos reais; não adivinhe. Identifique arquivos permitidos, candidatos e protegidos. Mudança fora do escopo exige SCOPE ESCALATION.

## 6. PROCEDIMENTO DETALHADO

Inspecione critérios/artefatos da fase. Execute apenas build/lint/testes/API/security previstos e disponíveis; registre comando, saída e código. Corrija no escopo e revalide; caso contrário escale.

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

- Critérios do backlog: todos os Gates aplicáveis passam; backup/restauração é verificável; autenticação/autorização estão validadas; pagamentos/webhooks são consistentes; rastreabilidade está completa
- DoD específica: V1 pronta para decisão de lançamento, com todas as pendências restantes explicitamente registradas e aceitas
- Evidências e Gates aplicáveis analisados; falhas revalidadas ou bloqueadas.
- Evidências completas/rastreáveis; nenhum bloqueio ou conflito pendente.

## 12. GATE DA ETAPA

GATE-003 — Validação integrada e diagnóstico

[ ] Pré-condições verificadas
[ ] Procedimento dentro do escopo concluído
[ ] Critérios e evidências registrados
[ ] Falhas revalidadas ou bloqueadas
[ ] Próxima etapa habilitada somente após aprovação verificável

Resultado: APROVADO / REPROVADO / BLOQUEADO. Sem evidência obrigatória, use BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-001 — Recontextualização e prontidão: PENDENTE DE EVIDÊNCIA; revalidar
GATE-002 — Planejamento do checkpoint: PENDENTE DE EVIDÊNCIA; revalidar
GATE-003 — Validação integrada e diagnóstico: EM EXECUÇÃO
GATE-004 — Testes manuais do checkpoint: PENDENTE
GATE-005 — Relatório e conclusão: PENDENTE

Mostre GATES CONCLUÍDOS X/Y, PENDENTES X/Y e BLOQUEADOS X/Y. Revalide Gates anteriores por evidência, não pela existência dos prompts.

## 14. RESULTADO OBRIGATÓRIO

Finalize com resumo preenchido:

```text
TASK: TASK-022
ETAPA: 003 — Validação integrada e diagnóstico
STATUS DA ETAPA: APROVADA | REPROVADA | BLOQUEADA
GATE-003: APROVADO | REPROVADO | BLOQUEADO
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
