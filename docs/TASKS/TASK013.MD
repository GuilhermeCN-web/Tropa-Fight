# TASK-013 — Checkout, endereço e frete

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-03 / CRITICAL\
 **Dependências:** `DEPENDS_ON: TASK-012`\
 **Estado de entrada esperado:** `BLOCKED` até `TASK-012 = DONE`\
 **Estado de execução permitido:** `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-020, RF-021, RF-022, RF-023, RN-011, RN-012, UC-006

---

 ## 1\. Objetivo

 Implementar o fluxo de **checkout**, incluindo:

 - identificação do cliente;
- endereço de entrega;
- seleção/cálculo de frete;
- consolidação do carrinho;
- validação final de itens e preços;
- aplicação das condições comerciais aprovadas;
- criação transacional do pedido;
- criação dos itens do pedido;
- criação das informações de entrega;
- preservação dos valores praticados no momento da compra;
- prevenção de criação de pedidos parcialmente válidos;
- preparação do pedido para a integração de pagamento da `TASK-014`.

 A TASK deve criar a fronteira transacional entre:

```
Carrinho
   ↓
Validação comercial
   ↓
Endereço
   ↓
Frete
   ↓
Consolidação
   ↓
Pedido
```

 **Não implementar gateway ou captura de pagamento nesta TASK.**

---

 # 2\. Resultado esperado

 Ao final, o cliente deverá conseguir transformar um carrinho válido em um pedido consistente.

 Fluxo esperado:

```
Cliente autenticado
       ↓
Carrinho válido
       ↓
Validar itens
       ↓
Validar disponibilidade
       ↓
Validar preços
       ↓
Validar promoções/cupons
       ↓
Selecionar endereço
       ↓
Calcular/selecionar frete
       ↓
Consolidar valores
       ↓
Criar Order
       ↓
Criar OrderItems
       ↓
Criar Shipment
       ↓
Finalizar transação
```

 Se qualquer etapa crítica falhar:

```
pedido não deve ser criado parcialmente
```

---

 # 3\. Pré-condições / Definition of Ready

 A TASK-013 somente poderá entrar em `READY` quando:

 - `TASK-012 = DONE`;
- carrinho estiver funcional;
- cálculo comercial estiver funcional;
- cupons/promoções estiverem funcionais;
- produtos e variantes estiverem disponíveis;
- preços estiverem definidos;
- disponibilidade/estoque estiverem disponíveis;
- identidade/autorização estiverem funcionais;
- persistência estiver funcional;
- estratégia de endereço estiver definida;
- regras de frete estiverem aprovadas;
- estratégia de criação de pedido estiver documentada;
- estratégia de consistência/transação estiver definida;
- `TASKS.md` estiver atualizado;
- Scope Guard estiver validado.

 Se a política comercial de frete ou endereço estiver indefinida, não inventar comportamento.

---

 # 4\. Escopo funcional

 Implementar:

 ### Checkout

 - início do checkout;
- validação do carrinho;
- consolidação de valores;
- validação final;
- criação de pedido.

 ### Endereços

 - cadastro;
- consulta;
- atualização conforme regra aprovada;
- seleção de endereço;
- associação do endereço ao cliente.

 ### Frete

 - cálculo;
- seleção de modalidade;
- valor;
- prazo, quando aplicável;
- associação ao pedido.

 ### Pedido

 - `Order`;
- `OrderItem`;
- `Shipment`;
- snapshot dos dados necessários;
- estado inicial;
- total comercial;
- total de frete;
- total final.

---

 # 5\. Fora do escopo

 Não implementar:

```
gateway de pagamento
Payment
PaymentIntent
captura
autorização de cartão
PIX real
boleto real
webhook de pagamento
reembolso
estorno
cancelamento comercial
integração real com transportadora não aprovada
rastreamento externo
política de devolução
troca
programa de fidelidade
cashback
alteração de catálogo
alteração de preço de produto
```

 Também não alterar o RBAC sem decisão explícita.

---

 # 6\. Princípios fundamentais

 ## 6.1 Pedido é snapshot da compra

 Depois de criado, o pedido não deve depender do preço atual do catálogo para representar o que foi comprado.

 Exemplo:

```
Produto atual:
R$ 150,00

Preço no pedido:
R$ 120,00
```

 O pedido deve preservar:

```
preço unitário
quantidade
desconto aplicável
subtotal
```

 conforme a regra aprovada.

---

 ## 6.2 Revalidar antes de criar pedido

 Não confiar apenas no estado anterior do carrinho.

 No checkout, revalidar:

```
produto
variante
preço
disponibilidade
quantidade
promoção
cupom
cliente
endereço
frete
```

---

 # 7\. Modelo conceitual

 Criar ou consolidar conceitos equivalentes a:

```
Address
Order
OrderItem
Shipment
Checkout
```

 Os nomes concretos devem seguir as convenções existentes.

---

 # 8\. Address

 Modelo conceitual:

```
Address
 ├── id
 ├── customerId
 ├── recipientName
 ├── postalCode
 ├── street
 ├── number
 ├── complement
 ├── neighborhood
 ├── city
 ├── state
 ├── country
 ├── reference
 ├── createdAt
 └── updatedAt
