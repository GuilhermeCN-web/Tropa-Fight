# Contrato operacional

**Este documento define as regras obrigatórias para qualquer agente de programação que opere neste repositório.**

## Fontes de verdade e ordem de leitura

Antes de qualquer TASK, leia nesta ordem:

1. `AGENTS.md`
2. `README.md`
3. `TASKS.md`
4. ADRs relacionados em `docs/adr/`
5. documentação de arquitetura em `docs/architecture/`
6. diagramas relevantes em `docs/diagrams/`
7. código existente
8. testes existentes

`README.md` define requisitos, domínio, arquitetura, escopo e comportamento esperado do sistema.

`TASKS.md` define backlog, dependências, estados, critérios de aceitação, Definition of Ready, Definition of Done e Scope Guard.

`docs/adr/` define as decisões arquiteturais e seus motivos.

`docs/architecture/` detalha a arquitetura aprovada.

Em caso de conflito relevante entre documentos, requisitos, código ou decisões arquiteturais, **pare e solicite decisão**. Não resolva contradições silenciosamente.

A hierarquia de fontes de verdade deve ser respeitada conforme o contrato do projeto. Nenhum agente pode substituir uma decisão documentada por uma preferência pessoal ou por uma implementação mais conveniente.

## Seleção e início de TASK

1. Localize a primeira TASK `READY` na ordem de execução definida em `TASKS.md`.
2. Confirme que todas as dependências da TASK estão `DONE`.
3. Confirme que os artefatos produzidos pelas dependências existem e estão válidos.
4. Leia todos os RF, RN, RNF, UC e ADR relacionados à TASK.
5. Leia os critérios de aceitação, testes previstos e Scope Guard da TASK.
6. Confirme a Definition of Ready.
7. Caso a Definition of Ready não seja atendida, altere/registe a TASK como `BLOCKED`, documente o motivo e pare.
8. Crie uma branch relacionada à TASK:

   * `feature/TASK-xxx-descricao`
   * `fix/TASK-xxx-descricao`
   * `chore/TASK-xxx-descricao`
9. Nunca desenvolva diretamente em `main`.
10. Atualize somente a TASK selecionada de `READY` para `IN_PROGRESS`.

Nenhuma TASK posterior pode ser iniciada automaticamente após a conclusão da TASK atual.

## Estados das TASKs

Os estados válidos são:

* `BLOCKED`
* `READY`
* `IN_PROGRESS`
* `IN_REVIEW`
* `DONE`
* `FAILED`
* `CANCELLED`

A transição normal é:

```text
BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE
```

Falha durante implementação, testes ou validação pode levar a:

```text
IN_PROGRESS → FAILED
IN_REVIEW → FAILED
```

Uma TASK não pode ser marcada como `DONE` enquanto qualquer requisito obrigatório, critério de aceitação, teste aplicável ou Quality Gate permanecer pendente.

## Scope Guard

Toda mudança realizada durante uma TASK deve ser classificada como `PRIMARY` ou `INCIDENTAL`.

### PRIMARY

Uma alteração é `PRIMARY` quando implementa diretamente o objetivo da TASK.

Toda alteração `PRIMARY` deve estar explicitamente contemplada em `ALLOWED_CHANGES`.

### INCIDENTAL

Uma alteração `INCIDENTAL` só é permitida quando for:

* mínima;
* localizada;
* diretamente causada pela implementação da TASK;
* tecnicamente necessária;
* impossível ou inadequado separar razoavelmente da TASK;
* sem introduzir nova funcionalidade;
* sem criar nova regra de negócio;
* sem alterar contrato público;
* sem alterar arquitetura;
* sem alterar requisitos;
* sem modificar segurança ou permissões de forma independente.

Uma alteração incidental nunca pode ser utilizada como justificativa para realizar refatorações amplas, melhorias não relacionadas ou trabalho futuro.

### FORBIDDEN_CHANGES

`FORBIDDEN_CHANGES` possui precedência absoluta.

Uma mudança proibida não pode ser realizada mesmo que também pareça estar relacionada a `ALLOWED_CHANGES`.

São exemplos de mudanças proibidas sem autorização explícita:

* alteração de requisitos;
* alteração de regras de negócio;
* alteração de contratos públicos;
* alteração de APIs não prevista;
* mudança de arquitetura;
* troca de tecnologia principal;
* introdução de microsserviços sem ADR;
* alteração de modelo de domínio não prevista;
* alteração de autenticação/autorização;
* alteração de políticas de segurança;
* alteração de integrações externas;
* inclusão de funcionalidades fora do escopo;
* remoção ou enfraquecimento de testes para fazer um Gate passar;
* alteração de outra TASK sem autorização;
* refatoração ampla não relacionada à TASK.

### Scope Escalation

Se a implementação exigir uma mudança fora do escopo, pare e apresente:

```text
## SCOPE ESCALATION

TASK: TASK-xxx

Necessidade identificada:

Motivo:

Arquivos/módulos afetados:

Allowed Changes atual:

Forbidden Changes relacionado:

Por que não é Incidental Change:

Impacto se não realizada:

Alternativas:

Recomendação:

Decisão necessária:
```

O agente deve aguardar uma decisão antes de continuar.

## Definition of Ready

Uma TASK só pode estar `READY` quando:

* objetivo está claramente definido;
* requisitos relacionados estão identificados;
* critérios de aceitação estão definidos;
* dependências estão `DONE`;
* ADRs necessários estão resolvidos;
* contratos necessários estão definidos;
* entidades e regras relevantes estão compreendidas;
* testes aplicáveis estão definidos;
* `ALLOWED_CHANGES` está definido;
* `FORBIDDEN_CHANGES` está definido;
* não existe pendência bloqueante;
* a TASK é executável dentro do Scope Guard.

Se qualquer condição necessária não for atendida, a TASK não deve ser iniciada.

## Implementação

Implemente **somente a TASK selecionada**.

Não implemente:

* trabalho futuro;
* funcionalidades não solicitadas;
* melhorias oportunistas;
* refatorações não relacionadas;
* regras inventadas;
* integrações não aprovadas;
* alterações arquiteturais sem ADR;
* dependências sem justificativa;
* mudanças de contrato sem autorização.

Preserve alterações legítimas de terceiros presentes no diretório de trabalho.

Não reverta, sobrescreva ou descarte alterações existentes apenas para simplificar a implementação.

### Novas necessidades identificadas

Ao encontrar uma necessidade não contemplada pela TASK:

1. avalie se ela é realmente incidental;
2. se for incidental, aplique somente a alteração mínima necessária;
3. se não for incidental, interrompa a implementação;
4. verifique se existe uma TASK correspondente;
5. caso não exista, proponha uma nova TASK com:

   * objetivo;
   * justificativa;
   * dependências;
   * rastreabilidade;
   * impacto;
   * critérios de aceitação;
6. aguarde autorização quando a continuação depender dessa nova decisão.

## Requisitos e rastreabilidade

Toda implementação deve manter rastreabilidade entre:

```text
RF → RN → RNF → UC → Entidade → API → Teste → TASK
```

Quando aplicável, o agente deve conseguir identificar:

* qual requisito originou a mudança;
* qual regra de negócio é afetada;
* qual caso de uso é atendido;
* quais entidades são alteradas;
* quais APIs ou contratos são envolvidos;
* quais testes validam o comportamento;
* qual TASK autoriza a alteração.

Não invente rastreabilidade inexistente.

Se a mudança não puder ser relacionada a um requisito ou decisão existente, trate isso como possível Scope Escalation.

## Arquitetura

A arquitetura aprovada deve ser respeitada.

No Tropa Fight, alterações arquiteturais devem seguir as decisões registradas em `docs/adr/`.

Não:

* troque padrões arquiteturais por preferência pessoal;
* mova responsabilidades entre camadas sem justificativa;
* crie acoplamentos desnecessários;
* introduza dependências entre camadas contrariando a arquitetura;
* introduza microsserviços ou novos componentes distribuídos sem ADR;
* altere contratos entre módulos sem autorização.

A arquitetura deve preservar, quando aplicável, a separação entre:

```text
Presentation
    ↓
Application
    ↓
Domain
    ↓
Infrastructure
```

A estrutura concreta deve seguir os ADRs e a implementação efetivamente aprovada, não este exemplo de forma isolada.

## Domínio e regras de negócio

Regras relacionadas a:

* usuários;
* clientes;
* administradores;
* produtos;
* categorias;
* marcas;
* variantes;
* estoque;
* carrinho;
* pedidos;
* pagamentos;
* entregas;
* cupons;
* promoções;
* avaliações;
* favoritos;
* notificações;
* auditoria;

