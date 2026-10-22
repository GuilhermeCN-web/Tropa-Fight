# TASK-006 — ETAPA 004 — Revisão e validação automatizada

## 1. OBJETIVO

Revisar diff/rastreabilidade e executar Quality Gates automatizados aplicáveis com evidências.

## 2. CONTEXTO

TASK-006: Catálogo de produtos e categorias. Estado no backlog: BLOCKED. Fase/prioridade: PHASE-02 / CRITICAL.
Dependências: `DEPENDS_ON: TASK-005`. Requisitos/ADRs/UC: .
Objetivo registrado: Criar o domínio de produtos, categorias, marcas e informações comerciais básicas
Critérios: produtos podem ser criados/editados conforme autorização; categorias e marcas são associáveis; catálogo público não expõe produtos que não devem ser publicados
DoD específica: APIs e testes de autorização concluídos
Fontes: AGENTS.md, README.md, TASKS.md, docs/TASKS/TASK006.MD, docs/adr/, docs/architecture/ e requisitos/código/testes pertinentes. A especificação detalhada define o escopo; não preencha lacunas por suposição.

## 3. PRÉ-CONDIÇÕES

1. Leia integralmente docs/TASKS/TASK006.MD e confirme o estado no backlog e especificação.
2. Verifique branch, git status, alterações preexistentes, histórico e evidências anteriores.
3. Confirme dependências DONE e valide artefatos; status textual isolado não é evidência.
4. Confirme DoR, requisitos, critérios, ALLOWED_CHANGES, FORBIDDEN_CHANGES, ADRs e decisões necessárias.
5. TASK BLOCKED, artefato/dependência ausente, contradição ou bloqueio impede avanço.

## 4. ENTRADAS NECESSÁRIAS

- TASKS.md, docs/TASKS/TASK006.MD, AGENTS.md, requisitos, ADRs, contratos, código e evidências pertinentes.
- ALLOWED_CHANGES: módulos catalog/categories/brands; persistência; APIs; testes; `TASKS.md`
- FORBIDDEN_CHANGES: checkout, pagamento, pedidos, promoções complexas
- Evidências dos Gates anteriores, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Inspecione especificação e código para listar caminhos reais; não adivinhe. Identifique arquivos permitidos, candidatos e protegidos. Mudança fora do escopo exige SCOPE ESCALATION.

## 6. PROCEDIMENTO DETALHADO

Revise diff contra especificação, segurança e arquitetura. Execute comandos automatizados previstos/disponíveis e aplicáveis; registre comando, ambiente, saída e código. Diagnostique falhas, corrija no escopo e reexecute. Automação não substitui teste manual.

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

- Critérios do backlog: produtos podem ser criados/editados conforme autorização; categorias e marcas são associáveis; catálogo público não expõe produtos que não devem ser publicados
- DoD específica: APIs e testes de autorização concluídos
- Revisão e Gates automatizados aplicáveis aprovados ou falhas bloqueadas.
- Evidências completas/rastreáveis; nenhum bloqueio ou conflito pendente.

## 12. GATE DA ETAPA

GATE-004 — Revisão e validação automatizada

[ ] Pré-condições verificadas
[ ] Procedimento dentro do escopo concluído
[ ] Critérios e evidências registrados
[ ] Falhas revalidadas ou bloqueadas
[ ] Próxima etapa habilitada somente após aprovação verificável

Resultado: APROVADO / REPROVADO / BLOQUEADO. Sem evidência obrigatória, use BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-001 — Recontextualização e prontidão: PENDENTE DE EVIDÊNCIA; revalidar
GATE-002 — Planejamento da implementação: PENDENTE DE EVIDÊNCIA; revalidar
GATE-003 — Implementação controlada: PENDENTE DE EVIDÊNCIA; revalidar
GATE-004 — Revisão e validação automatizada: EM EXECUÇÃO
GATE-005 — Testes manuais: PENDENTE
GATE-006 — Conclusão e atualização de estado: PENDENTE

Mostre GATES CONCLUÍDOS X/Y, PENDENTES X/Y e BLOQUEADOS X/Y. Revalide Gates anteriores por evidência, não pela existência dos prompts.

## 14. RESULTADO OBRIGATÓRIO

Finalize com resumo preenchido:

```text
TASK: TASK-006
ETAPA: 004 — Revisão e validação automatizada
STATUS DA ETAPA: APROVADA | REPROVADA | BLOQUEADA
GATE-004: APROVADO | REPROVADO | BLOQUEADO
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
