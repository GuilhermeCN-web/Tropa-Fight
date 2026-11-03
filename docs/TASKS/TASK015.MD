# TASK-015 — Pedidos, histórico e rastreamento

 **Status inicial:** `BLOCKED`\
 **Status atual:** `DONE` (2026-11-03)\
 **Phase/Priority:** `PHASE-03 / HIGH`\
 **Dependência:** `TASK-014`\
 **Dependências obrigatórias para execução:** `TASK-014 = DONE` e Definition of Ready satisfeita\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 ## 1\. Objetivo

 Disponibilizar o fluxo de consulta e acompanhamento de pedidos do Tropa Fight, permitindo que clientes visualizem seus próprios pedidos, seus detalhes, estados e informações de rastreamento, enquanto usuários administrativos acessam os pedidos conforme suas permissões.

 A TASK deve consolidar a camada de consulta e apresentação do ciclo de vida do pedido já criado pelas etapas anteriores.

 O escopo aprovado para esta execução é somente de consulta. O foco é:

 - histórico de pedidos do cliente;
- detalhes do pedido;
- estados do pedido;
- consistência dos estados existentes, sem novas transições;
- autorização de acesso;
- informações de pagamento relevantes;
- informações de entrega;
- rastreamento;
- consulta administrativa somente leitura pelo papel `GENERAL_ADMIN`;
- consistência entre pedido, pagamento e envio;
- testes de autorização e consistência dos estados persistidos.

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
  +--> Status consultado (somente leitura)
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

 - [x] `TASK-014` está em `DONE`.
- [x] `Order` está persistido e funcional.
- [x] `OrderItem` está persistido.
- [x] pagamento possui estado consistente.
- [x] fluxo de checkout está funcional.
- [x] regras de autorização de cliente estão disponíveis.
- [x] papel administrativo `GENERAL_ADMIN` está disponível para consulta somente leitura.
- [x] estados de pedido exibidos estão definidos: `PENDING_PAYMENT`, `PAYMENT_CONFIRMED` e `EXPIRED`.
- [x] novas transições de estado estão fora do escopo desta consulta.
- [x] dados de entrega existentes em `Shipment` estão definidos.
- [x] estratégia de rastreamento está definida: exibir somente dados persistidos, sem inventar tracking.
- [x] políticas de cancelamento e devolução não são necessárias para esta TASK.
- [x] decisões comerciais necessárias foram aprovadas e registradas em `docs/planning/answered-questions.md`.

 Se qualquer requisito essencial estiver indefinido, a TASK deve permanecer `BLOCKED`.

 **Prontidão (2026-11-03): PASS.** TASK-014 está `DONE` e seus artefatos Order/Payment/Shipment foram verificados. Estados consultados, acesso exclusivo de leitura por `GENERAL_ADMIN`, ausência de novas transições e ausência de dados fictícios de rastreamento foram aprovados e registrados em `docs/planning/answered-questions.md`. Branch `feature/TASK-015-orders-history-tracking`; transições `BLOCKED → READY → IN_PROGRESS`.

 **Execução (2026-11-03): DONE.** Transições `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE`. Implementados endpoints de histórico, detalhes, consulta administrativa e entrega/rastreamento somente leitura. GATE-001 (prontidão), GATE-002 (planejamento), GATE-003 (implementação) e GATE-004 (validação final) aprovados; relatório abaixo.

---

 # 5\. Entregáveis

 A implementação deve produzir, conforme a arquitetura existente:

```
Order
OrderItem
OrderStatus (projeção de estados persistidos)
OrderQuery
CustomerOrderService
AdminOrderService
```

 Os nomes concretos devem respeitar os padrões já existentes.

 Também devem ser entregues:

 - APIs de pedidos;
- consultas do cliente;
- consultas administrativas somente leitura para `GENERAL_ADMIN`;
- detalhes do pedido;
- histórico;
- status;
- rastreamento;
- autorização;
- testes unitários;
- testes de integração;
- testes de API;
- testes de consistência dos estados persistidos;
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

 # 9\. Estados de pedido consultados

 A TASK-015 somente apresentará os estados já produzidos pelos fluxos anteriores:

 - `PENDING_PAYMENT`: pedido criado e aguardando pagamento;