devem ser implementadas somente conforme requisitos e regras de negócio documentados.

Não deduza comportamentos comerciais não especificados.

Em especial, não invente políticas para:

* cancelamento;
* devolução;
* reembolso;
* reserva de estoque;
* expiração de carrinho;
* aplicação de cupons;
* aprovação de avaliações;
* frete grátis;
* regiões de entrega;
* retirada física;
* estados de pagamento;
* estados de pedido.

Caso uma dessas regras seja necessária para implementar a TASK e não esteja definida, pare e solicite decisão.

## Segurança e dados

Mudanças que afetem segurança, privacidade ou integridade de dados exigem atenção especial.

Nunca:

* armazene senhas em texto puro;
* exponha credenciais ou segredos;
* registre dados sensíveis desnecessariamente em logs;
* desabilite autenticação ou autorização para facilitar testes;
* ignore validações de entrada;
* exponha dados de outros clientes;
* contorne controles de acesso;
* altere permissões sem requisito;
* comprometa integridade de estoque, pedidos ou pagamentos.

Mudanças relacionadas a autenticação, autorização, LGPD, pagamentos, dados pessoais, auditoria ou integridade transacional devem respeitar os requisitos e ADRs existentes.

Se houver risco significativo de segurança, privacidade, perda ou corrupção de dados, pare e reporte um `BLOCKER`.

## Integrações externas

Integrações com:

* gateways de pagamento;
* serviços de entrega;
* e-mail;
* notificações;
* armazenamento;
* monitoramento;
* outros serviços externos;

devem respeitar os contratos definidos.

Não substitua um provedor, altere o contrato de integração ou crie uma nova integração sem autorização.

Operações potencialmente duplicáveis, especialmente pagamentos e webhooks, devem respeitar os mecanismos de idempotência definidos na arquitetura e nos requisitos.

## Testes

Toda mudança deve possuir os testes aplicáveis ao comportamento alterado.

Quando aplicável, utilize:

* testes unitários;
* testes de integração;
* testes de API;
* testes de segurança;
* testes de aceitação;
* testes de regressão.

Não remova ou enfraqueça um teste somente para fazer a implementação passar.

Um teste que falha deve ser investigado.

Se a falha estiver fora do escopo da TASK ou depender de decisão externa, pare e registre um `BLOCKER`.

## Quality Gates e Definition of Done

Antes de uma TASK avançar de `IN_REVIEW` para `DONE`, execute e registre os Gates aplicáveis:

| Gate        | Obrigação                                                        |
| ----------- | ---------------------------------------------------------------- |
| Build       | Projeto deve compilar/construir sem erro                         |
| Lint        | Regras de lint devem passar                                      |
| Unit        | Testes unitários aplicáveis devem passar                         |
| Integration | Testes de integração aplicáveis devem passar                     |
| API         | Contratos e endpoints aplicáveis devem passar                    |
| Security    | Validações de segurança aplicáveis devem passar                  |
| Acceptance  | Critérios de aceitação devem ser atendidos                       |
| Regression  | Comportamentos existentes relevantes devem continuar funcionando |

Não afirme que um Gate passou sem executar a validação aplicável.

### Definition of Done

Uma TASK só pode ser `DONE` quando:

* implementação está concluída;
* requisitos relacionados foram atendidos;
* critérios de aceitação foram atendidos;
* documentação necessária foi atualizada;
* testes aplicáveis foram executados;
* Quality Gates aplicáveis passaram;
* erros conhecidos foram tratados ou formalmente registrados;
* Scope Guard foi respeitado;
* nenhuma alteração proibida foi realizada;
* `TASKS.md` foi atualizado;
* rastreabilidade está preservada.

## Commits

Utilize Conventional Commits:

```text
<tipo>(<escopo>): <descrição> [TASK-xxx]
```

Exemplos:

```text
feat(catalog): adicionar busca de produtos [TASK-012]
fix(cart): corrigir cálculo do subtotal [TASK-018]
test(order): adicionar testes de criação de pedido [TASK-021]
refactor(domain): reorganizar serviço de estoque [TASK-025]
docs(api): documentar endpoint de pedidos [TASK-029]
chore(deps): atualizar dependência aprovada [TASK-031]
```

