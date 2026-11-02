# TASK-012 — Cupons e promoções

 **Status:** DONE\
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

 **Prontidão (2026-10-26): PASS.** TASK-011 está `DONE`; carrinho, cálculo em centavos, preços e validação comercial estão implementados; testes e Gates anteriores passaram. As regras foram aprovadas e registradas em `docs/planning/answered-questions.md`. O responsável autorizou `promotions.manage` somente para GENERAL_ADMIN. Branch `feature/TASK-012-coupons-promotions`; transições `BLOCKED → READY → IN_PROGRESS`.

 **Decisões aprovadas pelo responsável (2026-10-26):** somente desconto percentual inteiro de 1% a 100% ou valor fixo positivo; desconto aplicado sobre o carrinho inteiro, com mínimo opcional de subtotal pré-desconto e limiar inclusivo; sem segmentação por item/categoria/marca/cliente e sem desconto de frete nesta TASK. No máximo um cupom; cupons e promoções não acumulam. Entre todas as opções elegíveis, aplicar o maior desconto; em empate, promoção automática vence cupom. Limites globais e por conta são opcionais; aplicação ao carrinho não reserva/consome limite; consumo ocorre atomicamente na criação do pedido, na TASK-013. Código é trim + uppercase, apenas A–Z e dígitos; vigência UTC com início inclusivo e expiração exclusiva. Estados `DRAFT`, `ACTIVE`, `INACTIVE`; `EXPIRED` é derivado. Percentual arredonda ao centavo mais próximo, meio para cima. Se edição do carrinho invalidar cupom aplicado, manter a edição, remover o cupom e recalcular/informar total. Permissão `promotions.manage` autorizada exclusivamente para GENERAL_ADMIN.

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
- elegibilidade por subtotal mínimo inclusivo; não há segmentação por produto, categoria, marca ou cliente nesta V1;
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

 Remover espaços externos e converter para maiúsculas antes de persistir ou consultar. Aceitar somente caracteres ASCII `A–Z` e `0–9`.

 Assim, a comparação é case-insensitive:

```
tropa10
TROPA10
Tropa10
```

 devem representar o mesmo cupom.

 A unicidade é sobre o código já normalizado.

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

Utilizar somente os estados aprovados pelo responsável: `DRAFT`, `ACTIVE` e `INACTIVE`. `EXPIRED` é uma condição derivada da vigência, não um estado persistido.

Promoções automáticas também devem estar `ACTIVE` e dentro da vigência para participar do cálculo.

---

 # 13\. Vigência

 Um cupom somente poderá ser aplicado quando estiver dentro da janela de validade.

 Conceitualmente:

```
startsAt <= now
AND
(expiresAt IS NULL OR now < expiresAt)
```

 A vigência é interpretada em UTC como `startsAt <= now` e `expiresAt IS NULL OR now < expiresAt`; início é inclusivo e expiração exclusiva.

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

 Na V1, cupom e promoção aplicam-se ao carrinho inteiro. A única condição opcional de elegibilidade é subtotal mínimo, comparado com o subtotal antes de qualquer desconto. Não há alvos por produto, categoria, marca, quantidade ou cliente; os exemplos listados abaixo ficam fora do escopo atual.

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

 Quando configurado:

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

 atende ao mínimo, pois o limiar é inclusivo (`subtotal >= minimumCartAmount`).

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

 O percentual é inteiro entre 1% e 100%. O desconto percentual é arredondado ao centavo mais próximo, meio para cima, usando centavos inteiros. Promoções e cupons fixos devem ter valor positivo.

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

 O desconto fixo aplicado é limitado ao subtotal; o total nunca será negativo.

---

 # 24\. Desconto maior que o subtotal

 Se:

```
subtotal = 50,00
desconto = 70,00
```

 O comportamento aprovado é limitar o desconto ao subtotal, impedindo total negativo:

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

 Promoções elegíveis concorrentes não acumulam. Comparar os descontos calculados e aplicar somente o maior. Quando duas promoções produzirem o mesmo desconto, maior prioridade vence; empate de prioridade usa ordem determinística estável.


---

 # 28\. Cupom + promoção automática

 Caso exista:

```
PROMOÇÃO AUTOMÁTICA
+
CUPOM
```

 cupom e promoção automática podem ser elegíveis ao mesmo tempo, mas não acumulam. Comparar seus valores e aplicar somente o maior; em empate, aplicar a promoção automática.

 Não aplicar automaticamente:

```
10% promoção
+
10% cupom
=
20%
```

 A mesma regra aplica-se quando o carrinho é recalculado.

---

 # 29\. Ordem de aplicação

 Avaliar todos os descontos individualmente sobre o subtotal original e selecionar apenas o maior; não calcular desconto sobre valor já descontado. Em empate entre cupom e promoção, promoção vence. Esta seleção não altera o preço base do catálogo.


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

 Se uma edição do carrinho tornar o cupom inelegível, manter a edição, remover o cupom automaticamente, recalcular o desconto promocional e o total, e retornar o estado atualizado para que a interface informe a remoção.

---

 # 34\. Alteração de carrinho

 O desconto não pode ser considerado permanentemente válido após uma alteração relevante do carrinho.

 Qualquer mudança que impacte elegibilidade deve provocar nova avaliação. Promoções elegíveis são recalculadas; cupom inválido é removido conforme decisão aprovada.

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

 A permissão `promotions.manage` foi explicitamente autorizada pelo responsável em 2026-10-26 e deverá ser concedida somente ao papel `GENERAL_ADMIN`. Nenhuma outra permissão ou papel será alterado.

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

Registrar utilizações efetivamente consumidas na criação do pedido, de forma idempotente e transacional. Aplicar um cupom ao carrinho não registra consumo. A TASK-013 também deverá registrar a liberação quando um pedido `PENDING_PAYMENT` expirar após 30 dias sem pagamento.

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

 A abstração de consumo deverá permitir vínculo futuro com o pedido, sem criar `Order` nesta TASK. A integração que consome a utilização na criação do pedido pertence à TASK-013.

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

O consumo ocorre atomicamente na criação do pedido. Se o pedido não for pago em 30 dias corridos e passar a `EXPIRED`, o uso do cupom é liberado ao limite de forma transacional e auditável. A TASK-013 implementa essa integração com o ciclo de vida do pedido. A aplicação no carrinho apenas valida o limite e não reserva nem incrementa o uso.

---

 # 46\. Reserva de cupom

 Não implementar reserva ou consumo de cupom no carrinho.

 Evitar:

```
aplicou no carrinho
→ decrementa imediatamente usageLimit
```

O consumo é feito somente na criação do pedido, em operação atômica da TASK-013. A expiração sem pagamento também libera atomicamente o uso consumido.

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

 Não aplicável: segmentação por produto, categoria, marca ou cliente está fora do escopo aprovado. A elegibilidade promocional limita-se ao subtotal mínimo inclusivo.

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
permissão promotions.manage exclusivamente para GENERAL_ADMIN, aprovada explicitamente pelo responsável em 2026-10-26
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
[x] Build
[x] Lint
[x] Unit tests
[x] Integration tests
[x] API/contract tests
[x] Authorization tests
[x] Security tests
[x] Coupon validation tests
[x] Promotion tests
[x] Discount calculation tests
[x] Monetary precision tests
[x] Eligibility tests
[x] Usage-limit tests
[x] Concurrency tests
[x] Idempotency tests
[x] Recalculation tests
[x] Regression TASK-011
[x] Database/migration tests
[x] Observability validation
[x] Traceability validation
[x] Scope Guard
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

 - [x] domínio de cupom implementado;