- `PAYMENT_CONFIRMED`: pagamento aprovado pela TASK-014;
- `EXPIRED`: pedido expirado sem pagamento.

 `PAYMENT_CONFIRMED` é o nome persistido aprovado em ADR-008/TASK-014. Os ciclos de pagamento e entrega continuam separados: o estado financeiro vem de `Payment`, e o estado logístico vem de `Shipment`.

 Nenhum estado `PROCESSING`, `SHIPPED` ou `DELIVERED` será criado ou atribuído nesta TASK. Não serão adicionados endpoints de mutação nem transições manuais ou automáticas. Transições comerciais/logísticas posteriores dependem de decisão e escopo próprios.

---

 # 10\. Consistência de estados

 As consultas devem apresentar os valores persistidos por checkout, pagamento e expiração sem recalculá-los ou alterá-los. Dados inconsistentes entre `Order`, `Payment` e `Shipment` não devem ser corrigidos silenciosamente; retornar resposta segura e registrar o problema conforme os mecanismos já disponíveis.

---

 # 11\. Responsabilidade de consulta

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

 Administrador `GENERAL_ADMIN`:

```
GET histórico administrativo
GET detalhes administrativos
```

 Todas as operações desta TASK são somente leitura. O papel é verificado no servidor; nenhuma permissão ou papel RBAC será criado ou alterado.

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

 Somente o papel existente `GENERAL_ADMIN` pode consultar todos os pedidos, em modo somente leitura. Nenhuma permissão ou papel RBAC será criado ou alterado.

 Exemplo:

```
Customer
    → somente seus pedidos

GENERAL_ADMIN (somente leitura)
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

 O pedido deve expor somente informações de envio/rastreamento que já estejam persistidas.

 Modelo conceitual:

```
Shipment
├── status
├── method
├── shippingCents
└── estimatedDeliveryDate
```

O esquema atual não possui transportadora, código de rastreio ou eventos. Esses campos não serão persistidos nem inventados nesta TASK.

 Não inventar:

 - código de rastreio;
- transportadora;
- localização;
- data estimada;
- evento de entrega.

---

 # 19\. Rastreamento sem integração externa

 Se a integração logística real ainda não estiver aprovada, a TASK deve consultar somente os dados já existentes, sem implementar um novo adaptador, persistir eventos ou preencher dados fictícios.

 Exemplo:

```
TrackingProvider
        |
        +---- Approved Adapter
```

 Não implementar uma integração externa real sem aprovação.

 Nesta execução, a informação de entrega consiste somente nos dados persistidos:

```
Order
   ↓
