# TASK-012 — Cupons e promoções

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-03 / HIGH\
 **Dependências:** `DEPENDS_ON: TASK-011`\
 **Estado de entrada esperado:** `BLOCKED` até `TASK-011 = DONE`\
 **Estado de execução permitido:** `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-018, RF-019, RN-010, UC-005

---

 ## 1\. Objetivo

 Implementar o domínio de **cupons e promoções**, permitindo validar e aplicar descontos ao cálculo comercial do carrinho conforme regras previamente aprovadas.

 A TASK deve permitir:

 - cadastrar cupons conforme autorização;
- configurar regras de promoção;
- validar cupons;
- verificar vigência;
- verificar limites de uso;
- verificar elegibilidade;
- aplicar descontos de forma determinística;
- recalcular o carrinho após aplicação/remoção de desconto;
- impedir descontos inválidos;
- preservar o preço original dos produtos;
- manter rastreabilidade do cálculo.

 A implementação deve preparar o domínio para a `TASK-013`, sem implementar checkout, pagamento ou criação de pedido.

---

 # 2\. Resultado esperado

 O fluxo esperado ao final da TASK é:

```
Carrinho
   ↓
Itens
   ↓
Preços
   ↓
Elegibilidade
   ↓
Cupom/Promoção
   ↓
Validação
   ↓
Desconto
   ↓
Subtotal
   ↓
Total comercial
```

 Conceitualmente:

```
subtotal = Σ preço_item × quantidade

desconto = regra_promocional(subtotal, itens, cliente, cupom)

total = subtotal - desconto
```

 O cálculo deve ser:

 - determinístico;
- auditável;
- reproduzível;
- seguro;
- independente de dados enviados pelo cliente.

---

 # 3\. Pré-condições / Definition of Ready

 A `TASK-012` somente poderá entrar em `READY` quando:

 - `TASK-011 = DONE`;
- carrinho estiver funcional;
- cálculo de subtotal estiver funcional;
- preços estiverem disponíveis;
- variantes estiverem disponíveis;
- regras de disponibilidade estiverem disponíveis;
- estratégia monetária estiver definida;
- requisitos de promoção estiverem suficientemente especificados;
- limites de uso necessários estiverem definidos;
- autorização administrativa necessária estiver disponível;
- rastreabilidade estiver atualizada;
- build estiver passando;
- lint estiver passando;
- testes aplicáveis estiverem passando;
- Scope Guard estiver validado.

 Se a regra comercial de algum desconto não estiver definida, não inventar comportamento.

 A TASK deverá permanecer `BLOCKED` até a decisão correspondente ser registrada.

---

 # 4\. Escopo funcional

 A TASK deverá contemplar:

 ### Cupons

 - criação;
- identificação;
- código;
- status;
- vigência;
- regras de utilização;
- limites;
- elegibilidade;
- aplicação;
- remoção;
- validação.

 ### Promoções

 - definição de promoção;
- período de validade;
- condição de elegibilidade;
- regra de desconto;
- produtos/categorias aplicáveis quando especificado;
- prioridade/aplicabilidade quando houver mais de uma promoção.

 ### Cálculo

 - subtotal;
- desconto;
- total após desconto;
- composição do desconto;
- arredondamento;
- limites de desconto.

 ### Administração

 - criação;
- edição;
- ativação/desativação;
- consulta;
- eventual encerramento conforme regras aprovadas.

---

 # 5\. Fora do escopo

 Não implementar:

```
checkout
Order
OrderItem
Payment
PaymentIntent
gateway
webhook
captura de pagamento
reembolso
cancelamento de pedido
frete
Shipment
rastreamento
integração com transportadoras
reserva definitiva de estoque
baixa definitiva de estoque
programa de fidelidade
cashback
sistema de pontos
recomendação algorítmica
marketing automation
campanhas externas
```

 Também não alterar o preço base do catálogo.

---

 # 6\. Princípios fundamentais

 ## 6.1 Preço de catálogo permanece íntegro

 Promoção não deve sobrescrever permanentemente:

```
ProductVariant.price
```

 O preço original permanece identificável.

 O desconto é aplicado como componente do cálculo comercial.

---

 ## 6.2 Desconto é cálculo

 A promoção deve produzir um valor de desconto:

```
discountAmount
```

 sem alterar permanentemente o preço de catálogo.

 Exemplo:

```
preço = 100,00
desconto = 10,00