- [x] domínio de promoção implementado;
- [x] validação de vigência implementada;
- [x] validação de status implementada;
- [x] limites de uso implementados;
- [x] limites por cliente implementados quando aplicáveis;
- [x] elegibilidade implementada;
- [x] cálculo de desconto implementado;
- [x] cálculo monetário validado;
- [x] total comercial integrado ao carrinho;
- [x] aplicação de cupom implementada;
- [x] remoção de cupom implementada;
- [x] recalculo implementado;
- [x] idempotência validada;
- [x] concorrência validada;
- [x] segurança de preço/desconto validada;
- [x] autorização validada;
- [x] auditoria administrativa validada;
- [x] observabilidade necessária validada;
- [x] migrations executadas/testadas;
- [x] testes unitários passam;
- [x] testes de integração passam;
- [x] testes de API passam;
- [x] testes de segurança passam;
- [x] testes de cálculo passam;
- [x] testes de concorrência passam;
- [x] regressão da `TASK-011` passa;
- [x] build passa;
- [x] lint passa;
- [x] documentação atualizada;
- [x] rastreabilidade atualizada;
- [x] `ALLOWED_CHANGES` respeitado;
- [x] `FORBIDDEN_CHANGES` não violado;
- [x] nenhum Scope Creep;
- [x] `TASKS.md` atualizado;
- [x] relatório de execução produzido;
- [x] estado final registrado.

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

---

# 82. Execução dos prompts — 2026-11-02

**Decisão de escopo confirmada pelo responsável:** elegibilidade limitada ao subtotal mínimo inclusivo; não incluir segmentação por produto/categoria. A matriz de testes da seção 52 foi alinhada a essa decisão.

**Branch:** `feature/TASK-012-coupons-promotions`.

| Gate | Resultado | Evidência |
|---|---|---|
| GATE-001 — Recontextualização e prontidão | APROVADO | TASK-011 está DONE; relatório, código, migration e testes de carrinho existentes; branch correta; decisões/escopo revisados. |
| GATE-002 — Planejamento | APROVADO | Mudanças restritas a promotions/coupons/pricing, integração do cart, persistência/API, auditoria, testes e documentação da TASK. |
| GATE-003 — Implementação | APROVADO | Domínio, APIs administrativas e do carrinho, migration, testes unitários/de integração e auditoria implementados; sem checkout/pagamento/pedido. |
| GATE-004 — Revisão e validação automatizada | APROVADO | `npm run quality`: formatação, lint, typecheck, 67 testes e build passaram; PostgreSQL local aplicado e migration repetida com sucesso. |
| GATE-005 — Testes manuais | APROVADO | MAN-001 a MAN-003 executados pelo responsável no servidor local; respostas HTTP, valores do carrinho e autorização registrados abaixo. |
| GATE-006 — Conclusão | APROVADO | Definition of Done validada; TASK-012 transicionada `IN_PROGRESS → IN_REVIEW → DONE`; TASK-013 permanece BLOCKED e não foi iniciada. |

**Gates:** 6 no total; 6 aprovados; 0 pendentes; 0 bloqueados.

## Evidências dos casos manuais

Pré-condições comuns: aplicação e PostgreSQL locais ativos; migrations aplicadas; sessão de `GENERAL_ADMIN` e sessão de cliente autenticadas; variante comercial ativa com preço maior que zero e saldo suficiente. Não compartilhar senhas, tokens ou cookies na evidência.

### TASK012-MAN-001 — Configurar promoção e cupom

- **Objetivo:** verificar manualmente a autorização administrativa, a criação e a normalização do código.
- **Comando/ambiente:** `npm.cmd run dev`; enviar requisições HTTP locais para `http://localhost:3000`.
- **Passos:** autenticado como `GENERAL_ADMIN`, criar uma promoção `COUPON` ativa e uma promoção `AUTOMATIC` ativa, ambas com desconto percentual de 10%, início no passado recente, expiração futura e subtotal mínimo de 1 centavo; criar um cupom associado usando código com espaços externos e letras minúsculas; consultar a lista administrativa.
- **Esperado:** criações HTTP 201; código retornado trimado e em maiúsculas; lista contém promoção/cupom; usuário sem `promotions.manage` recebe 403.
- **Obtido:** promoções `COUPON` e `AUTOMATIC` e cupom criados com HTTP 201; código informado com espaços externos e minúsculas retornou normalizado como `TASK0121793642458699`. Consultas administrativas retornaram HTTP 200, duas promoções e cupom encontrado. Sessão de cliente consultando `/api/admin/promotions` recebeu HTTP 403.
- **Evidência:** resultados do Console do navegador fornecidos pelo responsável em 2026-11-02.
- **Status:** APROVADO.

