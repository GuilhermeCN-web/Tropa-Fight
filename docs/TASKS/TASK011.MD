# TASK-011 — Carrinho e cálculo comercial

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-03 / CRITICAL\
 **Dependências:** `DEPENDS_ON: TASK-010`\
 **Estado de entrada esperado:** `BLOCKED` até `TASK-010 = DONE`\
 **Estado de execução permitido:** `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-015, RF-016, RF-017, RN-008, RN-009, UC-004

---

 ## 1\. Objetivo

 Implementar o domínio de carrinho de compras e seu cálculo comercial básico, permitindo que um cliente:

 - crie/obtenha seu carrinho;
- adicione itens;
- altere quantidades;
- remova itens;
- consulte o carrinho;
- obtenha subtotal;
- tenha os valores calculados de forma determinística;
- tenha itens inválidos ou indisponíveis rejeitados conforme as regras aprovadas.

 A implementação deve estabelecer uma base transacional e determinística para as próximas TASKs da PHASE-03, sem antecipar:

 - cupons;
- promoções;
- checkout;
- pagamento;
- pedidos;
- frete;
- captura de pagamento.

---

 # 2\. Resultado esperado

 Ao final da TASK deverá existir um fluxo funcional:

```
Cliente
   ↓
Carrinho
   ↓
Item do carrinho
   ↓
Variante
   ↓
Preço vigente
   ↓
Quantidade válida
   ↓
Subtotal
```

 Com cálculo:

```
subtotal_item = preço_unitário × quantidade

subtotal_carrinho = Σ subtotal_item
```

 O cálculo deve ser determinístico para os mesmos dados de entrada.

---

 # 3\. Pré-condições / Definition of Ready

 A TASK-011 somente poderá entrar em `READY` quando:

 - `TASK-010 = DONE`;
- PHASE-02 estiver formalmente liberada;
- catálogo estiver funcional;
- variantes estiverem disponíveis;
- preços estiverem disponíveis;
- disponibilidade/estoque estiverem funcionais;
- contratos relevantes estiverem documentados;
- build estiver passando;
- lint estiver passando;
- testes das fases anteriores estiverem passando;
- rastreabilidade estiver atualizada;
- decisões comerciais necessárias para o carrinho estiverem aprovadas;
- Scope Guard da TASK-011 estiver validado.

 Se alguma decisão comercial necessária estiver ausente, a TASK deve permanecer `BLOCKED`.

---

 # 4\. Escopo funcional

 A TASK deverá contemplar:

 ### Carrinho

 - criação;
- recuperação;
- identificação do proprietário;
- estado do carrinho;
- persistência;
- atualização;
- remoção.

 ### Itens

 - adição;
- quantidade;
- atualização;
- remoção;
- associação com variante;
- preço unitário;
- subtotal do item.

 ### Cálculo

 - subtotal;
- total de itens;
- quantidade total;
- valores monetários;
- arredondamento conforme padrão definido.

 ### Validação

 - variante existente;
- variante elegível para venda;
- quantidade válida;
- disponibilidade;
- preço válido;
- propriedade do carrinho;
- consistência dos itens.

---

 # 5\. Fora do escopo

 Não implementar:

```
cupons
promoções
descontos promocionais
checkout
Order
OrderItem
Payment
PaymentIntent
captura de pagamento
gateway
webhook
frete
Shipment
endereço
cálculo de entrega
rastreamento
reserva definitiva de estoque
baixa definitiva de estoque
reembolso
cancelamento de pedido
wishlist
recomendação
avaliações
```

 Também não alterar regras de preço do catálogo para acomodar o carrinho.

---

 # 6\. Princípios de implementação

 ## 6.1 Determinismo

 Para uma mesma entrada:

```
variante
preço
quantidade
```

 o resultado deve ser sempre:

```
subtotal_item
subtotal_carrinho
```

 idêntico.

---

 ## 6.2 Dinheiro

 Valores monetários não devem ser calculados com precisão binária inadequada.

 Utilizar o mecanismo monetário adotado pelo projeto, por exemplo:

```
Decimal
ou
minor units
```

 conforme ADR/padrão já aprovado.

 Não introduzir uma nova estratégia monetária sem decisão arquitetural.

---

 ## 6.3 Quantidade

 Quantidade deve ser validada antes de entrar no carrinho.

 Regras mínimas:

```
quantidade > 0
quantidade inteira
quantidade dentro dos limites aprovados
```

 Se o domínio possuir limite máximo por item, esse limite deve ser aplicado conforme requisito aprovado.

---

 ## 6.4 Propriedade

 Um cliente somente pode manipular o próprio carrinho.

 Tentativas de acessar ou alterar carrinho de outro cliente devem ser rejeitadas.

---

 # 7\. Modelo de domínio esperado

 A implementação deve possuir conceito equivalente a:

```
Cart
 ├── id
 ├── customerId
 ├── status
 ├── items
 ├── subtotal
 ├── totalItems
 ├── createdAt
 └── updatedAt