total = 90,00
```

 e não:

```
preço do produto = 90,00
```

---

 # 7\. Modelo conceitual

 A implementação deve possuir conceitos equivalentes a:

```
Coupon
Promotion
PromotionRule
CouponRedemption
DiscountCalculation
```

 Os nomes concretos podem seguir o padrão arquitetural existente.

---

 # 8\. Coupon

 Modelo conceitual:

```
Coupon
 ├── id
 ├── code
 ├── promotionId
 ├── status
 ├── startsAt
 ├── expiresAt
 ├── usageLimit
 ├── usageLimitPerCustomer
 ├── createdAt
 └── updatedAt
```

 Nem todos os campos precisam existir se não forem necessários.

 Não adicionar campos comerciais especulativos.

---

 # 9\. Promotion

 Modelo conceitual:

```
Promotion
 ├── id
 ├── name
 ├── type
 ├── value
 ├── startsAt
 ├── expiresAt
 ├── status
 ├── priority
 └── rules
```

 O `type` deve utilizar apenas tipos aprovados.

 Exemplos possíveis:

```
PERCENTAGE
FIXED_AMOUNT
```

 Não implementar tipos adicionais sem requisito.

---

 # 10\. Código do cupom

 O código deve possuir comportamento determinístico.

 Exemplo:

```
TROPA10
```

 A política de normalização deve ser definida.

 Se a regra for case-insensitive:

```
tropa10
TROPA10
Tropa10
```

 devem representar o mesmo cupom.

 Se a regra for case-sensitive, preservar exatamente a política aprovada.

 Não assumir comportamento comercial não documentado.

---

 # 11\. Unicidade

 O código do cupom deve possuir unicidade conforme o domínio.

 Não permitir:

```
TROPA10
TROPA10
```

 como dois cupons ativos indistinguíveis.

 A unicidade deve ser protegida:

 - no domínio;
- na aplicação;
- e, quando aplicável, por constraint de banco.

---

 # 12\. Status

 Utilizar somente estados aprovados.

 Exemplo conceitual:

```
DRAFT
ACTIVE
INACTIVE
EXPIRED
```

 Se o projeto não possuir essa taxonomia, seguir o padrão existente.

 Não criar estados apenas para facilitar implementação.

---

 # 13\. Vigência

 Um cupom somente poderá ser aplicado quando estiver dentro da janela de validade.

 Conceitualmente:

```
startsAt <= now
AND
(expiresAt IS NULL OR now < expiresAt)
```

 O limite exato de inclusão/exclusão deve seguir a regra aprovada.

 Casos de borda devem possuir testes.

---

 # 14\. Cupom expirado

 Cupom expirado deve ser rejeitado.

 Exemplo:

```
expiresAt = 2026-01-01T00:00:00
now       = 2026-01-01T00:00:01
```

 Resultado:

```
INVALID / EXPIRED
```

 Não aplicar desconto.

---

 # 15\. Cupom ainda não iniciado

 Se:

```
now < startsAt
```

 o cupom não pode ser aplicado.

 Retornar erro de domínio apropriado.

---

 # 16\. Cupom inativo

 Cupom desativado não pode ser utilizado, mesmo que:

 - esteja dentro da vigência;
- ainda possua usos disponíveis;
- tenha promoção válida.

 Status operacional deve prevalecer.

---

 # 17\. Limite global de uso

 Quando existir:

```
usageLimit = 100
```

 não permitir aplicação além do limite definido.

 Conceitualmente:

```
redemptions < usageLimit
```

 deve ser verdadeiro para uma nova utilização.

---

 # 18\. Limite por cliente

 Quando houver:

```
usageLimitPerCustomer = 1
```

 um mesmo cliente não poderá utilizar o cupom novamente depois de atingir o limite.

 Exemplo:

```
Cliente A → TROPA10 → uso 1 → permitido
Cliente A → TROPA10 → uso 2 → rejeitado

Cliente B → TROPA10 → uso 1 → permitido
```

 A identidade do cliente deve vir do contexto autenticado.

---

 # 19\. Concorrência no uso do cupom

 O limite de uso não pode ser protegido somente por:

```
SELECT count(...)
IF count < limit
INSERT redemption
```

 sem controle transacional.

 Cenário:

```
limite = 1

Request A → verifica 0
Request B → verifica 0