```

 Somente manter campos realmente necessários.

---

 # 9\. Propriedade do endereço

 Todo endereço deve pertencer a um cliente.

 Regra:

```
address.customerId == authenticatedCustomer.id
```

 Não permitir:

```
Cliente A → usar endereço do Cliente B
```

 mesmo que o `addressId` seja conhecido.

---

 # 10\. Snapshot do endereço

 Ao criar o pedido, o endereço utilizado deve ser preservado no contexto da compra.

 Não depender exclusivamente de:

```
Order → Address atual
```

 porque o cliente pode alterar o endereço posteriormente.

 Conceitualmente:

```
Order
 └── shippingAddressSnapshot
```

 ou estrutura equivalente.

---

 # 11\. Alteração posterior do endereço

 Se o cliente alterar:

```
Address
```

 depois da compra, isso não deve modificar silenciosamente o endereço histórico do pedido.

 Exemplo:

```
Pedido A
→ Rua X

Cliente altera endereço
→ Rua Y

Pedido A continua:
→ Rua X
```

---

 # 12\. Validação de endereço

 Validar, conforme regras aprovadas:

 - campos obrigatórios;
- formato;
- CEP;
- estado;
- cidade;
- país;
- consistência necessária para cálculo do frete.

 Não criar validações comerciais não especificadas.

---

 # 13\. Endereço padrão

 Se houver conceito de endereço padrão:

```
defaultAddress
```

 deve existir no máximo conforme a regra aprovada.

 Não assumir automaticamente que o endereço padrão será usado no checkout.

 O checkout deve utilizar explicitamente o endereço selecionado ou o comportamento aprovado.

---

 # 14\. Cadastro de endereço

 Operação conceitual:

```
POST /customer/addresses
```

 Deve:

 - exigir autenticação;
- associar ao cliente autenticado;
- validar dados;
- persistir;
- retornar o endereço criado.

---

 # 15\. Consulta de endereço

 Cliente somente pode consultar:

```
seu próprio endereço
```

 Não permitir enumeração de endereços de outros clientes.

---

 # 16\. Atualização de endereço

 Atualizações devem exigir propriedade.

 Não permitir que alteração de endereço de cliente modifique um pedido existente.

---

 # 17\. Frete

 O frete deve possuir um modelo determinístico.

 Conceitualmente:

```
ShippingOption
 ├── id
 ├── name
 ├── price
 ├── estimatedDelivery
 └── availability
```

 Os campos reais devem seguir o modelo aprovado.

---

 # 18\. Estratégia de frete

 A TASK deve utilizar somente a estratégia aprovada.

 Possibilidades:

```
frete fixo
faixas de CEP
faixas de valor
faixas de peso
transportadora simulada
provedor externo aprovado
```

 Não escolher provedor real unilateralmente.

---

 # 19\. Frete externo

 Se não existir integração aprovada:

 **não criar integração real com transportadora.**

 Pode existir uma abstração:

```
ShippingCalculator
```

 com implementação local/mockada.

 Exemplo:

```
ShippingCalculator
        ↓
calculate(address, cart)
        ↓