```

 e:

```
CartItem
 ├── id
 ├── cartId
 ├── productVariantId
 ├── quantity
 ├── unitPrice
 └── subtotal
```

 Os nomes concretos podem seguir as convenções do projeto.

 Não criar entidades adicionais sem necessidade.

---

 # 8\. Estado do carrinho

 Se houver estado explícito no domínio, utilizar somente estados aprovados.

 Exemplo:

```
ACTIVE
```

 Caso estados adicionais sejam necessários, eles precisam estar respaldados por requisito/decisão.

 Não criar prematuramente estados como:

```
CHECKED_OUT
PAID
CANCELLED
EXPIRED
```

 sem necessidade nesta TASK.

 O pedido é responsabilidade das TASKs posteriores.

---

 # 9\. Identidade do carrinho

 Definir explicitamente a regra de identificação.

 O carrinho deve possuir vínculo inequívoco com o cliente autenticado.

 Garantir:

```
Customer A → Cart A
Customer B → Cart B
```

 e impedir:

```
Customer A → Cart B
```

 por manipulação de identificador.

 A regra deve ser coberta por teste de autorização.

---

 # 10\. Adição de item

 Ao adicionar uma variante:

 1. validar autenticação;
2. localizar variante;
3. validar existência;
4. validar elegibilidade para venda;
5. validar quantidade;
6. validar disponibilidade conforme regra aprovada;
7. verificar se a variante já existe no carrinho;
8. aplicar a regra de consolidação;
9. calcular valores;
10. persistir atomicamente;
11. retornar o carrinho atualizado.

---

 # 11\. Item duplicado

 Definir comportamento determinístico quando a mesma variante for adicionada novamente.

 A implementação deve seguir a regra aprovada para o produto.

 Caso a regra seja acumular:

```
quantidade existente = 2
nova quantidade = 3

resultado = 5
```

 Caso o limite seja ultrapassado:

```
resultado → rejeitado
```

 Não criar comportamento implícito.

 A regra deve possuir teste específico.

---

 # 12\. Quantidade inválida

 Rejeitar pelo menos:

```
0
número negativo
decimal quando quantidade inteira é exigida
null
undefined
string inválida
valor acima do limite aprovado
```

 Exemplo:

```
POST /cart/items

quantity = 0
→ 4xx
```

 A resposta deve possuir erro consistente com o padrão da API.

---

 # 13\. Variante inexistente

 Tentativa:

```
variantId = inexistente
```

 deve ser rejeitada.

 Não criar automaticamente:

 - produto;
- variante;
- estoque;
- preço.

 O carrinho nunca deve conter referência inválida.

---

 # 14\. Variante indisponível

 Se a variante não puder ser adicionada conforme as regras aprovadas, rejeitar a operação.

 Exemplos:

```
produto não publicável
variante inativa
estoque insuficiente
variante não vendável
```

 A regra exata deve respeitar o domínio já implementado na PHASE-02.

 Não implementar reserva definitiva de estoque.

---

 # 15\. Estoque e carrinho

 O carrinho não deve assumir posse definitiva do estoque.

 A validação no momento da adição serve para impedir inclusão claramente inválida conforme a regra aprovada.

 A TASK-011 não deve implementar:

```
reserva permanente
bloqueio de estoque
baixa definitiva
expiração de reserva
reconciliação de pedido
```

 Esses comportamentos pertencem ao fluxo comercial posterior quando especificados.

---

 # 16\. Preço do item

 O item deverá possuir o preço necessário para cálculo do carrinho.

 Deve ser definida, de acordo com o requisito aprovado, a origem do preço utilizado:

```
ProductVariant
        ↓