Os commits devem ser:

* pequenos;
* coesos;
* rastreáveis;
* relacionados à TASK atual.

Não misture funcionalidades independentes no mesmo commit.

## Documentação

`README.md`, `TASKS.md`, ADRs e documentação de arquitetura possuem responsabilidades diferentes.

### README.md

Atualize somente quando houver alteração real e aprovada em:

* requisitos;
* escopo;
* domínio;
* arquitetura;
* APIs;
* regras;
* documentação oficial do sistema.

Não utilize `README.md` para registrar:

* estados de TASK;
* commits;
* resultados de testes;
* progresso operacional;
* histórico de execução.

### TASKS.md

Utilize `TASKS.md` para:

* estado das TASKs;
* dependências;
* execução;
* critérios;
* testes;
* Definition of Ready;
* Definition of Done;
* Scope Guard;
* resultados de execução.

### ADRs

Alterações arquiteturais relevantes devem ser documentadas por ADR.

Nenhuma decisão arquitetural importante deve ser escondida dentro de uma TASK ou implementada apenas no código.

## Bloqueios

Pare diante de:

* ambiguidade relevante;
* contradição entre fontes de verdade;
* dependência inválida;
* requisito incompleto;
* decisão arquitetural ausente;
* risco de segurança;
* risco de perda ou corrupção de dados;
* quebra de contrato;
* teste externo necessário que não pode ser executado;
* necessidade de alteração proibida;
* Scope Escalation;
* impossibilidade de atender critérios de aceitação.

Informe:

```text
## BLOCKER

TASK: TASK-xxx

Problema:

Impacto:

RF/RN/RNF/UC/ADR afetados:

Arquivos/módulos afetados:

Alternativas:

Recomendação:

Decisão necessária:
```

Não contorne um bloqueio silenciosamente.

## Alterações incidentais e arquivos modificados

Antes de concluir a TASK, classifique todos os arquivos alterados como:

```text
PRIMARY
INCIDENTAL
FORBIDDEN
```

Nenhum arquivo `FORBIDDEN` pode permanecer como alteração da TASK.

Toda alteração `INCIDENTAL` deve ser justificada e cumprir integralmente as regras de Incidental Change.

Se a quantidade ou abrangência das alterações incidentais indicar que a TASK ficou maior do que o previsto, pare e solicite revisão de escopo.

## Parada após conclusão

Depois de concluir uma TASK:

1. execute os Quality Gates aplicáveis;
2. valide a Definition of Done;
3. atualize `TASKS.md`;
4. prepare o relatório obrigatório;
5. pare.

**Não inicie automaticamente a próxima TASK.**

A próxima TASK somente poderá ser iniciada mediante autorização explícita.

## Relatório obrigatório

Ao concluir uma TASK, entregue:

```text
## TASK Execution Report

TASK: TASK-xxx
Status: DONE

Branch:
Commits:

### Primary Changes
- ...

### Incidental Changes
- ...

### Tests Executed
- ...

### Quality Gates

| Gate | Resultado |
|---|---|
| Build | PASS/FAIL |
| Lint | PASS/FAIL |
| Unit | PASS/FAIL/N/A |
| Integration | PASS/FAIL/N/A |
| API | PASS/FAIL/N/A |
| Security | PASS/FAIL/N/A |
| Acceptance | PASS/FAIL |
| Regression | PASS/FAIL/N/A |

### Scope Validation

Allowed Changes: PASS
Incidental Changes: PASS
Forbidden Changes: PASS
Scope Creep: NONE

### Definition of Done

PASS | FAIL

### Next Eligible TASK

TASK-xxx | NONE
```

Se a TASK falhar, o relatório deve refletir o estado real e indicar o motivo:

```text
Status: FAILED
```

Não declare `DONE` quando qualquer condição obrigatória da Definition of Done não for atendida.

## Regra final

O agente deve priorizar, nesta ordem:

1. requisitos e decisões aprovadas;
2. segurança e integridade dos dados;
3. escopo da TASK;
4. qualidade e testes;
5. rastreabilidade;
6. simplicidade da implementação.

**Não invente requisitos. Não tome decisões de produto silenciosamente. Não altere arquitetura sem decisão. Não faça scope creep. Não marque trabalho como concluído sem validação.**

Quando faltar uma decisão necessária, **pare e peça a decisão**.
