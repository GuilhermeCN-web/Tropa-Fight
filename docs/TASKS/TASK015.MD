# TASK-015 — Pedidos, histórico e rastreamento

 **Status inicial:** `BLOCKED`\
 **Phase/Priority:** `PHASE-03 / HIGH`\
 **Dependência:** `TASK-014`\
 **Dependências obrigatórias para execução:** `TASK-014 = DONE` e Definition of Ready satisfeita\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 ## 1\. Objetivo

 Disponibilizar o fluxo de consulta e acompanhamento de pedidos do Tropa Fight, permitindo que clientes visualizem seus próprios pedidos, seus detalhes, estados e informações de rastreamento, enquanto usuários administrativos acessam os pedidos conforme suas permissões.

 A TASK deve consolidar a camada de consulta e apresentação do ciclo de vida do pedido já criado pelas etapas anteriores.

 O foco é:

 - histórico de pedidos do cliente;
- detalhes do pedido;
- estados do pedido;
- transições válidas;
- autorização de acesso;
- informações de pagamento relevantes;
- informações de entrega;
- rastreamento;
- visão administrativa autorizada;
- consistência entre pedido, pagamento e envio;
- testes de autorização e máquina de estados.

 Não faz parte desta TASK inventar políticas de cancelamento, devolução ou reembolso.

---

 ## 2\. Contexto

 As TASKs anteriores entregam:

```
TASK-011
Carrinho e cálculo comercial
        ↓
TASK-012
Cupons e promoções
        ↓
TASK-013
Checkout + endereço + frete + Order
        ↓
TASK-014
Pagamento + gateway + webhook + idempotência
        ↓
TASK-015
Pedidos + histórico + rastreamento
```

 A responsabilidade desta TASK é tornar o pedido consultável e acompanhável de forma consistente.

 Fluxo conceitual:

```
Cliente
   |
   v
Customer Area
   |
   +----> Histórico
   |
   +----> Detalhes do pedido
   |
   +----> Status
   |
   +----> Pagamento
   |
   +----> Entrega
   |
   +----> Rastreamento
```

 Para administração:

```
Admin
  |
  v
Orders
  |
  +--> Consulta
  +--> Filtros
  +--> Detalhes
  +--> Status autorizado
  +--> Rastreamento
```

---

 ## 3\. Referências

 ### Requisitos relacionados

 - `RF-026`
- `RF-027`
- `RF-028`
- `RN-014`
- `UC-007`
- `UC-008`

 ### Dependência

```
TASK-014
    ↓
TASK-015
    ↓
TASK-016
```

---

 # 4\. Definition of Ready

 A TASK só pode entrar em `IN_PROGRESS` quando:

 - [ ] `TASK-014` está em `DONE`.
- [ ] `Order` está persistido e funcional.
- [ ] `OrderItem` está persistido.
- [ ] pagamento possui estado consistente.
- [ ] fluxo de checkout está funcional.
- [ ] regras de autorização de cliente estão disponíveis.
- [ ] roles/permissões administrativas estão disponíveis.
- [ ] estados de pedido estão definidos.
- [ ] transições válidas estão definidas.
- [ ] informações de entrega disponíveis no pedido estão definidas.
- [ ] estratégia de rastreamento está definida.
- [ ] não existe política de cancelamento pendente sendo necessária para esta TASK.
- [ ] não existe política de devolução pendente sendo necessária para esta TASK.
- [ ] não existe decisão comercial pendente que precise ser inventada durante a implementação.

 Se qualquer requisito essencial estiver indefinido, a TASK deve permanecer `BLOCKED`.

---

 # 5\. Entregáveis

 A implementação deve produzir, conforme a arquitetura existente:

```
Order
OrderItem
OrderStatus
OrderStatusTransition
OrderHistory / OrderEvent
OrderQuery
OrderTracking
TrackingEvent
CustomerOrderService
AdminOrderService
```

 Os nomes concretos devem respeitar os padrões já existentes.

 Também devem ser entregues:

 - APIs de pedidos;