Pricing
        ↓
CartItem
```

 O mecanismo não pode aceitar arbitrariamente:

```
unitPrice enviado pelo cliente
```

 sem validação no domínio.

 Exemplo proibido:

```
{
  "variantId": "...",
  "quantity": 2,
  "unitPrice": 0.01
}
```

 O cliente não deve controlar o preço comercial.

---

 # 17\. Preço e segurança

 O servidor deve ser a fonte de verdade do cálculo.

 Nunca confiar no:

```
subtotal enviado pelo frontend
total enviado pelo frontend
preço enviado pelo frontend
```

 O cliente pode enviar:

```
variantId
quantity
```

 e o servidor determina os valores comerciais.

---

 # 18\. Subtotal do item

 Para cada item:

```
subtotal_item =
    unitPrice × quantity
```

 Exemplo:

```
unitPrice = 79,90
quantity = 3

subtotal = 239,70
```

 Cobrir com teste.

---

 # 19\. Subtotal do carrinho

 Para:

```
Item A = 100,00
Item B = 50,00
Item C = 25,50
```

 resultado:

```
subtotal = 175,50
```

 O cálculo deve ser realizado a partir dos dados confiáveis do domínio.

 Não aceitar subtotal calculado pelo cliente como fonte de verdade.

---

 # 20\. Arredondamento

 Definir e respeitar uma única política de arredondamento.

 O comportamento deve ser consistente entre:

 - domínio;
- API;
- persistência;
- testes.

 Evitar:

```
float/double
```

 para representar dinheiro se isso contrariar a arquitetura financeira do projeto.

 Casos de borda devem possuir testes.

---

 # 21\. Atualização de quantidade

 Permitir alteração de quantidade somente para itens pertencentes ao carrinho do cliente.

 Fluxo:

```
identificar carrinho
      ↓
identificar item
      ↓
validar propriedade
      ↓
validar quantidade
      ↓
validar disponibilidade
      ↓
recalcular
      ↓
persistir
```

 A operação deve ser atômica.

---

 # 22\. Remoção de item

 Ao remover um item:

 - validar propriedade do carrinho;
- localizar item;
- remover;
- recalcular subtotal;
- recalcular quantidade total;
- persistir;
- retornar carrinho atualizado.

 Remover um item inexistente deve possuir comportamento definido pelo padrão da API.

 Não remover estoque como consequência da remoção do item.

---

 # 23\. Carrinho vazio

 O carrinho vazio deve possuir estado válido.

 Exemplo:

```
items = []
totalItems = 0
subtotal = 0
```

 Não retornar `null` ou valores monetários indefinidos sem justificativa arquitetural.

---

 # 24\. Recalculo

 Sempre que houver alteração que impacte o carrinho:

```
adicionar item
alterar quantidade
remover item
```

 o cálculo deve ser atualizado.

 Não permitir estado persistido em que:

```
Σ item.subtotal != cart.subtotal
```

 quando ambos os campos existirem.

---

 # 25\. Invariantes

 Os seguintes invariantes devem ser preservados.

 ### INV-01 — Quantidade

```
quantity > 0
```

 ### INV-02 — Item pertence a um carrinho

```
CartItem.cartId != null
```

 ### INV-03 — Variante válida

```
CartItem.productVariantId → variante existente
```

 ### INV-04 — Preço válido

```
unitPrice >= 0
```

 e deve seguir a regra comercial aprovada.

 ### INV-05 — Subtotal do item

```
item.subtotal = item.unitPrice × item.quantity
```

 ### INV-06 — Subtotal do carrinho

```
cart.subtotal = Σ cartItem.subtotal
```

 ### INV-07 — Quantidade total

```
cart.totalItems = Σ cartItem.quantity
```

 ### INV-08 — Propriedade

```
cart.customerId = usuário autenticado
```

 ### INV-09 — Não duplicidade

 Se a regra do domínio for um item por variante:

```
COUNT(CartItem WHERE variantId = X) <= 1
```

---

 # 26\. Concorrência

 O carrinho deve tratar operações concorrentes de forma consistente.

 Cenário:

```
quantidade atual = 1

