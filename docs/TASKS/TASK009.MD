Claro. Abaixo está o **template de produção detalhado da TASK-009**, seguindo a mesma estrutura da TASK-008 e mantendo o escopo estritamente limitado a estoque e movimentações.

 # TASK-009 — Estoque e movimentações

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-02 / HIGH\
 **Dependências:** `DEPENDS_ON: TASK-007,TASK-008`\
 **Estado de entrada esperado:** `BLOCKED` até `TASK-007 = DONE` e `TASK-008 = DONE`\
 **Estado de execução permitido:** `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-013, RF-014, RN-006, RN-007, UC-010, ADR-005

---

 ## 1\. Objetivo

 Implementar o domínio de estoque do Tropa Fight, permitindo controlar:

 - saldo disponível por produto/variante;
- entradas de estoque;
- saídas de estoque;
- ajustes administrativos;
- movimentações de estoque;
- consulta de saldo;
- histórico de movimentações;
- integridade do saldo;
- controle de concorrência aplicável;
- autorização para operações administrativas.

 A implementação deve utilizar as variantes de produto entregues pela `TASK-007` e manter compatibilidade com o catálogo e a experiência de consulta entregues pelas `TASK-008`.

 Esta TASK **não implementa reserva de estoque para checkout**, integração logística externa, pagamento ou qualquer mecanismo comercial posterior.

---

 ## 2\. Pré-condições / Definition of Ready

 A TASK-009 somente poderá entrar em `READY` quando:

 - `TASK-007` estiver em `DONE`;
- `TASK-008` estiver em `DONE`;
- o DoD global das dependências estiver satisfeito;
- `ProductVariant` estiver disponível e possuir identificação estável;
- a relação entre produto e variante estiver definida;
- o conceito de disponibilidade comercial estiver documentado;
- os perfis autorizados para operações de estoque estiverem definidos;
- as regras de entrada, saída e ajuste estiverem aprovadas;
- `ADR-005`, caso necessário, estiver aprovado;
- a estratégia de concorrência/transação estiver definida;
- o comportamento para saldo insuficiente estiver definido;
- o comportamento para estoque inicial estiver definido;
- não existirem decisões críticas pendentes;
- o Scope Guard da TASK-009 estiver validado.

 Se qualquer requisito acima não estiver comprovado, a TASK permanece `BLOCKED`.

---

 ## 3\. Resultado esperado

 Ao final da TASK deverá existir um mecanismo consistente para:

```
Produto/Variante
      ↓
Saldo de estoque
      ↓
Movimentação
      ↓
Atualização transacional do saldo
      ↓
Registro auditável
```

 O sistema deverá conseguir responder:

 - qual é o saldo atual de uma variante;
- quais movimentações alteraram esse saldo;
- qual foi o tipo da movimentação;
- qual foi a quantidade;
- quando ocorreu;
- quem executou a operação, quando aplicável;
- qual foi a justificativa/referência, quando exigida.

---

 ## 4\. Modelo conceitual

 O modelo mínimo deverá contemplar os conceitos:

```
Product
   └── ProductVariant
           └── Inventory
                  └── InventoryMovement
```

 ### Inventory

 Representa o estado atual do estoque de uma variante.

 Campos conceituais:

```
id
productVariantId
quantity
createdAt
updatedAt
```

 Campos adicionais somente deverão ser introduzidos se forem necessários ao requisito aprovado.

 ### InventoryMovement

 Representa uma alteração de estoque.

 Campos conceituais:

```
id
inventoryId / productVariantId
type
quantity
reason
reference
performedBy
createdAt
```

 Os nomes definitivos devem seguir os padrões do projeto.

---

 ## 5\. Tipos de movimentação

 Os tipos efetivamente suportados deverão ser definidos pelo requisito/ADR aprovado.

 Conceitualmente:

```
ENTRY
EXIT
ADJUSTMENT
```

 Caso seja necessário distinguir ajustes positivos e negativos, isso deverá ser feito de maneira explícita no contrato.

 Não criar tipos adicionais apenas por conveniência.

---

 ## 6\. Regras fundamentais de estoque

 ### 6.1 Quantidade

 Quantidades devem ser:

 - inteiras, caso o domínio comercial utilize unidades discretas;
- maiores que zero para movimentações;
- validadas antes da persistência.

 Valores negativos ou zero não devem ser aceitos como quantidade de uma movimentação positiva.

---

 ### 6.2 Entrada

 Uma entrada aumenta o saldo:

```
saldo_novo = saldo_anterior + quantidade
```

 Exemplo:

```
saldo = 10
entrada = 5