ShippingQuote
```

---

 # 20\. Abstração de frete

 Preferir:

```
interface ShippingCalculator
```

 ou equivalente arquitetural.

 Responsabilidade:

```
calcular opções de entrega
```

 Não misturar:

```
frete
pagamento
pedido
```

 na mesma responsabilidade.

---

 # 21\. Cotação de frete

 Uma cotação deve ser baseada em informações confiáveis:

```
endereço
itens
quantidades
peso/dimensões quando aplicável
valor comercial quando aplicável
```

 Não aceitar valor de frete informado arbitrariamente pelo cliente.

---

 # 22\. Frete enviado pelo cliente

 Payload como:

```
{
  "shippingPrice": 1.00
}
```

 não deve determinar o valor final.

 O backend deve recalcular ou validar a cotação.

---

 # 23\. Prazo de entrega

 Se o frete possuir prazo:

```
estimatedDelivery
```

 deve ser derivado da regra aprovada.

 Não prometer prazo não suportado pela implementação.

---

 # 24\. Seleção de modalidade

 Se houver múltiplas opções:

```
STANDARD
EXPRESS
```

 o cliente pode selecionar uma opção válida.

 O servidor deve confirmar que a opção:

 - existe;
- está disponível;
- pertence à cotação atual;
- corresponde ao endereço;
- corresponde ao carrinho.

---

 # 25\. Expiração da cotação

 Se a cotação tiver validade:

```
quotedAt
expiresAt
```

 não aceitar uma cotação expirada.

 Caso não exista expiração definida, não inventar TTL comercial.

---

 # 26\. Carrinho vazio

 Não permitir checkout de carrinho vazio.

 Exemplo:

```
items = []
```

 Resultado:

```
CHECKOUT_CART_EMPTY
```

 Nenhum pedido deve ser criado.

---

 # 27\. Itens indisponíveis

 Antes da criação do pedido, validar novamente disponibilidade.

 Se um item não puder ser vendido:

```
checkout rejeitado
pedido não criado
```

---

 # 28\. Quantidade inválida

 Rejeitar:

```
quantity <= 0
```

 e qualquer quantidade que ultrapasse a disponibilidade comercial permitida.

---

 # 29\. Produto removido

 Se o produto/variante não estiver mais disponível:

```
checkout rejeitado
```

 Não criar pedido apontando silenciosamente para produto inexistente.

---

 # 30\. Preço alterado

 Se o preço atual divergir do preço utilizado no carrinho:

```
preço carrinho ≠ preço atual
```

 o checkout deve seguir a política aprovada.

 Possibilidades:

```
recalcular
rejeitar
exigir confirmação
```

 Não inventar comportamento.

 O importante é que o pedido nunca seja criado com preço inconsistente.

---

 # 31\. Recalculo comercial

 Antes de criar o pedido:

```
subtotal
promoções
cupons
desconto
frete
total
```

 devem ser recalculados/validados.

 A `TASK-013` deve reutilizar o mecanismo comercial da `TASK-011`/`TASK-012`, e não duplicar as regras.

---

 # 32\. Cupom

 O cupom deve ser revalidado conforme as regras da `TASK-012`.

 Especialmente:

```
vigência
status
elegibilidade
limites
cliente
itens
```

 Não confiar somente na informação armazenada no frontend.

---

 # 33\. Consumo definitivo do cupom

 A criação do pedido deve utilizar a estratégia definida na `TASK-012`.

 Se o uso definitivo ocorrer na confirmação do pedido:

```
Checkout
   ↓
Order criado
   ↓
consumo definitivo
```

 deve ser consistente com a transação.

 Não consumir duas vezes.

---

 # 34\. Estoque

 O checkout deve validar disponibilidade.

 Não antecipar regras de reserva definitiva se elas não estiverem aprovadas.

 A TASK pode:

```
consultar estoque
validar quantidade
```

 mas não deve criar uma estratégia de reserva fora do escopo.

---

 # 35\. Concorrência de estoque

 Cenário:

```
Estoque = 1

Cliente A → checkout
Cliente B → checkout
```

 A implementação deve impedir criação inconsistente de pedidos que violem a política de estoque.

 A estratégia exata de reserva/baixa deve seguir o modelo definido.

 Se a regra definitiva exigir operação de estoque transacional, ela deve ser explicitamente integrada sem inventar comportamento.

---

 # 36\. Order

 Modelo conceitual:

```
Order
 ├── id
 ├── customerId
 ├── status
 ├── subtotal
 ├── discount
 ├── shippingAmount
 ├── total
 ├── coupon/reference
 ├── shippingAddressSnapshot
 ├── createdAt
 └── updatedAt
```

 Campos adicionais somente se necessários.

---

 # 37\. OrderItem

 Modelo conceitual:

```
OrderItem
 ├── id
 ├── orderId
 ├── productId
 ├── variantId
 ├── productNameSnapshot
 ├── variantNameSnapshot
 ├── unitPrice
 ├── quantity
 ├── discount
 └── subtotal
```

 Snapshots devem preservar a informação comercial necessária para o histórico.

---

 # 38\. Por que usar snapshot

 Se o produto mudar:

```
Nome:
"Luva Tropa Fight"
```

 para:

```
"Luva Tropa Fight Pro"
```

 o pedido histórico não deve mudar retroativamente.

 O mesmo vale para preço e informações essenciais da compra.

---

 # 39\. Shipment

 Modelo conceitual:

```
Shipment
 ├── id
 ├── orderId
 ├── shippingMethod
 ├── shippingAmount
 ├── estimatedDelivery
 └── status
```

 O estado inicial deve seguir a matriz de estados aprovada.

 Não implementar rastreamento nesta TASK.

---

 # 40\. Estado inicial do pedido

 O pedido precisa possuir estado inicial definido.

 Exemplo conceitual:

```
PENDING_PAYMENT
```

 ou equivalente aprovado.

 Não criar estados novos sem decisão.

 O estado deve ser compatível com a `TASK-014`.

---

 # 41\. Integração com pagamento

 A `TASK-013` deve deixar o pedido em estado apropriado para a `TASK-014`.

 Exemplo:

```
Checkout
   ↓
Order
   ↓
PENDING_PAYMENT
   ↓
TASK-014
```

 Não realizar:

```
captura
autorização
webhook
```

 nesta TASK.

---

 # 42\. Transação

 A criação do pedido deve ser transacional.

 Conceitualmente:

```
BEGIN

validar checkout
validar estoque
validar cupom
calcular valores
criar Order
criar OrderItems
criar Shipment
registrar consumo necessário