request A → +1
request B → +1
```

 O resultado esperado deve obedecer à estratégia transacional adotada.

 Não aceitar perda silenciosa de atualização.

 Exemplo de falha:

```
A lê 1
B lê 1
A grava 2
B grava 2
```

 se a intenção das duas operações era chegar a 3.

 A estratégia concreta pode utilizar:

 - transação;
- optimistic locking;
- locking adequado;
- operação atômica;
- outra solução aprovada.

---

 # 27\. Concorrência e estoque

 A TASK-011 não deve transformar o carrinho em mecanismo de reserva definitiva de estoque.

 Entretanto, deve evitar afirmar ao cliente que uma disponibilidade foi garantida além do que o domínio realmente garante.

 A validação de disponibilidade deve refletir o comportamento aprovado na PHASE-02.

---

 # 28\. Persistência

 A persistência deve garantir:

 - integridade referencial;
- propriedade do carrinho;
- consistência de itens;
- ausência de itens órfãos;
- unicidade quando aplicável;
- atomicidade das alterações.

 Se houver constraint de unicidade para:

```
cartId + productVariantId
```

 ela deve ser coerente com a regra de consolidação dos itens.

---

 # 29\. Transações

 Operações compostas devem ser atômicas.

 Por exemplo:

```
adicionar item
+
atualizar quantidade
+
recalcular subtotal
+
persistir
```

 não deve deixar estado parcialmente atualizado.

 Em caso de falha:

```
ROLLBACK
```

 ou mecanismo equivalente.

---

 # 30\. API / contratos

 Os endpoints concretos devem seguir a arquitetura já definida.

 O contrato deverá contemplar operações equivalentes a:

```
GET    /cart
POST   /cart/items
PATCH  /cart/items/{itemId}
DELETE /cart/items/{itemId}
```

 Se o projeto usar outra convenção, preservar a convenção existente.

---

 # 31\. Contrato de criação de item

 Entrada conceitual:

```
{
  "variantId": "variant-id",
  "quantity": 2
}
```

 O cliente não deve enviar como fonte de verdade:

```
{
  "unitPrice": 10,
  "subtotal": 20
}
```

 Se esses campos forem aceitos por compatibilidade, devem ser ignorados ou validados conforme contrato explícito.

---

 # 32\. Contrato de resposta

 A resposta deve fornecer informações suficientes para o frontend apresentar o carrinho.

 Exemplo conceitual:

```
{
  "id": "cart-id",
  "items": [
    {
      "id": "item-id",
      "variantId": "variant-id",
      "quantity": 2,
      "unitPrice": 79.90,
      "subtotal": 159.80
    }
  ],
  "totalItems": 2,
  "subtotal": 159.80
}
```

 Os nomes e formatos devem seguir o padrão real da aplicação.

---

 # 33\. Erros

 Cobrir pelo menos:

```
carrinho inexistente
item inexistente
variante inexistente
variante indisponível
quantidade inválida
quantidade acima do limite
carrinho de outro cliente
preço inválido
falha transacional
conflito concorrente
```

 As respostas devem utilizar o mecanismo padronizado de erros da aplicação.

---

 # 34\. Autorização

 Testar no mínimo:

```
Cliente A → próprio carrinho → permitido
Cliente A → carrinho do Cliente B → negado
Cliente A → item do Cliente B → negado
Usuário não autenticado → carrinho privado → negado
Admin → conforme regra aprovada
```

 Não conceder acesso administrativo adicional apenas para facilitar testes.

---

 # 35\. Segurança

 Validar:

 - IDOR/BOLA;
- manipulação de `cartId`;
- manipulação de `itemId`;
- manipulação de `variantId`;
- preço controlado pelo cliente;
- quantidade malformada;
- payload excessivo;
- acesso sem autenticação;
- tentativa de alterar recursos de outro usuário.

 Especialmente:

```
Nunca confiar no preço enviado pelo cliente.
Nunca confiar no cartId enviado pelo cliente para determinar propriedade.
```

 A identidade do cliente deve vir do contexto autenticado.

---

 # 36\. Testes unitários

 Criar testes para:

```
criação de carrinho
adição de item
item duplicado
quantidade positiva
quantidade zero
quantidade negativa
quantidade decimal
quantidade máxima
variante inexistente
variante indisponível
cálculo de subtotal
cálculo de subtotal com múltiplos itens
remoção
atualização
carrinho vazio
totalItems
arredondamento
invariantes
```

---

 # 37\. Testes de integração

 Validar:

```
Cart
 ↓
