# TASK-003 — ETAPA 003 — Implementação controlada

## 1. OBJETIVO

Implementar apenas o escopo aprovado, respeitando arquitetura, requisitos e segurança.

## 2. CONTEXTO

TASK-003: Identidade, autenticação e autorização. Estado no backlog: BLOCKED. Fase/prioridade: PHASE-01 / CRITICAL.
Dependências: `DEPENDS_ON: TASK-001`. Requisitos/ADRs/UC: .
Objetivo registrado: Implementar cadastro, login, logout, recuperação de acesso, perfil, sessões e base de autorização
Critérios: autenticação funciona; senha não é armazenada em texto puro; usuário só acessa recursos autorizados; rotas administrativas exigem autorização adequada
DoD específica: testes unitários e de API de autenticação/RBAC passam
Fontes: AGENTS.md, README.md, TASKS.md, docs/TASKS/TASK003.MD, docs/adr/, docs/architecture/ e requisitos/código/testes pertinentes. A especificação detalhada define o escopo; não preencha lacunas por suposição.

## 3. PRÉ-CONDIÇÕES

1. Leia integralmente docs/TASKS/TASK003.MD e confirme o estado no backlog e especificação.
2. Verifique branch, git status, alterações preexistentes, histórico e evidências anteriores.
3. Confirme dependências DONE e valide artefatos; status textual isolado não é evidência.
4. Confirme DoR, requisitos, critérios, ALLOWED_CHANGES, FORBIDDEN_CHANGES, ADRs e decisões necessárias.
5. TASK BLOCKED, artefato/dependência ausente, contradição ou bloqueio impede avanço.

## 4. ENTRADAS NECESSÁRIAS

- TASKS.md, docs/TASKS/TASK003.MD, AGENTS.md, requisitos, ADRs, contratos, código e evidências pertinentes.
- ALLOWED_CHANGES: módulos de identidade/autenticação/autorização; persistência correspondente; testes; `TASKS.md`
- FORBIDDEN_CHANGES: catálogo, carrinho, checkout, pagamento, estoque comercial
- Evidências dos Gates anteriores, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Inspecione especificação e código para listar caminhos reais; não adivinhe. Identifique arquivos permitidos, candidatos e protegidos. Mudança fora do escopo exige SCOPE ESCALATION.

## 6. PROCEDIMENTO DETALHADO

Execute plano aprovado em mudanças pequenas. Preserve alterações existentes. Não invente regra, contrato, integração, dependência ou decisão. Mantenha rastreabilidade requisito → regra → UC → componente/API → teste → TASK quando aplicável.

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

- Critérios do backlog: autenticação funciona; senha não é armazenada em texto puro; usuário só acessa recursos autorizados; rotas administrativas exigem autorização adequada
- DoD específica: testes unitários e de API de autenticação/RBAC passam
- Implementação dentro do escopo concluída; arquivos e rastreabilidade registrados.
- Evidências completas/rastreáveis; nenhum bloqueio ou conflito pendente.

## 12. GATE DA ETAPA

GATE-003 — Implementação controlada

[ ] Pré-condições verificadas
[ ] Procedimento dentro do escopo concluído
[ ] Critérios e evidências registrados
[ ] Falhas revalidadas ou bloqueadas
[ ] Próxima etapa habilitada somente após aprovação verificável

Resultado: APROVADO / REPROVADO / BLOQUEADO. Sem evidência obrigatória, use BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-001 — Recontextualização e prontidão: PENDENTE DE EVIDÊNCIA; revalidar
GATE-002 — Planejamento da implementação: PENDENTE DE EVIDÊNCIA; revalidar
GATE-003 — Implementação controlada: EM EXECUÇÃO
GATE-004 — Revisão e validação automatizada: PENDENTE
GATE-005 — Testes manuais: PENDENTE
GATE-006 — Conclusão e atualização de estado: PENDENTE

Mostre GATES CONCLUÍDOS X/Y, PENDENTES X/Y e BLOQUEADOS X/Y. Revalide Gates anteriores por evidência, não pela existência dos prompts.

## 14. RESULTADO OBRIGATÓRIO

Finalize com resumo preenchido:

```text
TASK: TASK-003
ETAPA: 003 — Implementação controlada
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