A → utiliza
B → utiliza
```

 Isso não pode resultar em duas utilizações quando apenas uma era permitida.

 Utilizar estratégia transacional adequada.

---

 # 20\. Elegibilidade

 A promoção pode possuir regras de elegibilidade.

 Exemplos possíveis:

```
produto específico
categoria específica
marca específica
valor mínimo do carrinho
quantidade mínima
cliente específico
```

 Somente implementar regras efetivamente previstas.

 Não inventar segmentação comercial.

---

 # 21\. Valor mínimo do carrinho

 Caso aprovado:

```
minimumCartAmount = 200,00
```

 e:

```
subtotal = 150,00
```

 o cupom deve ser rejeitado.

 Para:

```
subtotal = 200,00
```

 deve seguir a regra de inclusão definida.

 Casos de borda devem ser testados.

---

 # 22\. Promoção percentual

 Exemplo:

```
subtotal = 200,00
discount = 10%
```

 Resultado:

```
desconto = 20,00
total = 180,00
```

 O cálculo deve utilizar a política monetária aprovada.

---

 # 23\. Promoção de valor fixo

 Exemplo:

```
subtotal = 200,00
discount = 30,00
```

 Resultado:

```
total = 170,00
```

 Nunca permitir:

```
total < 0
```

 salvo regra explicitamente aprovada para créditos/saldos, o que não faz parte desta TASK.

---

 # 24\. Desconto maior que o subtotal

 Se:

```
subtotal = 50,00
desconto = 70,00
```

 o comportamento deve ser definido.

 Na ausência de regra específica, a implementação deve impedir total negativo:

```
discountApplied <= subtotal
```

 e:

```
total >= 0
```

 Qualquer comportamento diferente exige decisão comercial explícita.

---

 # 25\. Aplicação do desconto

 O desconto deve ser calculado no servidor.

 O cliente pode informar:

```
couponCode
```

 mas não deve controlar:

```
discountAmount
percentage
promotionValue
finalTotal
```

 Exemplo proibido:

```
{
  "couponCode": "TROPA10",
  "discountAmount": 9999.99
}
```

---

 # 26\. Total comercial

 O cálculo deve ser equivalente a:

```
subtotal
- discount
= total
```

 Exemplo:

```
subtotal = 300,00
desconto = 30,00

total = 270,00
```

 O valor final deve ser derivado no backend.

---

 # 27\. Múltiplas promoções

 A regra de combinação deve ser explícita.

 Possibilidades:

```
somente uma promoção
promoções acumuláveis
promoções não acumuláveis
maior desconto
prioridade explícita
```

 Não assumir automaticamente que descontos são cumulativos.

 Se o requisito não definir composição, registrar bloqueio.

---

 # 28\. Cupom + promoção automática

 Caso exista:

```
PROMOÇÃO AUTOMÁTICA
+
CUPOM
```

 a regra de composição deve ser explicitamente definida.

 Não aplicar automaticamente:

```
10% promoção
+
10% cupom
=
20%
```

 sem regra aprovada.

---

 # 29\. Ordem de aplicação

 Se houver múltiplos descontos aprovados, a ordem deverá ser determinística.

 Exemplo conceitual:

```
preço base
    ↓
promoção automática
    ↓
cupom
    ↓
total
```

 ou:

```
preço base
    ↓
cupom
    ↓
promoção
    ↓
total
```

 A ordem deve ser registrada quando impactar o resultado.

---

 # 30\. Arredondamento

 Utilizar a mesma estratégia monetária da `TASK-011`.

 Não introduzir uma segunda regra de arredondamento.

 Exemplo:

```
preço = 99,99
desconto = 15%
```

 O resultado deve seguir exatamente a política monetária do projeto.

 Criar testes específicos para frações.

---

 # 31\. Persistência do desconto

 Não persistir apenas:

```
finalTotal
```

 sem preservar informação suficiente para reconstruir o cálculo quando necessário.

 Quando o domínio exigir persistência do resultado, considerar:

```
subtotal
discountAmount
promotion/coupon reference
total
```

 A estratégia definitiva deve respeitar o modelo aprovado para pedidos futuros.

---

 # 32\. Carrinho e promoção

 A integração com `TASK-011` deve manter:

```
Cart
 ├── items
 ├── subtotal
 ├── discount
 └── total
```

 sem corromper os dados originais dos itens.

 O preço unitário original permanece identificável.

---

 # 33\. Recalculo

 Quando ocorrer:

```
adicionar item
remover item
alterar quantidade
aplicar cupom
remover cupom
```

 o desconto deve ser reavaliado quando aplicável.

 Exemplo:

```
Cupom exige subtotal >= 200

subtotal atual = 220
→ válido

cliente remove item de 50