- consultas do cliente;
- consultas administrativas;
- detalhes do pedido;
- histórico;
- status;
- rastreamento;
- autorização;
- testes unitários;
- testes de integração;
- testes de API;
- testes de máquina de estados;
- testes de autorização;
- documentação;
- atualização de `TASKS.md`;
- relatório de execução.

---

 # 6\. Princípio central de segurança

 Um cliente nunca pode consultar um pedido apenas porque conhece seu identificador.

 Não é suficiente:

```
GET /orders/{id}
```

 e verificar somente:

```
order exists
```

 É obrigatório verificar a relação:

```
authenticated user
        ↓
customer
        ↓
order.customerId
```

 Resultado esperado:

```
Cliente A → Pedido A = permitido
Cliente A → Pedido B = proibido
Cliente não autenticado → Pedido A = proibido
```

---

 # 7\. Modelo de pedido

 A estrutura existente de `Order` deve ser preservada.

 Conceitualmente:

```
Order
├── id
├── customerId
├── status
├── paymentStatus
├── subtotal
├── discount
├── shipping
├── total
├── currency
├── addressSnapshot
├── createdAt
├── updatedAt
└── ...
```

 Os nomes reais dependem da implementação das TASKs anteriores.

---

 # 8\. Imutabilidade do pedido histórico

 Após a confirmação da compra, determinadas informações representam o estado histórico da transação.

 Especialmente:

```
preço
quantidade
desconto
frete
total
produto comprado
dados necessários do endereço no momento da compra
```

 A consulta histórica não deve depender exclusivamente do preço atual do catálogo.

 Exemplo:

```
Preço no momento da compra:
R$ 100,00

Preço atual:
R$ 120,00
```

 O pedido histórico deve continuar apresentando:

```
R$ 100,00
```

 quando esse for o valor efetivamente registrado na compra.

 A TASK não deve modificar o catálogo para resolver essa necessidade.

---

 # 9\. Máquina de estados do pedido

 Os estados devem ser definidos explicitamente.

 A implementação deve utilizar somente os estados aprovados no domínio.

 Exemplo conceitual:

```
PENDING
   |
   +--> CONFIRMED
   |       |
   |       +--> PROCESSING
   |               |
   |               +--> SHIPPED
   |                       |
   |                       +--> DELIVERED
   |
   +--> CANCELLED
```

 A nomenclatura real deve seguir o domínio aprovado.

---

 # 10\. Transições

 Toda transição deve ser validada.

 Exemplo conceitual:

```
PENDING
  → CONFIRMED
  → CANCELLED

CONFIRMED
  → PROCESSING
  → CANCELLED

PROCESSING
  → SHIPPED

SHIPPED
  → DELIVERED
```

 Transições inválidas devem ser rejeitadas.

 Exemplos:

```
DELIVERED → PENDING
DELIVERED → PROCESSING
CANCELLED → CONFIRMED
CANCELLED → SHIPPED
```

 não devem ocorrer salvo regra explícita previamente aprovada.

---

 # 11\. Responsabilidade sobre transições

 A TASK deve diferenciar:

```
consulta
```

 de:

```
mutação
```

 Cliente:

```
GET histórico
GET detalhes
GET status
GET rastreamento
```

 Administrador:

```
consulta
operações autorizadas
```

 Alterações de estado devem existir somente quando já forem necessárias pelo contrato aprovado.

 A TASK não deve criar novas operações administrativas simplesmente para "completar" o painel.

---

 # 12\. Histórico de pedidos

 O cliente deve conseguir consultar seus pedidos.

 Exemplo:

```
GET /orders
```

 A resposta deve suportar:

 - paginação;
- ordenação definida;
- status;
- data;
- identificador do pedido;
- informações resumidas.

 Exemplo conceitual:

```
Pedido #1001
Status: Enviado
Total: R$ 249,90
Data: 2026-09-20
```

 O histórico não deve retornar informações internas administrativas desnecessárias.

---

 # 13\. Paginação

 A paginação deve ser determinística.

 Evitar resultados inconsistentes quando registros possuem a mesma data.

 Exemplo:

```
ORDER BY createdAt DESC, id DESC
```

 ou equivalente.

 A estratégia concreta deve seguir o padrão da aplicação.

 Testar:

```
página 1
página 2
última página
página vazia
```

---

 # 14\. Detalhes do pedido

 Endpoint conceitual:

```
GET /orders/{id}
```

 Deve retornar somente informações permitidas ao usuário.

 Informações possíveis:

```
identificador
data
status
itens
quantidades
preços históricos
descontos
frete
total
endereço de entrega permitido
status de pagamento
status de entrega
rastreamento
```

 Dados internos ou sensíveis devem ser omitidos.

---

 # 15\. Autorização do cliente

 A regra principal:

```
order.customerId === authenticatedCustomer.id
```

 Somente então o acesso é permitido.

 Testar explicitamente:

```
Cliente A → Pedido A → 200
Cliente A → Pedido B → 403/404 conforme estratégia aprovada
Cliente B → Pedido A → 403/404 conforme estratégia aprovada
Usuário não autenticado → Pedido A → 401
```

 A resposta para recursos inexistentes versus não autorizados deve seguir a política de segurança já adotada pela aplicação.

 Não introduzir uma nova política sem necessidade.

---

 # 16\. Autorização administrativa

 Administradores devem acessar pedidos conforme suas permissões.

 Exemplo:

```
Customer
    → somente seus pedidos

Admin autorizado
    → pedidos permitidos pela role

Admin não autorizado
    → acesso negado
```

 Não criar novos roles.

 Não alterar RBAC existente.

---

 # 17\. Status de pagamento

 O pedido pode apresentar uma representação apropriada do estado de pagamento.

 Exemplo:

```
Payment:
APPROVED

Order:
CONFIRMED
```

 Ou:

```
Payment:
FAILED

Order:
PENDING
```

 A regra exata deve respeitar o contrato implementado na TASK-014.

 Esta TASK não deve duplicar a lógica do gateway.

---

 # 18\. Rastreamento

 O pedido deve expor as informações de rastreamento disponíveis.

 Modelo conceitual:

```
OrderTracking
├── carrier
├── trackingCode
├── status
├── estimatedDelivery
└── events[]
```

 Eventos:

```
TrackingEvent
├── code
├── description
├── location
├── occurredAt
└── ...
```

 Somente informações efetivamente disponíveis devem ser apresentadas.

 Não inventar:

 - código de rastreio;
- transportadora;
- localização;
- data estimada;
- evento de entrega.

---

 # 19\. Rastreamento sem integração externa

 Se a integração logística real ainda não estiver aprovada, a TASK deve implementar somente a abstração e os dados necessários previstos no contrato.

 Exemplo:

```
TrackingProvider
        |
        +---- Approved Adapter
```

 Não implementar uma integração externa real sem aprovação.

 Se o rastreamento for inicialmente interno:

```
Order
   ↓
Shipment
   ↓
Tracking events
```

 deve ser suficiente para atender ao escopo aprovado.

---

 # 20\. Histórico de estados

 Toda alteração relevante de estado deve possuir rastreabilidade.

 Exemplo:

```
Order #1001

PENDING
  ↓
CONFIRMED
  ↓
PROCESSING
  ↓
SHIPPED
```

 O sistema deve conseguir determinar:

 - estado atual;
- estado anterior quando aplicável;
- momento da transição;
- origem da transição;
- ator, quando aplicável.

---

 # 21\. Auditoria

 Operações administrativas críticas relacionadas a pedidos devem ser auditáveis conforme a infraestrutura criada anteriormente.

 Exemplo:

```
order.status.changed
```

 Contexto mínimo possível:

```
orderId
previousStatus
newStatus
actorId
timestamp
correlationId
```

 Nunca registrar dados sensíveis desnecessários.

---

 # 22\. Integridade de estado

 A aplicação não deve permitir que o pedido fique em um estado incompatível.

 Exemplos:

```
Pedido DELIVERED
+
Pagamento FAILED
```

 não deve surgir como resultado de uma transição inválida.

 Outro exemplo:

```
Pedido CANCELLED
→ SHIPPED
```

 deve ser rejeitado.

 As regras devem ser centralizadas em serviço/domínio apropriado, evitando validações divergentes entre endpoints.

---

 # 23\. Relação com pagamento

 A TASK-015 deve consumir o estado de pagamento produzido pela TASK-014.

 Não deve:

 - consultar diretamente o SDK do gateway;
- recriar lógica de webhook;
- duplicar PaymentGateway;
- alterar estado de pagamento diretamente;
- criar uma segunda fonte de verdade para pagamento.

 Fluxo:

```
Payment
   ↓
Order
   ↓
Customer/Admin View
```

---

 # 24\. Relação com estoque

 Esta TASK não deve recalcular ou manipular estoque.

 Se uma informação de estoque for necessária para exibição, deve ser somente leitura e conforme contrato aprovado.

 Não implementar:

```
reserve stock
release stock
adjust stock
```

 nesta TASK.

---

 # 25\. API

 Os contratos reais devem seguir o padrão do projeto.

 Endpoints conceituais:

```
GET /orders
GET /orders/{id}
GET /orders/{id}/tracking
```

 Se houver operações administrativas já previstas:

```
GET /admin/orders
GET /admin/orders/{id}
```

 Não criar endpoints não necessários.

---

 # 26\. Contrato de listagem

 A listagem deve:

 - exigir autenticação;
- restringir ao cliente autenticado;
- ser paginada;
- possuir ordenação determinística;
- retornar dados resumidos;
- não vazar dados de outros clientes.

 Exemplo conceitual:

```
{
  "items": [
    {
      "id": "order-1001",
      "status": "SHIPPED",
      "total": 249.90,
      "createdAt": "..."
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```

 O formato final deve seguir os contratos da aplicação.

---

 # 27\. Contrato de detalhes

 Exemplo conceitual:

```
{
  "id": "order-1001",
  "status": "SHIPPED",
  "items": [],
  "subtotal": 220.00,
  "discount": 10.00,
  "shipping": 39.90,
  "total": 249.90,
  "payment": {
    "status": "APPROVED"
  },
  "tracking": {}
}
```

 O contrato final deve ser compatível com a implementação existente.

---

 # 28\. Contrato de rastreamento

 Exemplo:

```
{
  "trackingCode": "ABC123",
  "carrier": "approved-provider",
  "status": "IN_TRANSIT",
  "events": [
    {
      "status": "POSTED",
      "occurredAt": "..."
    }
  ]
}
```

 Não preencher campos sem dados reais disponíveis.

---

 # 29\. Segurança de dados

 Verificar:

 - cliente só acessa seus pedidos;
- endereço exibido somente quando permitido;
- informações de pagamento limitadas ao necessário;
- nenhum dado de cartão retornado;
- tokens não retornados;
- dados internos administrativos não expostos;
- identificadores internos não expostos sem necessidade;
- endpoints administrativos protegidos.

---

 # 30\. Testes unitários

 Cobrir:

 - máquina de estados;
- transições válidas;
- transições inválidas;
- autorização do cliente;
- autorização administrativa;
- construção do histórico;
- paginação;
- ordenação;
- transformação de dados;
- rastreamento;
- tratamento de pedido inexistente;
- tratamento de pedido pertencente a outro cliente.

---

 # 31\. Testes de integração

 Cobrir no mínimo:

```
cliente lista seus pedidos
cliente abre seu pedido
cliente tenta abrir pedido de outro cliente
admin autorizado consulta pedido
admin não autorizado recebe bloqueio
pedido inexistente
pedido sem rastreamento
pedido com rastreamento
pedido com múltiplos eventos
pedido com pagamento aprovado
pedido com pagamento falho
transição válida
transição inválida
```

---

 # 32\. Testes de API

 ### Histórico

```
GET /orders
```

 Validar:

 - `200`;
- paginação;
- ordenação;
- isolamento por cliente.

 ### Detalhes

```
GET /orders/{id}
```

 Validar:

 - autenticação;
- autorização;
- dados históricos;
- estado;
- pagamento;
- entrega.

 ### Rastreamento

```
GET /orders/{id}/tracking
```

 Validar:

 - autorização;
- ausência de rastreamento;
- rastreamento disponível;
- eventos ordenados corretamente.

---

 # 33\. Matriz mínima de testes

 | Cenário | Resultado esperado |
| --- | --- |
| cliente autenticado lista pedidos | somente seus pedidos |
| cliente sem pedidos | lista vazia |
| cliente acessa próprio pedido | permitido |
| cliente acessa pedido de outro cliente | bloqueado |
| usuário não autenticado | bloqueado |
| admin autorizado consulta pedido | permitido |
| admin sem permissão | bloqueado |
| pedido inexistente | resposta conforme contrato |
| pedido com pagamento aprovado | status consistente |
| pedido com pagamento falho | status consistente |
| pedido sem tracking | resposta válida sem inventar dados |
| pedido com tracking | dados apresentados |
| transição válida | permitida |
| transição inválida | rejeitada |
| pedido entregue regressando | rejeitado |
| pedido cancelado avançando | rejeitado |
| paginação | consistente |
| ordenação | determinística |
| histórico de preço | preservado |
| dados sensíveis | não expostos |

---

 # 34\. Paginação e performance

 As consultas devem evitar:

```
N+1 queries
```

 especialmente em:

```
orders
→ items
→ tracking
→ events
```

 Deve ser avaliada a estratégia de:

 - joins;
- eager loading controlado;
- consultas específicas;
- projeções;
- paginação no banco.

 Não realizar otimizações especulativas fora do escopo.

---

 # 35\. Ordenação do histórico

 A ordenação deve ser definida e documentada.

 Exemplo:

```
createdAt DESC
id DESC
```

 O segundo critério garante determinismo quando duas ordens possuem a mesma data.

---

 # 36\. Rastreamento e ordenação de eventos

 Os eventos de rastreamento devem possuir ordenação determinística.

 Preferencialmente:

```
occurredAt ASC
id ASC
```

 ou o padrão definido pelo domínio.

 Não assumir que a ordem de armazenamento é suficiente.

---

 # 37\. Tratamento de inconsistências

 Caso existam dados inconsistentes entre:

```
Order
Payment
Shipment
Tracking
```

 a API não deve inventar uma correção silenciosa.

 O comportamento deve ser:

```
detectar
→ registrar
→ retornar estado seguro
```

 ou conforme política operacional já definida.

 Correções de dados fora do escopo devem ser registradas como bloqueio/pendência.

---

 # 38\. ALLOWED\_CHANGES

 Permitido alterar:

```
módulos orders
módulos customer-area
módulos shipping/tracking necessários
consultas de pedidos
APIs de pedidos
serializadores/DTOs de pedidos
máquina de estados do pedido
persistência de histórico de pedidos
persistência de tracking quando necessária
testes
documentação
configuração diretamente relacionada
TASKS.md
```

 Alterações em outras áreas somente quando diretamente causadas e indispensáveis.

---

 # 39\. FORBIDDEN\_CHANGES

 É proibido:

 - inventar política de cancelamento;