CartItem
 ↓
ProductVariant
 ↓
Pricing
 ↓
Availability/Inventory
```

 Cenários mínimos:

 ### INT-01

 Criar carrinho → adicionar variante → consultar carrinho.

 ### INT-02

 Adicionar mesma variante duas vezes → validar regra de consolidação.

 ### INT-03

 Alterar quantidade → validar subtotal.

 ### INT-04

 Remover item → validar subtotal e quantidade total.

 ### INT-05

 Tentar adicionar variante indisponível → operação rejeitada.

 ### INT-06

 Alterar item de outro cliente → operação rejeitada.

---

 # 38\. Testes de API

 Validar:

 - status HTTP;
- payload;
- schema;
- mensagens de erro;
- autenticação;
- autorização;
- idempotência onde aplicável;
- consistência da resposta;
- valores monetários;
- paginação se existir;
- tratamento de IDs inválidos.

---

 # 39\. Testes de cálculo

 Usar uma matriz explícita.

 | Preço | Quantidade | Subtotal esperado |
| --- | --- | --- |
| 10,00 | 1 | 10,00 |
| 10,00 | 2 | 20,00 |
| 19,90 | 3 | 59,70 |
| 79,90 | 2 | 159,80 |
| 0,01 | 1 | 0,01 |

Adicionar casos relevantes de arredondamento conforme a política monetária aprovada.

---

 # 40\. Testes de invariantes

 Para cada operação:

```
POST /cart/items
PATCH /cart/items/{id}
DELETE /cart/items/{id}
```

 verificar:

```
cart.subtotal
=
Σ item.subtotal
```

 e:

```
cart.totalItems
=
Σ item.quantity
```

---

 # 41\. Testes de concorrência

 Executar cenários de:

```
duas adições simultâneas
duas atualizações simultâneas
adição + remoção simultâneas
duas alterações de quantidade
```

 Validar que não existe:

 - lost update indevido;
- item duplicado indevido;
- subtotal inconsistente;
- quantidade total inconsistente;
- estado parcialmente persistido.

---

 # 42\. Testes de autorização

 Mínimo:

```
AUTH-01
Cliente acessa próprio carrinho → PASS

AUTH-02
Cliente acessa cartId de outro cliente → DENY

AUTH-03
Cliente altera item de outro cliente → DENY

AUTH-04
Cliente remove item de outro cliente → DENY