novo saldo = 15
```

 A alteração do saldo e o registro da movimentação devem ocorrer de maneira transacional.

---

 ### 6.3 Saída

 Uma saída reduz o saldo:

```
saldo_novo = saldo_anterior - quantidade
```

 Quando a regra de negócio não permitir estoque negativo:

```
quantidade_saida <= saldo_atual
```

 deve ser garantido de forma atômica.

 Não é suficiente validar apenas na camada de aplicação antes da operação de persistência.

---

 ### 6.4 Ajuste

 Ajustes devem possuir semântica explicitamente definida.

 Exemplo:

```
saldo atual = 10
ajuste = -2

novo saldo = 8
```

 ou, se o contrato utilizar ajuste absoluto:

```
saldo atual = 10
novo saldo = 8
ajuste registrado = -2
```

 A implementação deve escolher apenas a semântica aprovada pelo domínio.

 Não implementar simultaneamente semânticas diferentes sem necessidade.

---

 ## 7\. Invariantes

 O sistema deve preservar, no mínimo:

 ### INV-01 — Saldo não negativo

 Quando o domínio não permitir estoque negativo:

```
Inventory.quantity >= 0
```

 ### INV-02 — Movimentação válida

 Toda alteração de saldo deve possuir uma movimentação correspondente.

 ### INV-03 — Quantidade válida

 Toda movimentação deve possuir quantidade válida.

 ### INV-04 — Variante válida

 Uma movimentação deve estar associada a uma `ProductVariant` existente.

 ### INV-05 — Atomicidade

 Não deve existir cenário em que:

```
saldo é alterado
MAS
movimentação não é registrada
```

 ou o inverso.

 ### INV-06 — Concorrência

 Duas operações concorrentes não podem produzir saldo incorreto devido a condição de corrida.

 ### INV-07 — Rastreabilidade

 Movimentações administrativas devem permitir identificar o contexto mínimo necessário para auditoria.

---

 ## 8\. Concorrência

 Este é um requisito crítico da TASK.

 A implementação deverá tratar cenários como:

```
Saldo = 1