Shipment (dados persistidos)
```

 A ausência de tracking é uma resposta válida.

---

 # 20\. Histórico de estados

Esta TASK não altera estados nem cria um novo histórico de transições. As consultas apresentam o estado atual e os dados persistidos pelos fluxos de checkout, pagamento e expiração; os registros de auditoria existentes continuam sendo a fonte de rastreabilidade dessas operações.

---

 # 21\. Auditoria

Como a TASK-015 não inclui mutações administrativas, não cria eventos de auditoria de mudança de estado. As respostas de consulta não devem expor dados sensíveis desnecessários.

---

 # 22\. Integridade de estado

As consultas devem preservar e apresentar separadamente os estados persistidos de pedido, pagamento e envio. Nenhum estado novo será atribuído nesta TASK; dados inconsistentes não serão corrigidos silenciosamente.

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

Os endpoints administrativos devem exigir `GENERAL_ADMIN` no servidor; não haverá endpoints administrativos de mutação.

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
      "status": "PAYMENT_CONFIRMED",
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
  "status": "PAYMENT_CONFIRMED",
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
  "shipment": { "status": "NOT_SHIPPED" },
  "tracking": null
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

- consistência de estados persistidos;
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
GENERAL_ADMIN consulta pedido em modo somente leitura
outros papéis administrativos recebem bloqueio
pedido inexistente
pedido sem rastreamento
pedido com pagamento aprovado
pedido com pagamento falho
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
- nenhum código, transportadora ou evento fabricado.

---

 # 33\. Matriz mínima de testes

 | Cenário | Resultado esperado |
| --- | --- |
| cliente autenticado lista pedidos | somente seus pedidos |
| cliente sem pedidos | lista vazia |
| cliente acessa próprio pedido | permitido |
| cliente acessa pedido de outro cliente | bloqueado |
| usuário não autenticado | bloqueado |
| GENERAL_ADMIN consulta pedido | permitido, somente leitura |
| papel administrativo diferente de GENERAL_ADMIN | bloqueado |
| pedido inexistente | resposta conforme contrato |
| pedido com pagamento aprovado | status consistente |
| pedido com pagamento falho | status consistente |
| pedido sem tracking | resposta válida sem inventar dados |
| tracking não persistido | `null`/ausente, sem inventar dados |
| estado do pedido | somente PENDING_PAYMENT, PAYMENT_CONFIRMED ou EXPIRED |
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
→ shipment
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

O esquema atual não possui eventos de rastreamento. Se algum registro de tracking existente for encontrado no futuro, sua ordenação deverá seguir o contrato da fonte; esta TASK não adicionará armazenamento ou eventos.

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
 projeções de consulta de pedidos
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
- adicionar operações de mutação ou transições manuais/automáticas de pedido;
- adicionar tabelas/campos/eventos de tracking ou dados fictícios;
- criar integração logística externa sem aprovação;
- alterar arquitetura sem ADR;
- modificar requisitos comerciais;
- iniciar automaticamente `TASK-016`.

---

 # 40\. Scope Guard

 Toda alteração deve responder positivamente a pelo menos uma destas categorias:

```
[x] Histórico de pedidos
[x] Detalhes de pedidos
[x] Status do pedido
[x] Consistência de estados persistidos
[x] Rastreamento (somente dados existentes)
[x] Autorização de pedidos
[x] Consulta administrativa de pedidos somente leitura
[x] Testes diretamente relacionados
[x] Documentação diretamente relacionada
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
3. Confirmar estados existentes e projeções de leitura
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
11. Validar consistência dos estados consultados
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
[x] Build passa
[x] Sem erros de compilação
[x] Não houve mudança de schema; nenhuma migration necessária
```

 ## Lint

```
[x] Lint passa
[x] Sem warnings críticos introduzidos (aviso preexistente em `app/layout.tsx`)
```

 ## Testes

```
[x] Unitários passam
[x] Integração passa
[x] API passa
[x] Autorização passa
[x] Consistência dos estados persistidos passa
[x] Tracking: entrega consultada; tracking ausente retorna nulo sem inventar dados
```

 ## Segurança

```
[x] Cliente não acessa pedido de outro cliente
[x] Endpoints administrativos protegidos por GENERAL_ADMIN
[x] CPF e telefone não são expostos nos detalhes
[x] Informações de pagamento limitadas
[x] Nenhuma credencial/token é retornado
```

 ## Integridade

```
[x] Estados válidos
[x] Estados fora do conjunto aprovado não são apresentados como válidos
[x] Histórico consistente
[x] Pagamento consistente
[x] Rastreamento consistente
[x] Preços históricos preservados
```

 ## Performance

```
[x] Sem N+1 crítico
[x] Paginação aplicada
[x] Ordenação determinística
[x] Consultas relevantes avaliadas
```

 ## Rastreabilidade

```
[x] RF-026 coberto
[x] RF-027 coberto
[x] RF-028 coberto
[x] RN-014 coberto
[x] UC-007 coberto
[x] UC-008 coberto
[x] Testes associados aos critérios
```

 ## Escopo

```
[x] ALLOWED_CHANGES respeitado
[x] FORBIDDEN_CHANGES não violado
[x] Scope Guard validado
[x] Nenhum Scope Creep
[x] Não houve alterações incidentais
```

---

 # 43\. Definition of Done específica

 A TASK-015 somente pode ser marcada como `DONE` quando:

 - [x] Cliente consegue consultar seu histórico de pedidos.
- [x] Cliente consegue consultar detalhes de seus pedidos.
- [x] Cliente não consegue acessar pedidos de terceiros.
- [x] `GENERAL_ADMIN` consulta pedidos em modo somente leitura; outros papéis administrativos não têm acesso.
- [x] Estados são apresentados conforme os contratos existentes.
- [x] São apresentados somente `PENDING_PAYMENT`, `PAYMENT_CONFIRMED` e `EXPIRED`.
- [x] Nenhuma transição manual ou automática de estado foi introduzida.
- [x] A consulta preserva a rastreabilidade já existente sem criar histórico fictício.
- [x] Informações históricas da compra são preservadas.
- [x] Estado de pagamento é apresentado de forma consistente.
- [x] Informações de envio persistidas são apresentadas.
- [x] Ausência de rastreamento é tratada sem inventar dados.
- [x] Rastreamento/código/eventos só são retornados quando persistidos por fonte aprovada.
- [x] Paginação é consistente.
- [x] Ordenação é determinística.
- [x] Consultas não apresentam N+1 crítico.
- [x] Dados sensíveis não são expostos.
- [x] Testes unitários passam.
- [x] Testes de integração passam.
- [x] Testes de API passam.
- [x] Testes de autorização passam.
- [x] Build passa.
- [x] Lint passa.
- [x] Documentação está atualizada.
- [x] Rastreabilidade está atualizada.
- [x] `TASKS.md` está atualizado.
- [x] Relatório de execução foi produzido.
- [x] Nenhum `FORBIDDEN_CHANGE` ocorreu.
- [x] Nenhum Scope Creep ocorreu.

---

 # 44\. Critérios de falha

 A TASK não pode ser marcada como `DONE` se:

```
cliente consegue acessar pedido de terceiro
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