- inventar política de devolução;
- inventar política de reembolso;
- alterar regras de pagamento da TASK-014;
- alterar gateway;
- criar novo provedor de pagamento;
- alterar preços;
- alterar promoções;
- alterar catálogo;
- manipular estoque;
- criar ERP;
- criar funcionalidades sociais;
- criar notificações novas fora do escopo;
- alterar RBAC sem decisão;
- criar novos papéis administrativos;
- criar integração logística externa sem aprovação;
- alterar arquitetura sem ADR;
- modificar requisitos comerciais;
- iniciar automaticamente `TASK-016`.

---

 # 40\. Scope Guard

 Toda alteração deve responder positivamente a pelo menos uma destas categorias:

```
[ ] Histórico de pedidos
[ ] Detalhes de pedidos
[ ] Status do pedido
[ ] Máquina de estados
[ ] Rastreamento
[ ] Autorização de pedidos
[ ] Consulta administrativa de pedidos
[ ] Testes diretamente relacionados
[ ] Documentação diretamente relacionada
```

 Caso contrário:

```
NÃO ALTERAR
```

---

 # 41\. Estratégia de implementação

 Sequência recomendada:

```
1. Confirmar TASK-014 = DONE
        ↓
2. Mapear Order/OrderItem/Payment/Shipment
        ↓
3. Definir máquina de estados
        ↓
4. Definir regras de autorização
        ↓
5. Implementar consulta de histórico
        ↓
6. Implementar detalhes do pedido
        ↓
7. Implementar histórico/status
        ↓
8. Implementar tracking
        ↓
9. Implementar consultas administrativas previstas
        ↓
10. Garantir isolamento por cliente
        ↓
11. Implementar validação de transições
        ↓
12. Testes unitários
        ↓
13. Testes de integração
        ↓
14. Testes de autorização
        ↓
15. Testes de API
        ↓
16. Validar performance das consultas
        ↓
17. Build
        ↓
18. Lint
        ↓
19. Testes aplicáveis
        ↓
20. Atualizar documentação
        ↓
21. Atualizar rastreabilidade
        ↓
22. Atualizar TASKS.md
        ↓
23. Produzir relatório
        ↓
24. Parar e aguardar autorização
```

---

 # 42\. Quality Gates

 ## Build

```
[ ] Build passa
[ ] Sem erros de compilação
[ ] Migrations aplicam corretamente
```

 ## Lint

```
[ ] Lint passa
[ ] Sem warnings críticos introduzidos
```

 ## Testes

```
[ ] Unitários passam
[ ] Integração passa
[ ] API passa
[ ] Autorização passa
[ ] Máquina de estados passa
[ ] Tracking passa
```

 ## Segurança

```
[ ] Cliente não acessa pedido de outro cliente
[ ] Endpoints administrativos protegidos
[ ] Dados sensíveis não são expostos
[ ] Informações de pagamento limitadas
[ ] Nenhuma credencial/token é retornado
```

 ## Integridade

```
[ ] Estados válidos
[ ] Estados inválidos rejeitados
[ ] Histórico consistente
[ ] Pagamento consistente
[ ] Rastreamento consistente
[ ] Preços históricos preservados
```

 ## Performance

```
[ ] Sem N+1 crítico
[ ] Paginação aplicada
[ ] Ordenação determinística
[ ] Consultas relevantes avaliadas
```

 ## Rastreabilidade

```
[ ] RF-026 coberto
[ ] RF-027 coberto
[ ] RF-028 coberto
[ ] RN-014 coberto
[ ] UC-007 coberto
[ ] UC-008 coberto
[ ] Testes associados aos critérios
```

 ## Escopo

```
[ ] ALLOWED_CHANGES respeitado
[ ] FORBIDDEN_CHANGES não violado
[ ] Scope Guard validado
[ ] Nenhum Scope Creep
[ ] Alterações incidentais justificadas
```

---

 # 43\. Definition of Done específica

 A TASK-015 somente pode ser marcada como `DONE` quando:

 - [ ] Cliente consegue consultar seu histórico de pedidos.