Operação A → saída de 1
Operação B → saída de 1
```

 O sistema não deve permitir que ambas sejam confirmadas se a regra de negócio determinar que o saldo não pode ficar negativo.

 A estratégia poderá utilizar, conforme arquitetura aprovada:

 - transação;
- lock pessimista;
- controle otimista;
- atualização condicional;
- mecanismo equivalente.

 A decisão técnica deve ser documentada quando representar decisão arquitetural relevante.

 ### Critério obrigatório

 A verificação:

```
saldo >= quantidade
```

 e a atualização:

```
saldo = saldo - quantidade
```

 devem ser atomicamente consistentes.

 Não confiar exclusivamente em:

```
SELECT saldo
→ verificar na aplicação
→ UPDATE saldo
```

 sem proteção contra concorrência.

---

 ## 9\. Operações funcionais

 ### 9.1 Consultar estoque

 Permitir consulta do saldo de uma variante.

 Exemplo conceitual:

```
GET /inventory/{variantId}
```

 A resposta deverá informar o saldo atual conforme contrato aprovado.

---

 ### 9.2 Consultar movimentações

 Permitir consulta do histórico de movimentações de uma variante, respeitando:

 - autorização;
- paginação, se aplicável;
- ordenação determinística;
- filtros aprovados.

 Exemplo conceitual:

```
GET /inventory/{variantId}/movements
```

---

 ### 9.3 Registrar entrada

 Operação administrativa:

```
POST /inventory/{variantId}/entries
```

 Deve:

 1. validar variante;
2. validar quantidade;
3. validar autorização;
4. iniciar transação;
5. atualizar saldo;
6. registrar movimentação;
7. confirmar transação.

---

 ### 9.4 Registrar saída

 Operação administrativa:

```
POST /inventory/{variantId}/exits
```

 Deve:

 1. validar variante;
2. validar quantidade;
3. validar autorização;
4. verificar saldo de forma concorrente-segura;
5. atualizar saldo;
6. registrar movimentação;
7. confirmar transação.

 Se o saldo for insuficiente, nenhuma alteração deve persistir.

---

 ### 9.5 Registrar ajuste

 Operação administrativa:

```
POST /inventory/{variantId}/adjustments
```

 O ajuste deve:

 - validar autorização;
- validar quantidade/valor;
- exigir justificativa quando definida pelo requisito;
- atualizar saldo;
- registrar movimentação;
- manter atomicidade.

---

 ## 10\. Autorização

 Operações de alteração de estoque devem ser administrativas e protegidas pelo mecanismo de autorização existente.

 No mínimo:

```
CONSULTA
ALTERAÇÃO
AUDITORIA/HISTÓRICO
```

 devem possuir regras claras.

 Clientes comuns não podem:

 - criar entrada;
- criar saída;
- alterar saldo;
- excluir movimentações;
- alterar histórico.

 A matriz definitiva deve utilizar as roles/permissions criadas nas TASKs anteriores.

 Não criar novos papéis nesta TASK sem decisão explícita.

---

 ## 11\. Imutabilidade do histórico

 Movimentações de estoque devem ser tratadas como registros históricos.

 Não permitir:

 - edição arbitrária de movimentação;
- alteração silenciosa de quantidade;
- alteração silenciosa do tipo;
- exclusão que elimine rastreabilidade.

 Caso uma movimentação tenha sido registrada incorretamente, a correção deverá ocorrer por nova movimentação apropriada, conforme regra aprovada.

 Qualquer exceção deverá ser explicitamente definida pelo domínio.

---

 ## 12\. API — contrato conceitual

 Os endpoints abaixo são exemplos de estrutura e não substituem o contrato oficial.

 ### Consulta de saldo

```
GET /inventory/{variantId}
```

 Resposta conceitual:

```
{
  "variantId": "variant-id",
  "quantity": 25
}
```

 ### Histórico

```
GET /inventory/{variantId}/movements
```

 ### Entrada

```
POST /inventory/{variantId}/entries
```

 Payload conceitual:

```
{
  "quantity": 10,
  "reason": "Reposição"
}
```

 ### Saída

```
POST /inventory/{variantId}/exits
```

 Payload conceitual:

```
{
  "quantity": 3,
  "reason": "Ajuste operacional"
}
```

 ### Ajuste

```
POST /inventory/{variantId}/adjustments
```

 Payload conceitual:

```
{
  "quantity": -2,
  "reason": "Inventário físico"
}
```

 Os formatos finais devem respeitar os padrões de API existentes.

---

 ## 13\. Persistência

 A persistência deverá garantir:

 - identificação única da variante;
- um estado de estoque consistente por variante;
- integridade referencial;
- histórico de movimentações;
- atomicidade;
- consistência sob concorrência.

 ### Unicidade

 Deverá existir uma regra que impeça múltiplos registros de `Inventory` representando simultaneamente o saldo oficial da mesma variante, salvo se a arquitetura aprovada utilizar explicitamente outra granularidade.

---

 ## 14\. Transações

 Uma movimentação deverá ser processada conceitualmente como:

```
BEGIN TRANSACTION