COMMIT
```

 Se falhar:

```
ROLLBACK
```

 conforme a estratégia arquitetural.

---

 # 43\. Pedido parcialmente criado

 Não permitir:

```
Order criado
OrderItem falhou
Shipment falhou
```

 sem tratamento consistente.

 O resultado final deve ser:

```
pedido completo
```

 ou:

```
nenhum pedido
```

 salvo comportamento explicitamente aprovado.

---

 # 44\. Idempotência do checkout

 Repetir a mesma operação de checkout não deve criar múltiplos pedidos acidentalmente.

 Exemplo:

```
Request A
Request A repetida
```

 não pode gerar:

```
Order 100
Order 101
```

 sem que isso seja uma nova intenção legítima.

 A estratégia pode utilizar:

```
idempotency key
checkout token
request identifier
```

 conforme arquitetura aprovada.

---

 # 45\. Idempotency Key

 Se adotada:

```
Idempotency-Key
```

 deve ser:

 - associada ao cliente;
- protegida contra reutilização indevida;
- persistida de forma consistente;
- capaz de devolver o mesmo resultado lógico.

 Não implementar apenas no frontend.

---

 # 46\. Concorrência de checkout

 Testar:

```
dois requests simultâneos
```

 para o mesmo carrinho.

 O sistema deve impedir:

```
dois pedidos legítimos gerados pelo mesmo checkout
```

 quando a operação for a mesma intenção.

---

 # 47\. Carrinho após criação do pedido

 O comportamento deve ser definido.

 Opções:

```
limpar carrinho
marcar como convertido
associar cart → order
```

 A implementação deve seguir a regra aprovada.

 Não duplicar itens nem permitir que o carrinho convertido continue sendo interpretado como compra pendente.

---

 # 48\. Cálculo do subtotal

 O subtotal do pedido deve ser calculado a partir dos itens confiáveis:

```
Σ unitPrice × quantity
```

 Não aceitar:

```
clientSubtotal
```

 como fonte de verdade.

---

 # 49\. Desconto

 O desconto deve vir do mecanismo comercial existente.

 Não permitir:

```
clientDiscount
```

 como fonte de verdade.

---

 # 50\. Frete

 O frete deve ser calculado pelo backend.

 Não permitir:

```
clientShippingAmount
```

 como fonte de verdade.

---

 # 51\. Total

 O total do pedido deve ser:

```
subtotal
- desconto
+ frete
```

 conforme a política comercial aprovada.

 Exemplo:

```
subtotal = 300
desconto = 30
frete = 20

total = 290
```

---

 # 52\. Invariantes financeiras

 ## INV-01

```
subtotal >= 0
```

 ## INV-02

```
discount >= 0
```

 ## INV-03

```
shippingAmount >= 0
```

 quando frete negativo não for permitido.

 ## INV-04

```
total >= 0
```

 ## INV-05

```
total = subtotal - discount + shippingAmount
```

 ## INV-06

 Os valores do pedido são determinados pelo backend.

---

 # 53\. Precisão monetária

 Utilizar a mesma estratégia definida anteriormente.

 Não usar cálculos financeiros baseados em `float` quando o projeto exigir precisão decimal.

 Todos os valores devem possuir representação consistente.

---

 # 54\. Arredondamento

 O arredondamento deve ser único e consistente com:

```
TASK-011
TASK-012
```

 Não criar nova política.

---

 # 55\. Segurança

 Validar:

 - autenticação;
- autorização;
- propriedade do carrinho;
- propriedade do endereço;
- integridade dos itens;
- integridade dos preços;
- integridade do frete;
- integridade do desconto;
- integridade do total;
- manipulação de IDs;
- replay de checkout;
- concorrência.

---

 # 56\. IDOR

 Testar:

```
Cliente A → cart A → permitido
Cliente A → cart B → negado