subtotal = 170
→ cupom deixa de ser elegível
```

 O sistema não deve manter desconto inválido silenciosamente.

---

 # 34\. Alteração de carrinho

 O desconto não pode ser considerado permanentemente válido após uma alteração relevante do carrinho.

 Qualquer mudança que impacte elegibilidade deve provocar nova avaliação.

---

 # 35\. Remoção do cupom

 Deve existir operação equivalente a:

```
remover cupom
```

 A remoção deve:

 - validar propriedade do carrinho;
- remover associação;
- recalcular desconto;
- recalcular total;
- persistir atomicamente.

---

 # 36\. Aplicação do cupom

 Operação conceitual:

```
POST /cart/coupon
```

 Payload:

```
{
  "code": "TROPA10"
}
```

 A resposta deve apresentar o estado comercial atualizado.

---

 # 37\. Validação do cupom

 Fluxo:

```
autenticação
   ↓
carregar carrinho
   ↓
carregar cupom
   ↓
validar status
   ↓
validar vigência
   ↓
validar limite
   ↓
validar cliente
   ↓
validar elegibilidade
   ↓
calcular desconto
   ↓
persistir
```

---

 # 38\. Erros de domínio

 Diferenciar, quando o padrão da API permitir:

```
COUPON_NOT_FOUND
COUPON_INACTIVE
COUPON_NOT_STARTED
COUPON_EXPIRED
COUPON_USAGE_LIMIT_REACHED
COUPON_CUSTOMER_LIMIT_REACHED
COUPON_NOT_ELIGIBLE
COUPON_MINIMUM_AMOUNT_NOT_MET
COUPON_NOT_APPLICABLE
INVALID_COUPON
```

 Não expor informações sensíveis desnecessárias.

---

 # 39\. Segurança

 Validar:

 - autenticação;
- autorização;
- manipulação de `cartId`;
- manipulação de `couponId`;
- brute force de códigos;
- preço enviado pelo cliente;
- desconto enviado pelo cliente;
- total enviado pelo cliente;
- uso indevido de cupom;
- acesso a cupons administrativos.

---

 # 40\. Brute force de cupons

 Se o contrato permitir tentativa de códigos, avaliar proteção contra enumeração excessiva.

 Não implementar mecanismo complexo fora do padrão existente.

 No mínimo:

 - validação consistente;
- rate limiting se já houver infraestrutura;
- respostas que não revelem informações desnecessárias;
- logs sem dados sensíveis.

---

 # 41\. Administração

 Operações administrativas devem exigir autorização adequada.

 Mínimo:

```
criar cupom
editar cupom
ativar/desativar
consultar uso
configurar promoção
```

 Não alterar RBAC para viabilizar a TASK.

---

 # 42\. Auditoria administrativa

 Operações administrativas relevantes devem utilizar a infraestrutura de auditoria existente.

 Registrar, quando aplicável:

```
quem
o quê
quando
qual recurso
resultado
```

 Não registrar segredos ou credenciais.

---

 # 43\. Auditoria de utilização

 Se o domínio exigir rastreabilidade de utilização:

```
CouponRedemption
```

 deve permitir determinar:

```
coupon
customer
cart/order context
timestamp
```

 sem criar antecipadamente dependência desnecessária de `Order`.

---

 # 44\. Relação com pedidos

 A TASK-012 não deve criar o fluxo definitivo de pedido.

 Se a utilização do cupom precisar posteriormente ser vinculada a um pedido, criar somente a abstração necessária e deixar a integração definitiva para a `TASK-013`/fluxo de pedido.

 Não criar `Order` nesta TASK.

---

 # 45\. Consistência de uso

 É necessário distinguir:

```
cupom validado
```

 de:

```
cupom efetivamente consumido
```

 A aplicação ao carrinho não deve necessariamente significar consumo definitivo, caso a regra comercial determine consumo somente no checkout/pedido.

 Essa decisão deve ser explícita.

 Se o consumo ocorrer somente na confirmação da compra, a TASK-012 deve registrar a intenção/aplicação sem contabilizar indevidamente o uso definitivo.

---

 # 46\. Reserva de cupom

 Não implementar reserva de cupom no carrinho sem requisito.

 Evitar:

```
aplicou no carrinho
→ decrementa imediatamente usageLimit
```

 se isso puder bloquear usuários sem compra.

 O comportamento de consumo definitivo deve estar alinhado com o fluxo aprovado para `TASK-013`.

---

 # 47\. Idempotência

 Repetir:

```
aplicar TROPA10
```

 ao mesmo carrinho não deve produzir:

```
10% + 10%
```

 O resultado deve permanecer determinístico.

 Exemplo:

```
primeira aplicação → desconto 20
segunda aplicação → desconto 20
```

 e não:

```
desconto 40
```

---

 # 48\. Reprocessamento

 Se o mesmo carrinho for recalculado várias vezes:

```
calculate(cart)
calculate(cart)
calculate(cart)
```

 o resultado deverá ser equivalente.

 Não acumular descontos a cada cálculo.

---

 # 49\. Invariantes

 ## INV-01 — Total não negativo

```
total >= 0
```

 ## INV-02 — Desconto não negativo

```
discountAmount >= 0
```

 ## INV-03 — Desconto não excede o subtotal

 Quando essa for a regra aprovada:

```
discountAmount <= subtotal
```

 ## INV-04 — Cálculo

```
total = subtotal - discountAmount
```

 ## INV-05 — Cupom válido

 Cupom aplicado deve satisfazer todas as regras de elegibilidade.

 ## INV-06 — Vigência

 Cupom aplicado deve estar dentro da janela válida.

 ## INV-07 — Limite

 Uso definitivo não pode ultrapassar o limite aprovado.

 ## INV-08 — Isolamento

 Cliente não pode aplicar cupom modificando carrinho de outro cliente.

 ## INV-09 — Determinismo

 Mesmos dados → mesmo resultado.

 ## INV-10 — Não acumulação indevida

 Recalcular não acumula descontos previamente calculados.

---

 # 50\. Testes unitários

 Criar testes para:

```
cupom válido
cupom inexistente
cupom inativo
cupom futuro
cupom expirado
limite global
limite por cliente
valor mínimo
percentual
valor fixo
desconto maior que subtotal
subtotal zero
arredondamento
cupom duplicado
cupom já aplicado
remoção do cupom
recalculo
promoção não elegível
```

---

 # 51\. Testes de cálculo

 Matriz mínima:

 | Subtotal | Regra | Desconto | Total |
| --- | --- | --- | --- |
| 100,00 | 10% | 10,00 | 90,00 |
| 200,00 | 10% | 20,00 | 180,00 |
| 100,00 | 25,00 fixo | 25,00 | 75,00 |
| 50,00 | 75,00 fixo | conforme regra | conforme regra |
| 0,00 | 10% | 0,00 | 0,00 |

Adicionar casos de arredondamento.

---

 # 52\. Testes de elegibilidade

 ### PROMO-01

 Subtotal abaixo do mínimo:

```
minimum = 200
subtotal = 199,99
```

 Resultado:

```
rejeitado
```

 ### PROMO-02

 Subtotal no mínimo:

```
minimum = 200
subtotal = 200
```

 Resultado:

```
conforme regra aprovada
```

 ### PROMO-03

 Produto elegível.

 ### PROMO-04

 Produto não elegível.

 ### PROMO-05

 Categoria elegível.

 ### PROMO-06

 Categoria não elegível.

---

 # 53\. Testes de limite

 ### LIMIT-01

```
usageLimit = 1
usage = 0
```

 → permitido.

 ### LIMIT-02

```
usageLimit = 1
usage = 1
```

 → rejeitado.

 ### LIMIT-03

 Dois clientes concorrentes para o último uso.

 Resultado:

```
somente o número permitido de utilizações é efetivado
```

---

 # 54\. Testes de idempotência

 Aplicar o mesmo cupom repetidamente:

```
1ª → desconto X
2ª → desconto X
3ª → desconto X
```

 Nunca:

```
X
2X
3X
```

---

 # 55\. Testes de recalculo

 Cenário:

```
subtotal = 250
cupom = 10%
```

 Resultado:

```
desconto = 25
total = 225
```

 Depois remover item:

```
subtotal = 150
```

 Se mínimo for 200:

```
cupom → inválido
desconto → 0
```

 O carrinho deve refletir o novo estado.

---

 # 56\. Testes de autorização

 Mínimo:

```
Cliente A → próprio carrinho → permitido