validar variante
validar autorização
carregar/atualizar inventory com proteção de concorrência
validar saldo
calcular novo saldo
persistir novo saldo
persistir InventoryMovement

COMMIT
```

 Se qualquer etapa falhar:

```
ROLLBACK
```

 O saldo não poderá ficar parcialmente atualizado.

---

 ## 15\. Idempotência

 A TASK-009 não deve implementar a estratégia de idempotência de pagamentos da `TASK-014`.

 Entretanto, operações de estoque não devem permitir duplicação acidental causada por repetição da mesma requisição, caso a arquitetura/API já possua mecanismo de idempotência aplicável.

 Se for identificada necessidade de uma estratégia específica de idempotência de estoque, ela deve ser tratada como decisão técnica separada e não introduzida silenciosamente.

---

 ## 16\. Integração com catálogo

 A integração com `ProductVariant` deverá garantir:

```
Product
   ↓
ProductVariant
   ↓
Inventory
```

 O estoque deve estar associado à variante, e não somente ao produto genérico, quando variantes representam unidades comercialmente distintas.

 Exemplo:

```
Produto: Luva Tropa
 ├── Variante: P
 ├── Variante: M
 └── Variante: G
```

 Cada variante deve possuir seu próprio saldo quando esse for o modelo definido pelo catálogo.

---

 ## 17\. Disponibilidade comercial

 A TASK poderá fornecer o dado necessário para determinar disponibilidade, mas não deverá duplicar regras de venda em múltiplos lugares.

 Exemplo conceitual:

```
quantity > 0
    ↓
