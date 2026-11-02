# TASK-013 — Checkout, endereço e frete

 **Status:** DONE\
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

 **Prontidão (2026-11-02): PASS.** TASK-012 está `DONE`; seus artefatos de carrinho, cupom e promoção existem. Requisitos, contratos, políticas comerciais, estados, estratégia transacional e Scope Guard foram definidos abaixo e registrados em `docs/planning/answered-questions.md`. ADR-005, ADR-007, ADR-009 e ADR-010 foram aprovados para o escopo da TASK-013. O resumo `ALLOWED_CHANGES` foi alinhado ao escopo detalhado. Nenhum código foi implementado antes desta aprovação de prontidão.

 **Execução (2026-11-02):** branch `feature/TASK-013-checkout-address-shipping`; transições `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE`. GATE-001 (prontidão), GATE-002 (planejamento), GATE-003 (implementação) e GATE-004 (validação final) aprovados.

 **Decisão adicional aprovada pelo responsável:** o desconto total será rateado proporcionalmente entre os itens; os centavos restantes serão alocados pelas maiores frações, com desempate pelo menor ID de variante em ordem lexical. A soma dos descontos por item deve coincidir com o desconto do pedido. A migration `009_order_item_discount_allocation.sql` persiste essa parcela e restringe o desconto de cada item ao respectivo subtotal.

 **Implementação concluída:** migrations `008_checkout_orders.sql`, `009_order_item_discount_allocation.sql` e `010_order_coupon_snapshot.sql`; persistência de endereços/cotações/pedidos/itens/entregas/reservas/idempotência; APIs autenticadas de endereço e checkout; recálculo de carrinho/cupom; rateio do desconto; proteção de estoque reservado; snapshots; cotação local por porta/adaptador e auditoria. `npm run quality` passou com 28 arquivos e 79 testes; migrations reaplicadas duas vezes. Lint manteve somente o aviso preexistente em `app/layout.tsx`.

 **Decisões aprovadas pelo responsável em 2026-11-02:**

 1. **Endereço:** o cliente pode manter vários endereços e seleciona explicitamente um no checkout. Nome do destinatário, CPF, telefone, CEP, rua, número, bairro, cidade, estado e país são obrigatórios; complemento e referência são opcionais. CPF deve ter 11 dígitos com dígitos verificadores válidos. Telefone brasileiro deve conter DDD e 10 ou 11 dígitos. CPF e telefone serão normalizados e preservados no snapshot do pedido. Somente Brasil é atendido; país `BR` e CEP de 8 dígitos.
 2. **Frete:** cotação local determinística, sem transportadora real: todos os CEPs brasileiros; somente modalidade `STANDARD`; preço fixo de R$ 20,00; estimativa de 5 dias úteis, contando segunda a sexta sem calendário de feriados; sem retirada e sem frete grátis.
 3. **Estoque:** reserva atômica na criação do pedido por 30 dias corridos. Pagamento confirmado antes do prazo converte a reserva em baixa definitiva na integração da TASK-014. Sem pagamento no prazo, o pedido passa a `EXPIRED`, não pode mais ser pago e a reserva é liberada.
 4. **Cupom:** uso consumido atomicamente na criação do pedido é devolvido ao limite se o pedido expirar sem pagamento após 30 dias. A decisão atualiza o ciclo registrado na TASK-012; a integração de liberação pertence a esta TASK-013.
 5. **Preço:** checkout recalcula preços e demais valores no servidor. Se houver divergência desde a apresentação anterior, retorna a cotação atualizada e exige confirmação explícita antes de criar o pedido. Totais do cliente nunca são fonte de verdade.
 6. **Estados:** pedido inicia `PENDING_PAYMENT`, entrega inicia `NOT_SHIPPED`; os ciclos permanecem separados. Pedido não pago expira como `EXPIRED` após 30 dias corridos.
 7. **Carrinho:** ao criar o pedido, marcar o carrinho como convertido e associá-lo ao pedido, preservando itens. Uma consulta posterior cria um novo carrinho vazio.
 8. **Idempotência:** exigir `Idempotency-Key` associada ao cliente. Mesma chave com mesmo conteúdo retorna o mesmo pedido; mesma chave com conteúdo diferente retorna conflito.
 9. **Escopo:** incluir módulos de checkout/orders/shipping/addresses, persistência/migrations, APIs/DTOs/contratos, integração com cart/pricing/promotions/coupons, consulta e reservas de inventory, idempotência, auditoria, testes e documentação. Permanecem proibidos pagamentos reais, gateway, captura, reembolso, cancelamento comercial, devolução/troca, rastreamento externo, integração logística real e alteração unilateral de RBAC.

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
 ├── cpf
 ├── phone
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

 Campos obrigatórios: `recipientName`, CPF, telefone, `postalCode`, `street`, `number`, `neighborhood`, `city`, `state` e `country`. `complement` e `reference` são opcionais. O cliente poderá manter múltiplos endereços.

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

 Validar campos obrigatórios; CPF brasileiro de 11 dígitos e dígitos verificadores; telefone brasileiro com DDD e 10 ou 11 dígitos; CEP de 8 dígitos; e país `BR`. Normalizar CPF, telefone e CEP para dígitos. Não consultar serviço externo de CEP nem inventar outras regras de validação.

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

 Para a V1 local, a única opção é `STANDARD`, com preço fixo de 2.000 centavos BRL e prazo estimado de 5 dias úteis.