Cliente A → address A → permitido
Cliente A → address B → negado
```

 O mesmo vale para qualquer recurso sensível do checkout.

---

 # 57\. Dados pessoais

 Endereço contém dados pessoais.

 Garantir:

 - acesso restrito;
- logs mínimos;
- não exposição em mensagens de erro;
- proteção conforme os requisitos aprovados.

 Não registrar endereço completo em logs desnecessariamente.

---

 # 58\. Logs

 Não registrar:

```
senha
token
credencial
dados completos de pagamento
```

 e evitar dados pessoais desnecessários.

 Pode registrar identificadores técnicos adequados:

```
orderId
customerId
checkoutId
correlationId
```

 conforme política de observabilidade.

---

 # 59\. API de checkout

 Contrato conceitual:

```
POST /checkout
```

 Entrada possível:

```
{
  "cartId": "cart-id",
  "addressId": "address-id",
  "shippingOptionId": "shipping-option-id"
}
```

 Os campos reais devem seguir o contrato da aplicação.

---

 # 60\. O que o cliente não deve enviar

 Evitar aceitar como fonte de verdade:

```
{
  "subtotal": 100,
  "discount": 50,
  "shipping": 0,
  "total": 50
}
```

 Esses valores devem ser calculados no backend.

---

 # 61\. Resposta do checkout

 Resposta conceitual:

```
{
  "orderId": "order-id",
  "status": "PENDING_PAYMENT",
  "subtotal": 300.00,
  "discount": 30.00,
  "shipping": 20.00,
  "total": 290.00
}
```

 Os nomes concretos devem respeitar o contrato existente.

---

 # 62\. API de endereços

 Operações conceituais:

```
POST   /customer/addresses
GET    /customer/addresses
GET    /customer/addresses/{id}
PATCH  /customer/addresses/{id}
DELETE /customer/addresses/{id}
```

 Somente implementar operações realmente necessárias.

---

 # 63\. API de frete

 Operação conceitual:

```
POST /checkout/shipping-options
```

 ou equivalente.

 A cotação deve utilizar:

```
cart
address
```

 e calcular opções válidas.

---

 # 64\. Recalculo de frete

 Alterar:

```
endereço
itens
quantidades
```

 pode invalidar o frete anterior.

 Nesse caso:

```
shippingQuote
→ recalcular
```

 Não manter valor antigo silenciosamente.

---

 # 65\. Consistência entre cotação e pedido

 A opção escolhida no checkout deve corresponder à cotação efetivamente válida.

 Não permitir:

```
cotação A
→ cliente envia ID da opção B
→ servidor aceita preço de A
```

---

 # 66\. Expiração de sessão

 Se existir mecanismo de sessão de checkout:

```
checkoutSession
```

 seguir o TTL definido.

 Não criar sessão persistente sem necessidade.

---

 # 67\. Estado do checkout

 Se houver entidade própria:

```
CheckoutSession
```

 ela deve possuir ciclo de vida claro.

 Exemplo:

```
OPEN
COMPLETED
EXPIRED
```

 Não adicionar estados sem necessidade.

---

 # 68\. Erros de domínio

 Possíveis erros:

```
CHECKOUT_CART_EMPTY
CHECKOUT_CART_INVALID
CHECKOUT_ITEM_UNAVAILABLE
CHECKOUT_PRICE_CHANGED
CHECKOUT_ADDRESS_NOT_FOUND
CHECKOUT_ADDRESS_NOT_OWNED
CHECKOUT_SHIPPING_UNAVAILABLE
CHECKOUT_SHIPPING_EXPIRED
CHECKOUT_COUPON_INVALID
CHECKOUT_TOTAL_INVALID
CHECKOUT_ALREADY_PROCESSED
CHECKOUT_CONCURRENT_REQUEST
```

 Os códigos reais devem seguir o padrão do projeto.

---

 # 69\. Ordem de validação

 Fluxo recomendado:

```
1. autenticar cliente
2. validar carrinho
3. carregar itens
4. validar produtos/variantes
5. validar quantidades
6. validar preços
7. recalcular promoções
8. recalcular cupom
9. validar endereço
10. calcular/validar frete
11. validar estoque
12. consolidar valores
13. iniciar transação
14. criar pedido
15. criar itens
16. criar shipment
17. aplicar efeitos transacionais necessários
18. finalizar
```

 A ordem concreta pode ser ajustada conforme a estratégia de concorrência.

---

 # 70\. Ordem transacional

 A implementação deve minimizar janelas em que dados podem mudar entre:

```
validação
```

 e:

```
persistência do pedido
```

 Especialmente para:

```
preço
estoque
cupom
frete
```

---

 # 71\. Testes unitários

 Criar testes para:

```
checkout de carrinho válido
carrinho vazio
item indisponível
quantidade inválida
preço alterado
cupom válido
cupom expirado
cupom inválido
endereço válido
endereço inexistente
endereço de outro cliente
frete válido
frete indisponível
frete expirado
total
arredondamento
snapshot do endereço
snapshot do produto
snapshot do preço
estado inicial do pedido
```

---

 # 72\. Testes de integração

 Validar:

```
Cart
→ Pricing
→ Promotions
→ Address
→ Shipping
→ Inventory
→ Order
```

 O fluxo completo deve resultar em um pedido consistente.

---

 # 73\. Teste de pedido parcial

 Forçar falha na criação de:

```
OrderItem
```

 Resultado esperado:

```
Order não permanece parcialmente criado
```

 Repetir para:

```
Shipment
```

 e efeitos transacionais relevantes.

---

 # 74\. Testes de autorização

 Mínimo:

```
cliente A → carrinho A → PASS
cliente A → carrinho B → FAIL