AUTH-05
Usuário sem autenticação acessa carrinho → DENY
```

---

 # 43\. Testes de segurança de preço

 Executar:

```
Preço real = 100,00
Cliente envia unitPrice = 1,00
```

 Resultado:

```
unitPrice utilizado pelo servidor = 100,00
```

 Nunca:

```
1,00
```

 Também testar:

```
subtotal enviado = 0
subtotal enviado = -100
unitPrice enviado = 0
unitPrice enviado = 0.01
```

 O cálculo do servidor permanece soberano.

---

 # 44\. Testes de regressão da PHASE-02

 Executar os testes relevantes de:

 - catálogo;
- variantes;
- preços;
- disponibilidade;
- busca;
- estoque;
- movimentações.

 A TASK-011 não pode quebrar contratos da PHASE-02.

---

 # 45\. Observabilidade

 Registrar eventos relevantes do carrinho conforme a estratégia de observabilidade existente.

 Exemplos:

```
cart.created
cart.item.added
cart.item.updated
cart.item.removed
cart.calculation.failed
```

 Os nomes concretos devem seguir o padrão do projeto.

 Não registrar:

 - tokens;
- senhas;
- dados sensíveis;
- payloads completos desnecessários.

---

 # 46\. Auditoria

 A TASK-011 não deve criar uma nova estratégia de auditoria.

 Se o projeto já possuir infraestrutura de auditoria, utilizar apenas quando o requisito aprovado exigir.

 Não transformar toda operação de carrinho em log de auditoria administrativo sem necessidade.

---

 # 47\. Performance

 Evitar:

```
N+1 para itens
N+1 para preços
N+1 para disponibilidade
```

 A consulta do carrinho deve ser eficiente para o volume esperado.

 Não realizar otimização prematura fora do escopo.

---

 # 48\. Idempotência

 A semântica das operações deve ser definida explicitamente.

 Especialmente:

```
DELETE item
```

 e atualizações repetidas.

 Se a API utilizar `idempotency-key`, seguir o padrão já aprovado.

 Não introduzir infraestrutura de idempotência complexa apenas para esta TASK sem necessidade.

---

 # 49\. Dados de teste

 Criar massa suficiente para:

```
1 cliente
1 carrinho
3+ variantes
preços distintos
estoque suficiente
estoque insuficiente
produto/variante indisponível
```

 Também criar:

```
Cliente A + Carrinho A
Cliente B + Carrinho B
```

 para testes de isolamento.

---

 # 50\. Migrações

 Se novas tabelas/colunas forem necessárias:

 - migration reproduzível;
- constraints adequadas;
- índices necessários;
- integridade referencial;
- nomenclatura conforme projeto;
- sem alteração destrutiva não aprovada.

 Estrutura conceitual esperada:

```
cart
  ↓
cart_item
  ↓