---

 # 18\. Estratégia de frete

Utilizar somente a cotação local determinística aprovada: todos os CEPs brasileiros válidos recebem `STANDARD`, R$ 20,00 fixos e estimativa de 5 dias úteis. Não escolher provedor real.

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

 A cotação local aprovada usa o endereço brasileiro válido e não depende de peso, dimensões ou valor dos itens. Uma futura cotação externa deverá ser baseada em informações confiáveis:

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

 O prazo aprovado é de 5 dias úteis, contando segunda a sexta e sem calendário de feriados. O cálculo começa na data de criação do pedido.

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

 A cotação não possui expiração temporal própria. No momento de confirmar o pedido, o servidor revalida carrinho, endereço, preço, desconto e frete. Se os valores divergirem, retorna nova cotação e exige confirmação explícita novamente.

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

 recalcular no servidor e exigir confirmação explícita dos valores atualizados. A primeira tentativa de confirmar uma cotação divergente não cria pedido; retorna a nova cotação para o cliente confirmar.

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

 Consumir o uso do cupom atomicamente na criação do pedido. Se esse pedido expirar sem pagamento após 30 dias corridos, liberar o uso ao limite na mesma transação que expira o pedido e libera a reserva de estoque. Repetição idempotente não consome novamente.

---

 # 34\. Estoque

 Ao criar o pedido, reservar atomica e transacionalmente as quantidades disponíveis por 30 dias corridos. Pagamento confirmado converte a reserva em baixa definitiva na TASK-014. Pedido não pago ao fim do prazo expira e libera a reserva. O carrinho não reserva estoque.

---

 # 35\. Concorrência de estoque

 Cenário:

```
Estoque = 1

Cliente A → checkout
Cliente B → checkout
```

 A implementação deve impedir criação inconsistente de pedidos que violem a política de estoque.

 A reserva deve impedir que pedidos concorrentes excedam o saldo vendável. A confirmação, expiração e liberação de cada reserva devem ser atômicas com a atualização do pedido e, quando aplicável, da utilização do cupom.

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

 **Decisão aprovada:** distribuir o desconto total proporcionalmente aos subtotais dos itens. Distribuir centavos residuais pelas maiores frações; em empate, priorizar o menor ID de variante em ordem lexical. A soma deve corresponder exatamente ao desconto do pedido, sem exceder o subtotal de cada item.

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

O pedido possui estado inicial aprovado:

```
PENDING_PAYMENT
```

 A entrega inicia em `NOT_SHIPPED`. Pedido sem pagamento após 30 dias corridos passa a `EXPIRED` e não pode mais ser pago. Não implementar outros estados ou políticas comerciais sem aprovação.

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

 Exigir o header `Idempotency-Key`, associado ao cliente e ao conteúdo normalizado da confirmação. Mesma chave/cliente/conteúdo devolve o mesmo pedido; mesma chave com conteúdo diferente retorna conflito. A chave deve ser persistida no servidor.

---

 # 45\. Idempotency Key

 A API exige:

```
Idempotency-Key
```

 O valor deve ser UUID. A chave deve ser:

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

 Após a criação do pedido:

```
marcar carrinho como CONVERTED
associar carrinho ao pedido
preservar os itens históricos
GET posterior cria um novo carrinho vazio
```

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

 # 59\. Contrato da API de checkout

 Endereços usam `GET/POST /api/addresses` e `GET/PATCH /api/addresses/{addressId}`. O cliente autenticado é sempre derivado da sessão; `customerId` enviado no corpo é rejeitado.

 `POST /api/checkout/quotes` recebe `{ "addressId": "..." }`, usa o carrinho do cliente autenticado e retorna uma cotação calculada pelo servidor, contendo `quoteId`, endereço, modalidade `STANDARD`, subtotal, desconto, frete e total em centavos. A cotação não expira por TTL; a confirmação revalida todos os dados.

 `POST /api/checkout/orders` recebe `{ "quoteId": "..." }` e exige `Idempotency-Key` UUID no header. A mesma chave/cliente/conteúdo retorna o mesmo pedido; reutilização com conteúdo diferente retorna HTTP 409. Uma cotação só pode originar um pedido; reenvio da mesma cotação retorna o pedido já criado.

 Ao confirmar, o backend recalcula itens, preços, descontos, frete, endereço e disponibilidade. Se o resultado diferir da cotação, retorna HTTP 409 `QUOTE_CHANGED` com a nova cotação e não cria pedido. O cliente confirma o novo `quoteId` em nova chamada.

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

 Resposta do pedido criado:

```
{
  "orderId": "order-id",
  "status": "PENDING_PAYMENT",
  "subtotalCents": 30000,
  "discountCents": 3000,
  "shippingCents": 2000,
  "totalCents": 29000,
  "shipmentStatus": "NOT_SHIPPED",
  "paymentDueAt": "ISO timestamp 30 days after creation"
}
```

 Os valores são derivados no servidor. O pedido começa `PENDING_PAYMENT`; pagamento real fica fora desta TASK.

---

 # 62\. API de endereços

 Operações necessárias:

```
POST   /api/addresses
GET    /api/addresses
GET    /api/addresses/{addressId}
PATCH  /api/addresses/{addressId}
```

Cadastro, consulta de lista/detalhe e atualização devem verificar a propriedade do cliente. Exclusão de endereço fica fora da TASK-013.

---

 # 63\. API de frete

 A cotação de frete é incluída em `POST /api/checkout/quotes` e sempre retorna uma única opção `STANDARD`.

A cotação utiliza:

```
cart
address
```

 e retorna R$ 20,00 e prazo de 5 dias úteis calculado pelo backend.

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

 Não manter valor antigo silenciosamente; a confirmação de cotação divergente retorna `QUOTE_CHANGED` e exige novo aceite.

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

 # 66\. Expiração de cotação

Não há TTL comercial para a cotação. Ela é revalidada integralmente na confirmação; uma cotação já usada retorna o pedido associado e não cria outro.

---

 # 67\. Estado do checkout

 A cotação deverá possuir entidade persistida própria:

```
CheckoutSession
```

 ela deve possuir ciclo de vida claro.

 Estados:

```
OPEN
CONSUMED
```

 A validade comercial do pedido é controlada separadamente por `paymentDueAt` (30 dias corridos).

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
integração com inventory, incluindo reserva e expiração atômica de estoque
liberação do uso de cupom quando pedido expirar sem pagamento, conforme adendo aprovado à TASK-012
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
[x] Build
[x] Lint (aviso preexistente em `app/layout.tsx`)
[x] Unit tests
[x] Integration tests
[x] API/contract tests
[x] Authorization tests
[x] Security tests
[x] Checkout tests
[x] Address tests
[x] Shipping tests
[x] Pricing tests
[x] Promotion/Coupon regression
[x] Inventory validation
[x] Financial calculation tests
[x] Snapshot tests
[x] Transaction tests
[x] Rollback tests
[x] Concurrency tests
[x] Idempotency tests
[x] Regression tests
[x] Migration tests
[x] Observability validation
[x] Traceability validation
[x] Scope Guard
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

 - [x] checkout implementado;