disponibilidade de estoque
```

 A regra final de “pode ser vendido” deverá continuar respeitando o domínio de catálogo e comércio.

 Não implementar nesta TASK:

 - reserva;
- expiração de reserva;
- decremento definitivo de checkout;
- rollback de pagamento;
- compensação de pedido.

---

 ## 18\. Casos de borda obrigatórios

 Testar pelo menos:

 - variante inexistente;
- estoque inexistente para variante válida;
- estoque inicial zero;
- entrada de quantidade válida;
- entrada com quantidade zero;
- entrada com quantidade negativa;
- saída menor que saldo;
- saída igual ao saldo;
- saída maior que saldo;
- ajuste positivo;
- ajuste negativo;
- ajuste que levaria saldo abaixo de zero;
- usuário sem permissão;
- movimentação sem justificativa quando justificativa for obrigatória;
- duas saídas concorrentes;
- entrada e saída concorrentes;
- falha durante atualização do saldo;
- falha durante gravação da movimentação;
- tentativa de alterar movimentação existente;
- tentativa de excluir movimentação;
- consulta de histórico;
- paginação do histórico, se aplicável.

---

 ## 19\. Matriz mínima de testes

 | Cenário | Resultado esperado |
| --- | --- |
| Consultar variante válida | Retorna saldo |
| Consultar variante inexistente | Erro de recurso inexistente |
| Criar entrada | Saldo aumenta |
| Criar saída válida | Saldo diminui |
| Saída igual ao saldo | Saldo chega a zero |
| Saída superior ao saldo | Operação rejeitada |
| Entrada zero | Rejeitada |
| Entrada negativa | Rejeitada |
| Saída zero | Rejeitada |
| Saída negativa | Rejeitada |
| Ajuste válido | Saldo atualizado |
| Ajuste inválido | Operação rejeitada |
| Usuário não autorizado | Acesso negado |
| Histórico | Movimentações retornadas |
| Movimentação inválida | Não altera saldo |
| Falha transacional | Rollback |
| Concorrência | Saldo permanece consistente |
| Duas saídas sobre saldo 1 | No máximo uma saída é confirmada |
| Variante sem estoque | Saldo inicial consistente |
| Movimentação registrada | Histórico preservado |

---

 ## 20\. Testes de concorrência

 Os testes de concorrência são obrigatórios.

 ### Cenário principal

 Estado inicial:

```
saldo = 1
```

 Duas requisições simultâneas:

```
A → saída 1
B → saída 1
```

 Resultado esperado:

```
uma operação → sucesso
uma operação → rejeitada
saldo final = 0
```

 Não é aceitável:

```
A → sucesso
B → sucesso
saldo final = -1
```

 nem:

```
A → sucesso
B → sucesso
saldo final = 0
```

 se isso significar que duas saídas foram efetivamente confirmadas.

 O teste deve validar não somente o valor final, mas também o número correto de movimentações registradas.

---

 ## 21\. Testes de atomicidade

 ### Falha antes da alteração

 Esperado:

```
saldo inalterado
movimentação inexistente
```

 ### Falha depois da alteração mas antes do commit

 Esperado:

```
saldo revertido
movimentação revertida
```

 ### Sucesso completo

 Esperado:

```
saldo atualizado
+
movimentação registrada
```

 Não deve existir estado intermediário persistido.

---

 ## 22\. Testes de autorização

 Validar pelo menos:

```
cliente → consulta pública permitida conforme contrato
cliente → alterar estoque NEGADO
admin autorizado → consultar estoque PERMITIDO
admin autorizado → alterar estoque PERMITIDO
admin não autorizado → alterar estoque NEGADO
```

 A matriz final deve utilizar as permissões efetivamente existentes no projeto.

---

 ## 23\. Auditoria

 A TASK-009 deve integrar-se à fundação de auditoria existente, quando aplicável.

 Operações administrativas críticas devem permitir rastrear:

 - quem executou;
- qual variante foi alterada;
- tipo de movimentação;
- quantidade;
- momento da operação;
- contexto/referência, quando definido.

 Não duplicar o mecanismo de `AuditLog` criado anteriormente.

 A TASK deve consumir a abstração existente.

---

 ## 24\. Observabilidade

 Registrar somente informações necessárias à operação.

 Exemplos de eventos observáveis:

```
inventory.entry.created
inventory.exit.created
inventory.adjustment.created
inventory.operation.rejected
inventory.concurrent_update_conflict
```

 Os nomes são ilustrativos.

 Não registrar:

 - credenciais;
- tokens;
- segredos;
- dados sensíveis desnecessários.

 A consolidação completa de observabilidade pertence à `TASK-020`.

---

 ## 25\. Performance

 A implementação deve evitar:

 - consulta repetitiva do saldo sem necessidade;
- N+1 no histórico;
- carregamento completo de movimentações;
- locks excessivamente abrangentes;
- operações administrativas sem limites;
- consultas sem paginação quando o histórico puder crescer indefinidamente.

 Se o histórico for paginado, deverá possuir:

 - limite padrão;
- limite máximo;
- ordenação determinística.

---

 ## 26\. ALLOWED\_CHANGES

 São permitidas alterações em:

```
módulos inventory/stock
entidades Inventory
entidades InventoryMovement
persistência de estoque
repositórios de estoque
serviços/casos de uso de estoque
APIs administrativas de estoque
APIs de consulta de estoque
testes unitários
testes de integração
testes de concorrência
testes de API
integração com autorização existente
integração com auditoria existente
índices diretamente necessários ao estoque
configurações diretamente necessárias
documentação técnica
ADR-005, quando aplicável
TASKS.md
```

 Alterações incidentais somente são permitidas quando diretamente causadas pela implementação e necessárias para preservar o funcionamento do sistema.

---

 ## 27\. FORBIDDEN\_CHANGES

 Não implementar:

```
reserva de estoque
reserva temporária de checkout
baixa definitiva por pedido
integração com checkout
integração com pagamento
integração com gateway
integração logística externa
transportadoras
rastreamento
devoluções
reembolsos
cupons
promoções
wishlist
avaliações
recomendação por IA
ERP
compras/fiscal
fornecedores
novos papéis de RBAC
alteração unilateral da arquitetura
```

 Também é proibido criar funcionalidades para antecipar a `TASK-011` ou qualquer TASK posterior.

---

 ## 28\. Scope Guard

 Antes de cada alteração relevante, responder:

```
A alteração é necessária para manter o saldo?
A alteração é necessária para registrar movimentações?
A alteração é necessária para garantir atomicidade?
A alteração é necessária para garantir concorrência?
A alteração é necessária para consulta de estoque?
A alteração é necessária para autorização da operação?
A alteração é necessária para auditoria da operação?
A alteração é necessária para os testes da TASK-009?
```

 Se a resposta for **não**, a alteração deve ficar fora desta TASK.

 ### Sinais de Scope Creep

 Considerar potencial Scope Creep:

```
"Já que estamos mexendo no estoque, vamos implementar reserva."
"Vamos integrar o estoque ao checkout agora."
"Vamos criar a baixa automática do pedido."
"Vamos preparar a integração com transportadora."
"Vamos alterar o modelo de pedido para facilitar."
```

 Essas alterações não devem ser incorporadas automaticamente.

---

 ## 29\. Rastreabilidade

 Manter:

```
RF-013 → estoque
RF-014 → movimentações
RN-006 → regras de saldo/movimentação
RN-007 → integridade/controle do estoque
UC-010 → administração/consulta de estoque
ADR-005 → decisão arquitetural relacionada ao estoque
```

 Cada requisito deve possuir evidência correspondente em:

 - código;
- testes;
- contrato;
- documentação;
- ou decisão arquitetural, quando aplicável.

---

 ## 30\. Estratégia de implementação

 ### Etapa 1 — Revisar dependências

 - revisar `TASK-007`;
- confirmar `ProductVariant`;
- revisar `TASK-008`;
- confirmar contratos de catálogo;
- confirmar autorização existente;
- confirmar auditoria disponível.

 ### Etapa 2 — Formalizar modelo

 Definir:

```
Inventory
InventoryMovement
MovementType
```

 Confirmar cardinalidade e integridade.

 ### Etapa 3 — Implementar persistência

 Criar:

 - tabelas/coleções;
- chaves;
- constraints;
- índices;
- unicidade;
- relacionamentos.

 ### Etapa 4 — Implementar consulta

 Implementar:

 - consulta de saldo;
- consulta de histórico;
- paginação, se aplicável;
- ordenação determinística.

 ### Etapa 5 — Implementar entrada

 Implementar fluxo transacional:

```
validar
→ atualizar
→ registrar movimentação
→ commit
```

 ### Etapa 6 — Implementar saída

 Implementar:

```
validar
→ proteger concorrência
→ verificar saldo
→ atualizar
→ registrar
→ commit
```

 ### Etapa 7 — Implementar ajuste

 Implementar somente a semântica aprovada.

 ### Etapa 8 — Integrar autorização

 Garantir que operações administrativas estejam protegidas.

 ### Etapa 9 — Integrar auditoria

 Registrar operações críticas através da abstração existente.

 ### Etapa 10 — Testes de concorrência

 Executar cenários concorrentes e validar:

 - saldo;
- movimentações;
- transação;
- ausência de saldo negativo indevido.

 ### Etapa 11 — Testes de API

 Validar contratos, erros, autorização e respostas.

 ### Etapa 12 — Quality Gates

 Executar:

```
build
lint
unit tests
integration tests
API tests
concurrency tests
```

 ### Etapa 13 — Scope Guard final

 Verificar:

 - nenhum checkout;
- nenhuma reserva;
- nenhum pagamento;
- nenhuma logística;
- nenhuma funcionalidade futura;
- nenhuma alteração arquitetural não aprovada.

 ### Etapa 14 — Relatório

 Produzir relatório completo de execução.

 ### Etapa 15 — Encerramento

 Atualizar:

```
TASKS.md
rastreamento
documentação
estado da TASK
relatório de execução
```

 E parar.

---

 ## 31\. Critérios de aceitação detalhados

 ### AC-01 — Saldo

 Cada variante possui saldo consistente conforme o modelo aprovado.

 ### AC-02 — Entrada

 Entradas válidas aumentam o saldo corretamente.

 ### AC-03 — Saída

 Saídas válidas reduzem o saldo corretamente.

 ### AC-04 — Saldo insuficiente

 Uma saída superior ao saldo é rejeitada sem alterar o estoque.

 ### AC-05 — Ajuste

 Ajustes válidos alteram o saldo conforme a semântica aprovada.

 ### AC-06 — Histórico

 Toda alteração de saldo gera movimentação correspondente.

 ### AC-07 — Atomicidade

 Saldo e movimentação são persistidos de maneira atômica.

 ### AC-08 — Concorrência

 Operações concorrentes não geram saldo inconsistente.

 ### AC-09 — Autorização

 Somente usuários autorizados podem alterar estoque.

 ### AC-10 — Auditoria

 Operações administrativas relevantes possuem rastreabilidade adequada.

 ### AC-11 — Integridade

 Não existem múltiplos saldos oficiais conflitantes para a mesma variante.

 ### AC-12 — API

 Contratos de consulta e alteração estão documentados e testados.

 ### AC-13 — Qualidade

 Build, lint e testes aplicáveis passam.

 ### AC-14 — Escopo

 Nenhuma funcionalidade pertencente às TASKs posteriores foi incorporada.

---

 ## 32\. Definition of Done específica

 A `TASK-009` somente poderá ser marcada como `DONE` quando:

 - [ ] `Inventory` implementado;
- [ ] `InventoryMovement` implementado;
- [ ] relacionamento com `ProductVariant` validado;
- [ ] consulta de saldo implementada;
- [ ] consulta de movimentações implementada;
- [ ] entrada implementada;
- [ ] saída implementada;
- [ ] ajuste implementado conforme regra aprovada;
- [ ] saldo negativo indevido impedido;
- [ ] atomicidade validada;
- [ ] concorrência validada;
- [ ] autorização validada;
- [ ] auditoria integrada;
- [ ] histórico preservado;
- [ ] movimentações inválidas rejeitadas;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes de concorrência passam;
- [ ] build passa;
- [ ] lint passa;
- [ ] documentação necessária atualizada;
- [ ] ADR-005 atualizado/criado quando aplicável;
- [ ] rastreabilidade RF/RN/UC atualizada;
- [ ] Scope Guard validado;
- [ ] `ALLOWED_CHANGES` respeitado;
- [ ] `FORBIDDEN_CHANGES` não violado;
- [ ] alterações incidentais justificadas;
- [ ] nenhum Scope Creep identificado;
- [ ] `TASKS.md` atualizado;
- [ ] relatório de execução produzido;
- [ ] estado final registrado como `DONE`.

---

 ## 33\. Condições de FAILED

 Marcar `FAILED` quando:

 - saldo puder ficar incorreto em cenário válido;
- concorrência produzir inconsistência;
- saldo for alterado sem movimentação correspondente;
- movimentação puder ser criada sem atualização consistente do saldo;
- autorização puder ser contornada;
- build/lint/testes obrigatórios permanecerem falhando;
- houver violação de `FORBIDDEN_CHANGES`;
- houver alteração arquitetural relevante sem aprovação;
- houver Scope Creep não autorizado.

 O relatório deverá registrar causa, evidências e impacto.

---

 ## 34\. Condições de CANCELLED

 `CANCELLED` somente mediante decisão explícita.

 Registrar:

```
motivo
decisão responsável
impacto na rastreabilidade
impacto nas dependências
artefatos produzidos
estado do código
```

 O cancelamento não autoriza automaticamente qualquer TASK dependente.

---

 ## 35\. Política de transição de estado

 Fluxo normal:

```
BLOCKED
   ↓