### TASK012-MAN-002 — Aplicar desconto e recalcular

- **Objetivo:** confirmar o cálculo do servidor, a idempotência e a seleção sem acumulação.
- **Comando/ambiente:** `POST /api/cart` e `POST /api/cart/coupon` no servidor local, usando sessão do cliente.
- **Passos:** adicionar uma variante disponível; aplicar o cupom criado; repetir a aplicação; consultar o carrinho.
- **Esperado:** subtotal usa o preço vigente; desconto percentual arredonda meio para cima em centavos; total é subtotal menos um único desconto; repetição não acumula; promoção automática elegível de mesmo valor vence empate.
- **Obtido:** inclusão de item HTTP 201; aplicação e repetição do cupom HTTP 200. Subtotal `10000`, desconto `1000` centavos selecionado da promoção automática `TASK012 Automatic 1793642458699`, total `9000`; cupom permaneceu associado. A repetição manteve os mesmos valores, sem acumular desconto.
- **Evidência:** resultado JSON do Console do navegador fornecido pelo responsável em 2026-11-02; variante de teste `5a96b8d2-ada7-4dc7-bdd7-b5786f200c31`, preço `10000` centavos.
- **Status:** APROVADO.

### TASK012-MAN-003 — Remover cupom após alteração

- **Objetivo:** confirmar que edição de carrinho inelegível é mantida e o cupom é removido/recalculado.
- **Comando/ambiente:** `DELETE /api/cart/items/{itemId}` no servidor local, usando a mesma sessão do cliente.
- **Passos:** após MAN-002, remover o último item (ou item que deixe o subtotal abaixo do mínimo) e consultar a resposta do carrinho.
- **Esperado:** edição permanece; `appliedCoupon` fica nulo; `couponRemoved` é verdadeiro; promoções elegíveis são recalculadas; total não é negativo.
- **Obtido:** remoção do item HTTP 200; subtotal `0`, desconto `null`, total `0`, `appliedCoupon: null` e `couponRemoved: true`.
- **Evidência:** mesmo resultado JSON do Console do navegador fornecido pelo responsável em 2026-11-02.
- **Status:** APROVADO.

---

# 83. Relatório de execução

## TASK Execution Report

TASK: TASK-012  
Status: DONE  
Branch: `feature/TASK-012-coupons-promotions`  
Commits: nenhum commit criado nesta execução.

### Primary Changes
- Domínio de promoções, cupons e cálculo de descontos; integração ao carrinho, persistência, API e auditoria conforme RF-018, RF-019, RN-010 e UC-005.
- Permissão `promotions.manage` atribuída exclusivamente a `GENERAL_ADMIN`, conforme autorização registrada.
- Documentação, rastreabilidade, resultados manuais e estado da TASK atualizados.

### Incidental Changes
- `next-env.d.ts` regenerado pelo Next.js 16 durante a validação local.

### Tests Executed
- `npm run quality`: PASS, 67 testes, typecheck, lint, formatação e build aprovados (evidência GATE-004, 2026-11-02).
- Migrations locais aplicadas duas vezes: PASS (evidência GATE-004).
- MAN-001 a MAN-003: PASS, conforme resultados do responsável registrados acima.

### Quality Gates

| Gate | Resultado |
|---|---|
| Build | PASS |
| Lint | PASS |
| Unit | PASS |
| Integration | PASS |
| API | PASS |
| Security | PASS |
| Acceptance | PASS |
| Regression | PASS |

### Scope Validation

Allowed Changes: PASS  
Incidental Changes: PASS — `next-env.d.ts` gerado pelo Next.js durante execução local.  
Forbidden Changes: PASS  
Scope Creep: NONE

### Definition of Done

PASS

### Next Eligible TASK

NONE — TASK-013 permanece BLOCKED e não foi iniciada.

### Adendo aprovado em 2026-11-02

O responsável aprovou que o uso de cupom consumido na criação do pedido seja devolvido ao limite se o pedido expirar sem pagamento após 30 dias corridos. A mudança de ciclo de vida será implementada pela TASK-013, que integra pedidos, reservas de estoque e cupons; esta TASK-012 permanece DONE para o escopo originalmente executado.