- [ ] Cliente consegue consultar detalhes de seus pedidos.
- [ ] Cliente não consegue acessar pedidos de terceiros.
- [ ] Administradores acessam pedidos conforme RBAC existente.
- [ ] Estados do pedido estão definidos.
- [ ] Transições válidas estão implementadas.
- [ ] Transições inválidas são rejeitadas.
- [ ] Histórico de estado possui rastreabilidade adequada.
- [ ] Informações históricas da compra são preservadas.
- [ ] Estado de pagamento é apresentado de forma consistente.
- [ ] Rastreamento é apresentado quando disponível.
- [ ] Ausência de rastreamento é tratada sem inventar dados.
- [ ] Eventos de rastreamento possuem ordenação determinística.
- [ ] Paginação é consistente.
- [ ] Ordenação é determinística.
- [ ] Consultas não apresentam N+1 crítico.
- [ ] Dados sensíveis não são expostos.
- [ ] Testes unitários passam.
- [ ] Testes de integração passam.
- [ ] Testes de API passam.
- [ ] Testes de autorização passam.
- [ ] Build passa.
- [ ] Lint passa.
- [ ] Documentação está atualizada.
- [ ] Rastreabilidade está atualizada.
- [ ] `TASKS.md` está atualizado.
- [ ] Relatório de execução foi produzido.
- [ ] Nenhum `FORBIDDEN_CHANGE` ocorreu.
- [ ] Nenhum Scope Creep ocorreu.

---

 # 44\. Critérios de falha

 A TASK não pode ser marcada como `DONE` se:

```
cliente consegue acessar pedido de terceiro
        OU
transição inválida é aceita
        OU
pedido histórico apresenta preço incorreto
        OU
status de pagamento é contraditório
        OU
tracking é inventado
        OU
endpoint administrativo permite acesso indevido
        OU
teste obrigatório falha
        OU
build/lint falha
        OU
rastreabilidade está incompleta
        OU
Scope Guard foi violado
```

 Nessas situações, registrar o problema e utilizar:

```
FAILED
```

 quando houver falha de implementação/teste, ou:

```
BLOCKED
```

 quando houver dependência ou decisão externa impedindo a conclusão.

---

 # 45\. Relatório de execução

 Ao finalizar:

```
TASK: TASK-015
STATUS: DONE | FAILED | BLOCKED

Resumo:
<resumo objetivo>

Implementado:
- ...
- ...
- ...

Pedidos:
- histórico: PASS/FAIL
- detalhes: PASS/FAIL
- estados: PASS/FAIL
- transições: PASS/FAIL

Autorização:
- cliente: PASS/FAIL
- isolamento entre clientes: PASS/FAIL
- admin/RBAC: PASS/FAIL

Rastreamento:
- consulta: PASS/FAIL
- eventos: PASS/FAIL
- ordenação: PASS/FAIL

Integração:
- Payment: PASS/FAIL
- Order: PASS/FAIL
- Shipment/Tracking: PASS/FAIL

Testes:
- unit: PASS/FAIL
- integration: PASS/FAIL
- API: PASS/FAIL
- authorization: PASS/FAIL
- state machine: PASS/FAIL

Quality Gates:
- build: PASS/FAIL
- lint: PASS/FAIL
- testes aplicáveis: PASS/FAIL

Rastreabilidade:
- RF-026: ...
- RF-027: ...
- RF-028: ...
- RN-014: ...
- UC-007: ...
- UC-008: ...

Scope Guard:
- PASS/FAIL

Alterações incidentais:
- nenhuma
ou
- <justificativa>

Bloqueios:
- nenhum
ou
- <bloqueio>

Estado final:
<DONE | FAILED | BLOCKED>

Próxima TASK:
TASK-016 — somente após autorização explícita.
```

---

 # 46\. Estado final esperado

 Com todos os Gates aprovados:

```
TASK-015
    |
    v
DONE
```

 A conclusão da TASK-015 **não inicia automaticamente** a TASK-016.

 Após concluir:

```
TASK-015 = DONE
```