## TASK Execution Report

TASK: TASK-015
Status: DONE
Branch: `feature/TASK-015-orders-history-tracking`
Commits: nenhum (alterações ainda não commitadas)

### Primary Changes

- APIs paginadas de histórico e detalhe para o cliente, com isolamento por proprietário.
- Consultas administrativas de lista e detalhe somente para `GENERAL_ADMIN`.
- Projeção de pagamento, itens, valores históricos, endereço de entrega minimizado e estado de envio.
- Endpoint de entrega/rastreamento retorna somente Shipment persistido e `tracking: null` quando não há tracking armazenado.
- Validação de paginação; ordenação determinística por data e ID; sem N+1.
- Testes unitários e de integração/API, sem migration ou alteração de RBAC.

### Incidental Changes

- Nenhuma.

### Tests Executed

- `node --env-file-if-exists=.env.local node_modules/vitest/vitest.mjs run --no-file-parallelism`: 34 arquivos e 108 testes aprovados.
- `npm run quality` executado com `.env.local`: aprovado (format, lint, typecheck, testes e build).
- O lint reporta somente o aviso preexistente `react(only-export-components)` em `app/layout.tsx`.
- Uma execução paralela anterior falhou transitoriamente no teste preexistente `checkout-api-flow` (409 na criação e erro na limpeza de categoria). O teste isolado e a execução completa subsequente passaram.

### Quality Gates

| Gate | Resultado |
|---|---|
| Build | PASS |
| Lint | PASS (aviso preexistente em `app/layout.tsx`) |
| Unit | PASS |
| Integration | PASS |
| API | PASS |
| Security | PASS |
| Acceptance | PASS |
| Regression | PASS |

### Scope Validation

Allowed Changes: PASS
Incidental Changes: PASS (nenhuma)
Forbidden Changes: PASS
Scope Creep: NONE

### Definition of Done

PASS

### Rastreabilidade

- RF-026 / UC-007: histórico paginado do cliente e consulta administrativa; `GET /api/orders` e `GET /api/admin/orders`.
- RF-027: detalhe preserva snapshots e limita os dados de pagamento/endereço; `GET /api/orders/{orderId}`.
- RF-028 / UC-008: entrega e ausência de tracking são apresentadas sem fabricar dados; `GET /api/orders/{orderId}/tracking`.
- RN-014: estados `PENDING_PAYMENT`, `PAYMENT_CONFIRMED` e `EXPIRED` apresentados conforme persistência; nenhuma transição nova.
- Testes: `tests/unit/order-query.test.ts` e `tests/integration/order-api-flow.test.ts`.

### Próxima TASK

TASK-016 permanece `BLOCKED`; não foi iniciada.

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