Cliente A → carrinho B → negado

Cliente A → aplicar cupom no carrinho B → negado

Cliente A → remover cupom do carrinho B → negado

Usuário não autenticado → aplicar cupom → negado

Usuário não autorizado → criar/editar cupom → negado
```

---

 # 57\. Testes de segurança

 Testar manipulação de:

```
discountAmount
percentage
promotionId
couponId
cartId
customerId
total
subtotal
```

 O servidor deve determinar os valores confiáveis.

---

 # 58\. Testes de concorrência

 Validar:

```
duas aplicações simultâneas
duas remoções simultâneas
aplicação + alteração de quantidade
aplicação + remoção de item
último uso disponível
```

 Especial atenção para:

```
usageLimit
usageLimitPerCustomer
```

---

 # 59\. Testes de regressão

 Executar:

 - testes de catálogo;
- variantes;
- preços;
- disponibilidade;
- estoque;
- busca;
- carrinho;
- cálculo comercial da `TASK-011`.

 A `TASK-012` não pode alterar o comportamento do carrinho quando nenhum desconto estiver aplicado.

---

 # 60\. Comportamento sem cupom

 Quando não houver desconto:

```
discount = 0
total = subtotal
```

 A introdução da TASK-012 não pode modificar o resultado do carrinho para clientes que não utilizam promoção.

---

 # 61\. API / contratos

 Os contratos concretos devem respeitar o padrão existente.

 Operações conceituais:

```
POST   /cart/coupon
DELETE /cart/coupon
```

 Administração:

```
POST   /admin/coupons
PATCH  /admin/coupons/{couponId}
GET    /admin/coupons
```

 Os caminhos reais devem seguir as convenções do projeto.

---

 # 62\. Contrato de aplicação

 Entrada conceitual:

```
{
  "code": "TROPA10"
}
```

 O backend resolve:

```
coupon
promotion
eligibility
discount
total
```

 O cliente não controla os valores calculados.

---

 # 63\. Contrato de resposta

 Exemplo conceitual:

```
{
  "subtotal": 200.00,
  "discount": {
    "couponCode": "TROPA10",
    "amount": 20.00
  },
  "total": 180.00
}
```

 Os nomes concretos devem seguir o contrato existente.

---

 # 64\. Observabilidade

 Registrar eventos relevantes conforme o padrão existente.

 Exemplos:

```
coupon.created
coupon.updated
coupon.applied
coupon.removed
coupon.rejected
promotion.applied
promotion.rejected
discount.calculation.failed
```

 Não registrar:

 - tokens;
- senhas;
- credenciais;
- informações sensíveis desnecessárias.

---

 # 65\. Métricas

 Se a infraestrutura já suportar métricas, considerar:

```
coupon_application_total
coupon_application_success_total
coupon_application_rejected_total
discount_calculation_failure_total
```

 Não criar infraestrutura de métricas paralela.

---

 # 66\. Performance

 Evitar:

```
N+1 de regras
N+1 de produtos
N+1 de categorias
N+1 de cupons
```

 A avaliação de uma promoção deve ser eficiente para o volume esperado.

 Não realizar otimizações fora do escopo.

---

 # 67\. Cache

 Não introduzir cache de regras promocionais sem necessidade.

 Se já houver cache:

 - respeitar invalidação;
- não permitir cupom expirado permanecer aplicável;
- não permitir promoção desativada continuar válida.

 Consistência comercial possui prioridade sobre otimização.

---

 # 68\. Persistência

 Garantir:

 - código único;
- relacionamento consistente;
- vigência;
- status;
- limites;
- regras;
- integridade referencial;
- índices necessários.

 Se existir `CouponRedemption`, garantir consistência transacional.

---

 # 69\. Migrações

 Novas migrations devem ser:

 - reproduzíveis;
- versionadas;
- reversíveis quando o padrão do projeto exigir;
- sem perda de dados;
- com constraints adequadas.

 Não modificar tabelas de pagamento ou pedido.

---

 # 70. Dados de teste

 Criar massa para:

```
CUPOM10
CUPOMFIXO
CUPOMEXPIRADO
CUPOMFUTURO
CUPOMINATIVO
CUPOMLIMITADO
CUPOMCLIENTE
PROMOCAO10
PROMOCAO_FIXA
PROMOCAO_MINIMO
PROMOCAO_PRODUTO
```

 Somente criar os tipos efetivamente suportados.

---

 # 71\. Rastreabilidade

 | Requisito | Evidência esperada |
| --- | --- |
| RF-018 | Cupons e validação |
| RF-019 | Promoções e aplicação de desconto |
| RN-010 | Regras de desconto |
| UC-005 | Aplicação de cupom/promoção |

Cada item deve possuir evidência em:

 - código;
- testes;
- contrato;
- documentação;
- ou combinação aplicável.

---

 # 72\. ALLOWED\_CHANGES

 Permitido:

```
módulo promotions
módulo coupons
módulo pricing estritamente necessário
integração com cart
persistência
migrations
APIs
DTOs
contratos
validações
regras de desconto
testes unitários
testes de integração
testes de API
testes de segurança
testes de concorrência
auditoria necessária
observabilidade necessária
documentação
TASKS.md
relatório de execução
correções diretamente necessárias na TASK-011
```

---

 # 73\. FORBIDDEN\_CHANGES

 Não realizar:

```
checkout
Order
Payment
gateway
webhook
frete
Shipment
reembolso
cancelamento
reserva definitiva de estoque
baixa definitiva de estoque
alteração do preço base do catálogo
alteração unilateral de RBAC
novo programa de fidelidade
cashback
pontos
recomendação
marketing automation
mudança arquitetural não aprovada
mudança de requisito
funcionalidade comercial não especificada
```

---

 # 74\. Scope Guard

 Antes de cada alteração incidental:

```
A mudança é diretamente necessária para cupons/promoções?
A mudança é necessária para o cálculo do desconto?
A mudança é necessária para integração com o carrinho?
A mudança está relacionada a RF-018/RF-019/RN-010/UC-005?
A mudança está em ALLOWED_CHANGES?
A mudança evita antecipar checkout/pagamento?
```

 Se não:

```
NÃO IMPLEMENTAR
```

 e registrar como pendência/bloqueio quando necessário.

---

 # 75\. Quality Gates

```
[ ] Build
[ ] Lint
[ ] Unit tests
[ ] Integration tests
[ ] API/contract tests
[ ] Authorization tests
[ ] Security tests
[ ] Coupon validation tests
[ ] Promotion tests
[ ] Discount calculation tests
[ ] Monetary precision tests
[ ] Eligibility tests
[ ] Usage-limit tests
[ ] Concurrency tests
[ ] Idempotency tests
[ ] Recalculation tests
[ ] Regression TASK-011
[ ] Database/migration tests
[ ] Observability validation
[ ] Traceability validation
[ ] Scope Guard
```

---

 # 76\. Critérios de aceitação

 ### AC-01 — Criação

 Usuário autorizado consegue criar cupom conforme as regras aprovadas.

 ### AC-02 — Unicidade

 Código de cupom não pode possuir duplicidade indevida.

 ### AC-03 — Vigência

 Cupom fora da janela de validade é rejeitado.

 ### AC-04 — Status

 Cupom inativo não pode ser aplicado.

 ### AC-05 — Limite

 Limites de uso são respeitados.

 ### AC-06 — Limite por cliente

 Limite individual é respeitado.

 ### AC-07 — Elegibilidade

 Cupom só é aplicado quando todas as condições são satisfeitas.

 ### AC-08 — Desconto

 Percentual ou valor fixo é calculado corretamente conforme regra aprovada.

 ### AC-09 — Total

 O total nunca fica inconsistente com:

```
subtotal - desconto
```

 ### AC-10 — Segurança

 Cliente não consegue controlar o valor do desconto ou total.

 ### AC-11 — Recalculo

 Alterações no carrinho reavaliam a elegibilidade quando necessário.

 ### AC-12 — Idempotência

 Aplicar o mesmo cupom novamente não duplica o desconto.

 ### AC-13 — Concorrência

 Uso limitado não ultrapassa o limite aprovado em condições concorrentes.

 ### AC-14 — Isolamento

 Cliente não consegue aplicar/remover cupom no carrinho de outro cliente.

 ### AC-15 — Regressão

 Carrinho sem promoção mantém o comportamento da `TASK-011`.

 ### AC-16 — Qualidade

 Build, lint e testes aplicáveis passam.

 ### AC-17 — Rastreabilidade

 RF/RN/UC relacionados possuem evidências.

 ### AC-18 — Escopo

 Checkout, pagamento e pedido não foram antecipados.

---

 # 77\. Definition of Done específica

 A `TASK-012` somente poderá ser marcada como `DONE` quando:

 - [ ] domínio de cupom implementado;
- [ ] domínio de promoção implementado;
- [ ] validação de vigência implementada;
- [ ] validação de status implementada;
- [ ] limites de uso implementados;
- [ ] limites por cliente implementados quando aplicáveis;
- [ ] elegibilidade implementada;
- [ ] cálculo de desconto implementado;
- [ ] cálculo monetário validado;
- [ ] total comercial integrado ao carrinho;
- [ ] aplicação de cupom implementada;
- [ ] remoção de cupom implementada;
- [ ] recalculo implementado;
- [ ] idempotência validada;
- [ ] concorrência validada;
- [ ] segurança de preço/desconto validada;
- [ ] autorização validada;
- [ ] auditoria administrativa validada;
- [ ] observabilidade necessária validada;
- [ ] migrations executadas/testadas;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes de segurança passam;
- [ ] testes de cálculo passam;
- [ ] testes de concorrência passam;
- [ ] regressão da `TASK-011` passa;
- [ ] build passa;
- [ ] lint passa;
- [ ] documentação atualizada;
- [ ] rastreabilidade atualizada;
- [ ] `ALLOWED_CHANGES` respeitado;
- [ ] `FORBIDDEN_CHANGES` não violado;
- [ ] nenhum Scope Creep;
- [ ] `TASKS.md` atualizado;
- [ ] relatório de execução produzido;
- [ ] estado final registrado.

---

 # 78\. Condições de FAILED

 Marcar `FAILED` se houver:

```
desconto incorreto
total inconsistente
cupom expirado aceito
cupom inativo aceito
limite de uso ultrapassado
limite por cliente violado
desconto acumulado indevidamente
recalculo incorreto
preço controlável pelo cliente
acesso cross-customer
uso concorrente acima do limite
estado parcialmente persistido
falha transacional crítica
regressão da TASK-011
build falhando
lint obrigatório falhando
testes obrigatórios falhando
violação de segurança
violação de FORBIDDEN_CHANGES
```

 O relatório deverá registrar:

```
problema
evidência
impacto
causa conhecida
Gate afetado
correção necessária
```

---

 # 79\. Condições de CANCELLED

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

 O cancelamento não libera automaticamente a `TASK-013`.

---

 # 80\. Relatório de execução — template

```
TASK: TASK-012
TÍTULO: Cupons e promoções
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: <DONE|FAILED|CANCELLED>