cliente A → endereço A → PASS
cliente A → endereço B → FAIL
```

---

 # 75\. Testes financeiros

 ### FIN-01

```
subtotal = 100
discount = 10
shipping = 20
total = 110
```

 ### FIN-02

```
subtotal = 100
discount = 100
shipping = 0
total = 0
```

 ### FIN-03

 Desconto inválido acima do subtotal deve seguir a regra definida.

 ### FIN-04

 Frete não pode alterar o subtotal.

 ### FIN-05

 Preço enviado pelo cliente não altera o resultado.

---

 # 76\. Testes de snapshot

 Criar pedido:

```
produto = "Produto A"
preço = 100
```

 Depois alterar catálogo:

```
produto = "Produto B"
preço = 200
```

 Pedido deve continuar representando:

```
Produto A
100
```

---

 # 77\. Testes de endereço

 Criar pedido usando:

```
Rua A
```

 Depois alterar o endereço do cliente para:

```
Rua B
```

 O pedido deve continuar com:

```
Rua A
```

---

 # 78\. Testes de frete

 Validar:

```
frete disponível
frete indisponível
opção inexistente
opção de outra cotação
cotação expirada
alteração de endereço
alteração de carrinho
```

---

 # 79\. Testes de concorrência

 Testar:

```
dois checkouts simultâneos
mesmo carrinho
mesmo cupom
última unidade disponível
último uso do cupom
```

 Validar que não ocorram pedidos duplicados ou estados inconsistentes.

---

 # 80\. Testes de idempotência

 Executar:

```
POST /checkout
Idempotency-Key: X
```

 duas vezes.

 Resultado:

```
mesmo resultado lógico
```

 e não:

```
Order A
Order B
```

---

 # 81\. Testes de regressão

 Executar:

 - identidade;
- autorização;
- catálogo;
- variantes;
- preços;
- busca;
- estoque;
- carrinho;
- promoções;
- cupons.

 A introdução do checkout não deve quebrar funcionalidades anteriores.

---

 # 82\. Observabilidade

 Eventos relevantes:

```
checkout.started
checkout.validation_failed
checkout.shipping_calculated
checkout.failed
checkout.completed
order.created
order.creation_failed
```

 Não registrar dados pessoais desnecessários.

---

 # 83\. Auditoria

 A criação de pedido é uma operação relevante.

 Registrar, conforme infraestrutura existente:

```
customer
order
timestamp
resultado
```

 Não registrar dados sensíveis desnecessários.

---

 # 84\. Performance

 Evitar:

```
N+1 em OrderItems
N+1 em produtos
N+1 em variantes
N+1 em estoque
N+1 em endereços
```

 Não introduzir otimizações fora do escopo.

---

 # 85\. Persistência

 Garantir:

 - FK de `Order`;
- FK de `OrderItem`;
- FK de `Shipment`;
- FK de cliente;
- integridade de endereço;
- constraints necessárias;
- valores monetários consistentes;
- índices necessários.

---

 # 86. Migrações

 Migrations devem:

 - ser reproduzíveis;
- manter integridade;
- respeitar convenções do projeto;
- não apagar dados existentes;
- não criar dependências de pagamento real.

---

 # 87\. ALLOWED\_CHANGES

 Permitido:

```
módulo checkout
módulo orders
módulo shipping
módulo addresses
persistência correspondente
migrations
APIs
DTOs
contratos
integração com cart
integração com pricing
integração com promotions/coupons
integração de consulta com inventory
testes
validações
transações
idempotência de checkout
auditoria necessária
observabilidade necessária
documentação
TASKS.md
relatório de execução
correções diretamente necessárias nas TASK-011/TASK-012
```

---

 # 88\. FORBIDDEN\_CHANGES

 Não realizar:

```
gateway de pagamento
captura de pagamento
autorização de cartão
webhook de pagamento
integração real de pagamento
reembolso
estorno
cancelamento comercial
devolução
troca
rastreamento externo
integração logística não aprovada
novo programa de fidelidade
cashback
alteração do catálogo
alteração do preço de catálogo
alteração unilateral de RBAC
mudança arquitetural não aprovada
mudança de requisito
funcionalidade comercial não especificada
```

---

 # 89\. Scope Guard

 Antes de qualquer mudança incidental:

```
A mudança é necessária para checkout?
A mudança é necessária para endereço?
A mudança é necessária para frete?
A mudança é necessária para criação consistente do pedido?
A mudança é necessária para integração com TASK-012?
A mudança está relacionada a RF-020–RF-023?
A mudança está relacionada a RN-011/RN-012?
A mudança está relacionada a UC-006?
A mudança está em ALLOWED_CHANGES?
```

 Se não:

```
NÃO IMPLEMENTAR
```

 Registrar como pendência quando necessário.

---

 # 90\. Quality Gates

```
[ ] Build
[ ] Lint
[ ] Unit tests
[ ] Integration tests
[ ] API/contract tests
[ ] Authorization tests
[ ] Security tests
[ ] Checkout tests
[ ] Address tests
[ ] Shipping tests
[ ] Pricing tests
[ ] Promotion/Coupon regression
[ ] Inventory validation
[ ] Financial calculation tests
[ ] Snapshot tests
[ ] Transaction tests
[ ] Rollback tests
[ ] Concurrency tests
[ ] Idempotency tests
[ ] Regression tests
[ ] Migration tests
[ ] Observability validation
[ ] Traceability validation
[ ] Scope Guard
```

---

 # 91. Critérios de aceitação

 ### AC-01 — Checkout válido

 Cliente autenticado consegue concluir checkout de um carrinho válido.

 ### AC-02 — Carrinho vazio

 Carrinho vazio não gera pedido.

 ### AC-03 — Propriedade

 Cliente somente utiliza seu próprio carrinho e endereço.

 ### AC-04 — Endereço

 Endereço válido é associado ao pedido.

 ### AC-05 — Snapshot

 Pedido preserva os dados comerciais e de entrega necessários no momento da compra.

 ### AC-06 — Frete

 Frete é calculado/selecionado conforme regra aprovada.

 ### AC-07 — Preço

 Preço é validado no checkout e não pode ser manipulado pelo cliente.

 ### AC-08 — Promoções

 Promoções e cupons são revalidados antes da criação do pedido.

 ### AC-09 — Estoque

 Disponibilidade é validada antes da criação do pedido.

 ### AC-10 — Total

 O total é calculado pelo backend:

```
subtotal - desconto + frete
```

 ### AC-11 — Transação

 Falha em etapa crítica não deixa pedido parcialmente persistido.

 ### AC-12 — Idempotência

 Repetição da mesma intenção de checkout não gera pedidos duplicados.

 ### AC-13 — Concorrência

 Condições concorrentes não produzem estado comercial inconsistente.

 ### AC-14 — Pagamento

 Pedido é preparado para pagamento, mas nenhum gateway/captura é implementado.

 ### AC-15 — Segurança

 Dados de outros clientes não podem ser acessados.

 ### AC-16 — Qualidade

 Build, lint e testes aplicáveis passam.

 ### AC-17 — Rastreabilidade

 RF/RN/UC relacionados possuem evidências.

 ### AC-18 — Escopo

 Pagamento real e logística externa não foram antecipados.

---

 # 92\. Definition of Done específica

 A `TASK-013` somente poderá ser marcada como `DONE` quando:

 - [ ] checkout implementado;
- [ ] endereço implementado;
- [ ] validação de propriedade implementada;
- [ ] snapshot de endereço implementado;
- [ ] cálculo/seleção de frete implementado;
- [ ] abstração de frete criada quando necessária;
- [ ] carrinho validado novamente no checkout;
- [ ] preços revalidados;
- [ ] promoções revalidadas;
- [ ] cupons revalidados;
- [ ] disponibilidade validada;
- [ ] `Order` implementado;
- [ ] `OrderItem` implementado;
- [ ] `Shipment` implementado;
- [ ] estado inicial do pedido definido;
- [ ] snapshot comercial preservado;
- [ ] total calculado pelo backend;
- [ ] transação implementada;
- [ ] rollback validado;
- [ ] idempotência implementada;
- [ ] concorrência validada;
- [ ] autorização validada;
- [ ] segurança validada;
- [ ] observabilidade necessária validada;
- [ ] auditoria necessária validada;
- [ ] migrations executadas/testadas;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes financeiros passam;
- [ ] testes de autorização passam;
- [ ] testes de concorrência passam;
- [ ] testes de idempotência passam;
- [ ] regressão das TASK-011 e TASK-012 passa;
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

 # 93\. Condições de FAILED

 Marcar `FAILED` se ocorrer:

```
pedido parcialmente persistido
pedido duplicado
total incorreto
frete incorreto
desconto incorreto
preço manipulável pelo cliente
endereço de outro cliente utilizado
carrinho de outro cliente utilizado
produto indisponível vendido indevidamente
cupom inválido aceito
estoque violado
snapshot inconsistente
falha transacional crítica
rollback incorreto
idempotência quebrada
concorrência inconsistente
bypass de autorização
vazamento de dados pessoais
regressão crítica
build falhando
lint obrigatório falhando
testes obrigatórios falhando
violação de FORBIDDEN_CHANGES
```

 Registrar:

```
problema
evidência
impacto
causa conhecida
Gate afetado
correção necessária
```

---

 # 94\. Condições de CANCELLED

 `CANCELLED` somente mediante decisão explícita.

 Registrar:

```
motivo
decisão
impacto
artefatos produzidos
pendências
rastreabilidade
```

 O cancelamento não autoriza automaticamente a `TASK-014`.

---

 # 95\. Rastreabilidade

 | Requisito | Evidência esperada |
| --- | --- |
| RF-020 | Checkout e criação de pedido |
| RF-021 | Endereço e entrega |
| RF-022 | Frete |
| RF-023 | Consolidação/transação do pedido |
| RN-011 | Regras de checkout/endereço |
| RN-012 | Regras de frete/entrega |
| UC-006 | Fluxo completo de checkout |

Cada requisito deve possuir evidência em código, teste, contrato, documentação ou combinação aplicável.

---

 # 96\. Matriz de invariantes

 | Invariante | Resultado esperado |
| --- | --- |
| Pedido pertence ao cliente | PASS |
| Endereço pertence ao cliente | PASS |
| Carrinho pertence ao cliente | PASS |
| Subtotal é calculado no backend | PASS |
| Desconto é calculado no backend | PASS |
| Frete é calculado no backend | PASS |
| Total é calculado no backend | PASS |
| Total é não negativo | PASS |
| Pedido possui itens consistentes | PASS |
| Snapshot não depende do catálogo atual | PASS |
| Pedido não é criado parcialmente | PASS |
| Checkout idempotente | PASS |
| Concorrência controlada | PASS |

---

 # 97\. Relatório de execução — template

```
TASK: TASK-013
TÍTULO: Checkout, endereço e frete
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: <DONE|FAILED|CANCELLED>