product_variant
```

---

 # 51. Rastreabilidade

 | Requisito | Evidência esperada |
| --- | --- |
| RF-015 | Criação/gestão do carrinho |
| RF-016 | Itens e quantidades |
| RF-017 | Cálculo comercial |
| RN-008 | Regras de carrinho |
| RN-009 | Regras de cálculo |
| UC-004 | Fluxo de carrinho |

Cada requisito deve possuir evidência em:

 - código;
- teste;
- contrato;
- documentação;
- ou combinação aplicável.

---

 # 52\. ALLOWED\_CHANGES

 Permitido:

```
módulo cart
módulo pricing estritamente necessário ao cálculo
persistência de cart/cart_item
migrations relacionadas
APIs do carrinho
DTOs/contracts
validações
testes unitários
testes de integração
testes de API
testes de segurança
configuração necessária
documentação
TASKS.md
relatório de execução
correções diretamente necessárias em módulos da PHASE-02
```

 Qualquer alteração fora desse conjunto exige avaliação de Scope Guard.

---

 # 53. FORBIDDEN\_CHANGES

 Não realizar:

```
gateway de pagamento
captura de pagamento
webhook de pagamento
checkout completo
Order
Shipment
frete
cupons
promoções
descontos promocionais
política de reembolso
política de cancelamento
reserva definitiva de estoque
baixa definitiva de estoque
wishlist
avaliações
recomendação
alteração de RBAC não relacionada
mudança de arquitetura não aprovada
mudança de requisito
funcionalidade comercial não especificada
```

---

 # 54\. Scope Guard

 Antes de qualquer alteração incidental, responder:

```
A mudança é necessária para o carrinho?
A mudança está diretamente relacionada a RF-015–017?
A mudança está diretamente relacionada a RN-008–009?
A mudança é necessária para um teste ou Quality Gate?
A mudança está em ALLOWED_CHANGES?
A mudança evita introduzir funcionalidade futura?
```

 Se não houver resposta positiva suficiente, registrar e não implementar.

---

 # 55\. Quality Gates

```
[ ] Build
[ ] Lint
[ ] Unit tests
[ ] Integration tests
[ ] API/contract tests
[ ] Authorization tests
[ ] Security tests
[ ] Calculation tests
[ ] Monetary precision tests
[ ] Cart invariant tests
[ ] Concurrency tests
[ ] Transaction/atomicity tests
[ ] Regression tests PHASE-02
[ ] Database/migration tests
[ ] Observability validation
[ ] Traceability validation
[ ] Scope Guard
```

---

 # 56\. Critérios de aceitação

 ### AC-01 — Criação

 Cliente autenticado consegue obter/criar seu carrinho.

 ### AC-02 — Isolamento

 Cliente não consegue acessar carrinho de outro cliente.

 ### AC-03 — Adição

 Cliente consegue adicionar variante válida com quantidade válida.

 ### AC-04 — Validação

 Quantidade inválida é rejeitada.

 ### AC-05 — Disponibilidade

 Item que não pode ser vendido conforme a regra aprovada é rejeitado.

 ### AC-06 — Duplicidade

 Adicionar a mesma variante novamente segue a regra aprovada de consolidação.

 ### AC-07 — Atualização

 Quantidade pode ser alterada respeitando as regras.

 ### AC-08 — Remoção

 Item pode ser removido sem gerar efeitos indevidos no estoque.

 ### AC-09 — Subtotal

 Subtotal do item é calculado corretamente.

 ### AC-10 — Total

 Subtotal do carrinho é a soma dos subtotais dos itens.

 ### AC-11 — Quantidade total

 `totalItems` corresponde à soma das quantidades.

 ### AC-12 — Preço

 Preço utilizado no cálculo não pode ser manipulado pelo cliente.

 ### AC-13 — Atomicidade

 Falhas durante alterações não deixam o carrinho parcialmente atualizado.

 ### AC-14 — Concorrência

 Operações concorrentes não produzem estado inconsistente.

 ### AC-15 — Regressão

 PHASE-02 continua funcionando.

 ### AC-16 — Qualidade

 Build, lint e testes aplicáveis passam.

 ### AC-17 — Rastreabilidade

 RF/RN/UC relacionados possuem evidências.

 ### AC-18 — Escopo

 Nenhuma funcionalidade de checkout/pagamento/pedido foi antecipada.

---

 # 57\. Definition of Done específica

 A `TASK-011` somente poderá ser marcada como `DONE` quando:

 - [ ] carrinho implementado;
- [ ] itens implementados;
- [ ] adição implementada;
- [ ] atualização implementada;
- [ ] remoção implementada;
- [ ] cálculo de subtotal implementado;
- [ ] quantidade total implementada;
- [ ] validações implementadas;
- [ ] isolamento por cliente validado;
- [ ] preço não é controlável pelo cliente;
- [ ] disponibilidade é validada conforme regra aprovada;
- [ ] invariantes implementados/testados;
- [ ] operações relevantes são transacionais;
- [ ] concorrência aplicável foi testada;
- [ ] persistência validada;
- [ ] migrations validadas;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes de autorização passam;
- [ ] testes de segurança passam;
- [ ] testes monetários passam;
- [ ] regressão da PHASE-02 passa;
- [ ] build passa;
- [ ] lint passa;
- [ ] documentação atualizada;
- [ ] rastreabilidade atualizada;
- [ ] `ALLOWED_CHANGES` respeitado;
- [ ] `FORBIDDEN_CHANGES` não violado;
- [ ] nenhum Scope Creep;
- [ ] `TASKS.md` atualizado;
- [ ] relatório de execução produzido;
- [ ] estado final registrado corretamente.

---

 # 58\. Condições de FAILED

 Marcar `FAILED` se houver:

```
cálculo monetário incorreto
subtotal inconsistente
quantidade inválida aceita
preço manipulável pelo cliente
acesso ao carrinho de outro cliente
item órfão
variante inválida persistida
estado parcialmente atualizado
concorrência com lost update não tratado
falha transacional crítica
regressão crítica da PHASE-02
build falhando
lint obrigatório falhando
testes obrigatórios falhando
violação de segurança
violação de FORBIDDEN_CHANGES
```

 O relatório deverá conter:

```
problema
evidência
impacto
causa conhecida
Gate afetado
correção necessária
```

---

 # 59\. Condições de CANCELLED

 `CANCELLED` somente mediante decisão explícita.

 Registrar:

```
motivo
decisão
impacto
estado dos artefatos
pendências
rastreabilidade
```

 O cancelamento não libera automaticamente a `TASK-012`.

---

 # 60\. Relatório de execução — template

```
TASK: TASK-011
TÍTULO: Carrinho e cálculo comercial
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: <DONE|FAILED|CANCELLED>