DEPENDÊNCIA:
- TASK-011: DONE

OBJETIVO:
<resumo>

IMPLEMENTADO:
- Coupon
- Promotion
- Regras de elegibilidade
- Vigência
- Limites
- Aplicação
- Remoção
- Cálculo de desconto
- Recalculo do carrinho

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

Coupon Validation:
- Resultado: <PASS/FAIL>
- Evidência:

Promotion:
- Resultado: <PASS/FAIL>
- Evidência:

Discount Calculation:
- Resultado: <PASS/FAIL>
- Evidência:

Monetary Precision:
- Resultado: <PASS/FAIL>
- Evidência:

Eligibility:
- Resultado: <PASS/FAIL>
- Evidência:

Usage Limits:
- Resultado: <PASS/FAIL>
- Evidência:

Concurrency:
- Resultado: <PASS/FAIL>
- Evidência:

Idempotency:
- Resultado: <PASS/FAIL>
- Evidência:

Recalculation:
- Resultado: <PASS/FAIL>
- Evidência:

Regression TASK-011:
- Resultado: <PASS/FAIL>
- Evidência:

DATABASE:
- migrations: <PASS/FAIL>
- constraints: <PASS/FAIL>
- índices: <PASS/FAIL>

INVARIANTES:
- total >= 0: <PASS/FAIL>
- discount >= 0: <PASS/FAIL>
- discount <= subtotal: <PASS/FAIL>
- total = subtotal - discount: <PASS/FAIL>
- coupon validity: <PASS/FAIL>
- usage limits: <PASS/FAIL>
- customer isolation: <PASS/FAIL>
- deterministic calculation: <PASS/FAIL>

SEGURANÇA:
- desconto controlável pelo cliente: NÃO
- total controlável pelo cliente: NÃO
- acesso cross-customer: NÃO
- bypass de autorização: NÃO

PROBLEMAS ENCONTRADOS:
- <item ou nenhum>

CORREÇÕES REALIZADAS:
- <item ou nenhuma>

PENDÊNCIAS:
- <item ou nenhuma>

RASTREABILIDADE:
- RF-018: <evidência>
- RF-019: <evidência>
- RN-010: <evidência>
- UC-005: <evidência>

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

 # 81\. Regra de encerramento

 Ao finalizar a `TASK-012`:

 1. executar todos os Quality Gates;
2. validar cálculo monetário;
3. validar vigência;
4. validar limites;
5. validar elegibilidade;
6. validar concorrência;
7. validar idempotência;
8. executar regressão da `TASK-011`;
9. verificar que nenhum desconto é acumulado indevidamente;
10. verificar que preço base do catálogo permanece íntegro;
11. atualizar rastreabilidade;
12. atualizar `TASKS.md`;
13. produzir o relatório de execução;
14. registrar o estado final;
15. **não iniciar automaticamente a `TASK-013`**.