DEPENDÊNCIA:
- TASK-012: DONE

OBJETIVO:
<resumo>

IMPLEMENTADO:
- Checkout
- Address
- Order
- OrderItem
- Shipment
- ShippingCalculator
- Validação comercial
- Snapshot
- Transação
- Idempotência

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

Checkout:
- Resultado: <PASS/FAIL>
- Evidência:

Address:
- Resultado: <PASS/FAIL>
- Evidência:

Shipping:
- Resultado: <PASS/FAIL>
- Evidência:

Pricing:
- Resultado: <PASS/FAIL>
- Evidência:

Promotion/Coupon Regression:
- Resultado: <PASS/FAIL>
- Evidência:

Inventory:
- Resultado: <PASS/FAIL>
- Evidência:

Financial Calculation:
- Resultado: <PASS/FAIL>
- Evidência:

Snapshot:
- Resultado: <PASS/FAIL>
- Evidência:

Transaction:
- Resultado: <PASS/FAIL>
- Evidência:

Rollback:
- Resultado: <PASS/FAIL>
- Evidência:

Concurrency:
- Resultado: <PASS/FAIL>
- Evidência:

Idempotency:
- Resultado: <PASS/FAIL>
- Evidência:

DATABASE:
- migrations: <PASS/FAIL>
- constraints: <PASS/FAIL>
- índices: <PASS/FAIL>