DEPENDÊNCIA:
- TASK-010: DONE

OBJETIVO:
<resumo>

IMPLEMENTADO:
- Cart
- CartItem
- Adição
- Atualização
- Remoção
- Cálculo
- Validações
- Autorização

QUALITY GATES:

Build:
- Resultado: <PASS/FAIL>
- Evidência:

Lint:
- Resultado: <PASS/FAIL>
- Evidência:

Unit:
- Resultado: <PASS/FAIL>
- Evidência:

Integration:
- Resultado: <PASS/FAIL>
- Evidência:

API/Contract:
- Resultado: <PASS/FAIL>
- Evidência:

Authorization:
- Resultado: <PASS/FAIL>
- Evidência:

Security:
- Resultado: <PASS/FAIL>
- Evidência:

Calculation:
- Resultado: <PASS/FAIL>
- Evidência:

Monetary Precision:
- Resultado: <PASS/FAIL>
- Evidência:

Invariants:
- Resultado: <PASS/FAIL>
- Evidência:

Concurrency:
- Resultado: <PASS/FAIL>
- Evidência:

Atomicity:
- Resultado: <PASS/FAIL>
- Evidência:

Regression PHASE-02:
- Resultado: <PASS/FAIL>
- Evidência:

DATABASE:
- migrations: <PASS/FAIL>
- constraints: <PASS/FAIL>
- índices: <PASS/FAIL>

INVARIANTES:
- quantity > 0: <PASS/FAIL>
- subtotal item: <PASS/FAIL>
- subtotal cart: <PASS/FAIL>
- totalItems: <PASS/FAIL>
- ownership: <PASS/FAIL>
- variant integrity: <PASS/FAIL>

SEGURANÇA:
- preço controlável pelo cliente: NÃO
- acesso cross-customer: NÃO
- autenticação bypass: NÃO

PROBLEMAS ENCONTRADOS:
- <item ou nenhum>

CORREÇÕES REALIZADAS:
- <item ou nenhuma>

PENDÊNCIAS:
- <item ou nenhuma>

RASTREABILIDADE:
- RF-015: <evidência>
- RF-016: <evidência>
- RF-017: <evidência>
- RN-008: <evidência>
- RN-009: <evidência>
- UC-004: <evidência>

SCOPE GUARD:
- ALLOWED_CHANGES: PASS
- FORBIDDEN_CHANGES: PASS
- Scope Creep: NÃO IDENTIFICADO

TASKS.md:
- atualizado: <SIM/NÃO>

CONCLUSÃO:
<resultado factual>

ESTADO FINAL:
<DONE|FAILED|CANCELLED>
```

---

 # 61\. Regra de encerramento

 Ao finalizar a `TASK-011`:

 1. executar todos os Quality Gates;
2. corrigir somente problemas diretamente necessários;
3. verificar invariantes do carrinho;
4. verificar segurança de preço;
5. verificar isolamento entre clientes;
6. verificar transações e concorrência;
7. executar regressão da PHASE-02;
8. atualizar rastreabilidade;
9. atualizar `TASKS.md`;
10. produzir o relatório de execução;
11. registrar o estado final;
12. **não iniciar automaticamente a `TASK-012`**.