READY
   ↓
IN_PROGRESS
   ↓
IN_REVIEW
   ↓
DONE
```

 Exceções:

```
IN_PROGRESS → FAILED
IN_PROGRESS → CANCELLED
IN_REVIEW → IN_PROGRESS
```

 ### Entrada em READY

 Exige:

```
TASK-007 = DONE
+
TASK-008 = DONE
+
Definition of Ready satisfeita
+
Scope Guard validado
```

 ### Entrada em DONE

 Exige:

```
DoD global satisfeita
+
DoD específica satisfeita
+
testes obrigatórios aprovados
+
concorrência validada
+
relatório produzido
+
TASKS.md atualizado
```

---

 ## 36\. Relatório de execução — template

```
TASK: TASK-009
TÍTULO: Estoque e movimentações
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: <DONE|FAILED|CANCELLED>

DEPENDÊNCIAS:
- TASK-007: DONE
- TASK-008: DONE

OBJETIVO:
<resumo da implementação>

MODELO:
- Inventory: <implementado>
- InventoryMovement: <implementado>
- MovementType: <implementado>

IMPLEMENTADO:
- <item>
- <item>
- <item>

ARTEFATOS ALTERADOS:
- <arquivo/módulo>
- <arquivo/módulo>

PERSISTÊNCIA:
- <alterações>