INVARIANTES:
- order ownership: <PASS/FAIL>
- address ownership: <PASS/FAIL>
- cart ownership: <PASS/FAIL>
- subtotal backend-controlled: <PASS/FAIL>
- discount backend-controlled: <PASS/FAIL>
- shipping backend-controlled: <PASS/FAIL>
- total backend-controlled: <PASS/FAIL>
- total >= 0: <PASS/FAIL>
- snapshot integrity: <PASS/FAIL>
- transaction integrity: <PASS/FAIL>
- idempotency: <PASS/FAIL>
- concurrency: <PASS/FAIL>

SEGURANÇA:
- preço controlável pelo cliente: NÃO
- desconto controlável pelo cliente: NÃO
- frete controlável pelo cliente: NÃO
- total controlável pelo cliente: NÃO
- acesso cross-customer: NÃO
- bypass de autorização: NÃO

PAGAMENTO:
- gateway real: NÃO IMPLEMENTADO
- captura: NÃO IMPLEMENTADA
- webhook: NÃO IMPLEMENTADO
- pedido preparado para TASK-014: <SIM/NÃO>

PROBLEMAS ENCONTRADOS:
- <item ou nenhum>

CORREÇÕES REALIZADAS:
- <item ou nenhuma>

PENDÊNCIAS:
- <item ou nenhuma>

RASTREABILIDADE:
- RF-020: <evidência>
- RF-021: <evidência>
- RF-022: <evidência>
- RF-023: <evidência>
- RN-011: <evidência>
- RN-012: <evidência>
- UC-006: <evidência>

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

 # 98\. Regra de encerramento

 Ao finalizar a `TASK-013`:

 1. executar todos os Quality Gates;
2. validar propriedade do carrinho;
3. validar propriedade do endereço;
4. validar preços;
5. validar cupons e promoções;
6. validar disponibilidade;
7. validar frete;
8. validar cálculo financeiro;
9. validar snapshots;
10. validar transação;
11. validar rollback;
12. validar idempotência;
13. validar concorrência;
14. executar regressão das `TASK-011` e `TASK-012`;
15. verificar que nenhum pagamento real foi antecipado;
16. atualizar rastreabilidade;
17. atualizar `TASKS.md`;
18. produzir relatório de execução;
19. registrar estado final;
20. **não iniciar automaticamente a `TASK-014`**.

 A conclusão da `TASK-013` torna a `TASK-014` elegível quando suas condições de entrada estiverem satisfeitas, mas **não autoriza seu início automático**.

 A fronteira principal desta TASK fica assim:

```
TASK-011
Carrinho + cálculo
        ↓
TASK-012
Cupons + promoções
        ↓
TASK-013
Checkout + endereço + frete + Order
        ↓
TASK-014
Pagamento + idempotência + webhooks
```