- [x] endereço implementado;
- [x] validação de propriedade implementada;
- [x] snapshot de endereço implementado;
- [x] cálculo/seleção de frete implementado;
- [x] abstração de frete criada;
- [x] carrinho validado novamente no checkout;
- [x] preços revalidados;
- [x] promoções revalidadas;
- [x] cupons revalidados;
- [x] disponibilidade validada;
- [x] `Order` implementado;
- [x] `OrderItem` implementado;
- [x] `Shipment` implementado;
- [x] estado inicial do pedido definido;
- [x] snapshot comercial preservado;
- [x] total calculado pelo backend;
- [x] transação implementada;
- [x] rollback validado;
- [x] idempotência implementada;
- [x] concorrência validada;
- [x] autorização validada;
- [x] segurança validada;
- [x] observabilidade necessária validada;
- [x] auditoria necessária validada;
- [x] migrations executadas/testadas;
- [x] testes unitários passam;
- [x] testes de integração passam;
- [x] testes de API passam;
- [x] testes financeiros passam;
- [x] testes de autorização passam;
- [x] testes de concorrência passam;
- [x] testes de idempotência passam;
- [x] regressão das TASK-011 e TASK-012 passa;
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

 # 97\. Relatório de execução

```
TASK: TASK-013
TÍTULO: Checkout, endereço e frete
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: DONE
BRANCH: feature/TASK-013-checkout-address-shipping
COMMITS: nenhum (alterações ainda não commitadas)

DEPENDÊNCIA:
- TASK-012: DONE

IMPLEMENTADO (PRIMARY):
- Endereços de cliente com validação e controle de propriedade.
- Cotação local STANDARD: R$ 20,00 e cinco dias úteis, de segunda a sexta.
- Cotação e criação de pedido com preços, descontos, frete e total calculados no servidor.
- Alocação proporcional do desconto entre os itens; restos de centavos distribuídos pelas maiores frações, com desempate pelo menor ID de variante em ordem lexical; soma igual ao desconto total.
- Snapshots de endereço, itens, valores e cupom no pedido.
- Reserva transacional de estoque por 30 dias, expiração do pedido e liberação de estoque e uso do cupom.
- Conversão do carrinho e idempotência por cliente e Idempotency-Key.
- Auditoria, migrations, testes unitários, de integração e de API.

ALTERAÇÃO INCIDENTAL:
- `next-env.d.ts`: referências de tipos de rotas geradas pelo build do Next.js.

TESTES E QUALITY GATES:
- `npm run quality`: PASS; 28 arquivos de teste e 79 testes aprovados; typecheck, formatação e build aprovados.
- Lint: PASS com aviso preexistente `react(only-export-components)` em `app/layout.tsx`.
- Migrations 008–010 aplicadas duas vezes: PASS.
- Build: PASS. Lint: PASS. Unit: PASS. Integration: PASS. API/Contract: PASS.
- Authorization: PASS. Security: PASS. Checkout: PASS. Address: PASS. Shipping: PASS.
- Pricing e rateio financeiro: PASS. Regressão de cupom/promoção: PASS. Inventory: PASS.
- Snapshot: PASS. Transaction e rollback: PASS. Concurrency: PASS. Idempotency: PASS.
- Restrições, índices e invariantes de ownership e cálculo no servidor: PASS.

SEGURANÇA E PAGAMENTO:
- Preço, desconto, frete e total são recalculados/controlados no servidor.
- Testes de propriedade e isolamento entre clientes aprovados; nenhum bypass de autorização identificado.
- Gateway, captura e webhook não implementados; pedido permanece preparado para integração da TASK-014.

PROBLEMAS/PENDÊNCIAS:
- Nenhum bloqueio da TASK-013. Permanece o aviso de lint preexistente em `app/layout.tsx`.

RASTREABILIDADE:
- RF-020 a RF-023, RN-011, RN-012 e UC-006: implementados nos módulos `checkout`, `shipping`, integrações de `cart`, `coupons` e `inventory`, migrations 008–010 e testes `checkout-domain`, `checkout-flow` e `checkout-api-flow`.

SCOPE GUARD:
- ALLOWED_CHANGES: PASS
- INCIDENTAL (`next-env.d.ts`): PASS, gerado pelo build e necessário aos tipos de rotas.
- FORBIDDEN_CHANGES: PASS
- Scope Creep: nenhum

TASKS.md: atualizado; TASK-014 permanece BLOCKED e não foi iniciada.
CONCLUSÃO: critérios de aceitação e gates aplicáveis aprovados.
DEFINITION OF DONE: PASS
ESTADO FINAL: DONE
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