API:
- <endpoint>
- <endpoint>

REGRAS DE ESTOQUE:
- Entrada: <resultado>
- Saída: <resultado>
- Ajuste: <resultado>
- Saldo negativo: <resultado>

CONCORRÊNCIA:
- Estratégia: <estratégia>
- Teste de saldo 1 / duas saídas: <PASS/FAIL>
- Resultado: <descrição>

ATOMICIDADE:
- Atualização de saldo + movimentação: <PASS/FAIL>
- Rollback: <PASS/FAIL>

AUTORIZAÇÃO:
- Consulta: <resultado>
- Entrada: <resultado>
- Saída: <resultado>
- Ajuste: <resultado>

AUDITORIA:
- <resultado>

TESTES EXECUTADOS:
- Build: <PASS/FAIL>
- Lint: <PASS/FAIL>
- Unit: <PASS/FAIL>
- Integration: <PASS/FAIL>
- API: <PASS/FAIL>
- Concurrency: <PASS/FAIL>

RASTREABILIDADE:
- RF-013 → <evidência>
- RF-014 → <evidência>
- RN-006 → <evidência>
- RN-007 → <evidência>
- UC-010 → <evidência>
- ADR-005 → <evidência>

SCOPE GUARD:
- ALLOWED_CHANGES: PASS
- FORBIDDEN_CHANGES: PASS
- Scope Creep: NÃO IDENTIFICADO

ALTERAÇÕES INCIDENTAIS:
- <nenhuma / descrição + justificativa>

DECISÕES:
- <decisão ou N/A>

BLOQUEIOS:
- <nenhum / descrição>

RISCOS RESIDUAIS:
- <nenhum / descrição>

DOCUMENTAÇÃO:
- <artefato atualizado>

TASKS.md:
- atualizado: <SIM/NÃO>

CONCLUSÃO:
<resultado factual da execução>

PRÓXIMO ESTADO:
<DONE|FAILED|CANCELLED>
```

---

 ## 37\. Regra de encerramento

 Ao concluir a `TASK-009`:

 1. atualizar `TASKS.md`;
2. registrar o relatório de execução;
3. preservar a rastreabilidade;
4. validar todos os Quality Gates;
5. validar especificamente os testes de concorrência;
6. registrar eventuais riscos ou bloqueios;
7. atualizar o estado da TASK;
8. **não iniciar automaticamente a `TASK-010`**;
9. aguardar autorização explícita para a próxima TASK.