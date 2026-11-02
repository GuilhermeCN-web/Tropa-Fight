# TASK-014 — Pagamentos e idempotência

 **Status inicial:** `BLOCKED`; estado atual: `DONE` após GATE-006 aprovado em 2026-11-02\
 **Phase/Priority:** `PHASE-03 / HIGH`\
 **Dependência:** `TASK-013`\
 **Dependências obrigatórias para execução:** `TASK-013 = DONE` e Definition of Ready satisfeita\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 ## 1\. Objetivo

 Integrar o mock local de pagamento aprovado para a TASK-014 ao fluxo comercial do Tropa Fight, implementando persistência de pagamentos, adaptação do gateway, processamento de webhooks e mecanismos de idempotência.

 A TASK deve garantir que operações de pagamento possam ser repetidas, reenviadas ou recebidas fora de ordem sem produzir efeitos comerciais duplicados ou inconsistentes.

 O escopo inclui somente o necessário para:

 - criar e acompanhar pagamentos;
- associar pagamentos aos pedidos;
- integrar o mock local aprovado por meio de um adaptador;
- receber e validar webhooks;
- processar eventos de pagamento de forma idempotente;
- persistir estados de pagamento;
- impedir duplicação de efeitos;
- manter rastreabilidade das transições relevantes;
- testar falhas e reprocessamentos.

 Não faz parte desta TASK redefinir regras comerciais, alterar preços, trocar provedor ou criar políticas de reembolso.

---

 ## 2\. Contexto

 A `TASK-013` deve entregar o checkout e a criação transacional do pedido.

 A `TASK-014` passa a ser responsável pela camada de pagamento que conecta o pedido ao adaptador mock local aprovado. Nenhuma integração financeira externa faz parte desta execução.

 Fluxo esperado:

```
Cliente
   |
   v
Checkout
   |
   v
Order
   |
   v
Payment
   |
   v
Gateway Adapter
   |
   v
Mock Local de Pagamento
   |
   v
Webhook
   |
   v
Webhook Handler
   |
   v
Idempotency / State Transition
   |
   v
Payment + Order
```

 A implementação deve preservar a separação entre:

```
Domain
Application
Infrastructure
Presentation
```

 O domínio não deve depender diretamente do SDK ou da implementação concreta do gateway.

---

 ## 3\. Referências

 ### Requisitos relacionados

 - `RF-024`
- `RF-025`
- `RN-013`
- `RNF-009`

 ### Decisões arquiteturais

 - `ADR-008`
 - `ADR-009`

 ### Dependência funcional

```
TASK-013
   ↓
TASK-014
   ↓
TASK-015
```

---

 ## 4\. Definition of Ready

 A TASK só pode entrar em `IN_PROGRESS` quando todos os itens abaixo forem verdadeiros:

- [x] `TASK-013` está em `DONE`.
- [x] Checkout e criação de pedido estão funcionando; migrations 008–010 e testes da TASK-013 foram registrados como aprovados.
- [x] `Order` e `OrderItem` possuem contrato estável; o pedido inicia em `PENDING_PAYMENT`, contém total consolidado e vence em 30 dias.
- [x] O mock local foi aprovado; nenhum provedor financeiro real foi escolhido.
- [x] `ADR-008` está aprovado e `ADR-009` define a separação dos ciclos de pedido e pagamento.
- [x] Configuração do mock usa `PAYMENT_WEBHOOK_SECRET` do ambiente local, sem credenciais reais.
- [x] O ambiente de teste foi definido como mock local, sem rede financeira.
- [x] Estados e transições de pagamento foram definidos abaixo e em ADR-008.
- [x] Eventos/webhooks esperados foram definidos abaixo e em ADR-008.
- [x] Idempotência da criação e dos eventos foi definida abaixo e em ADR-008.
- [x] Assinatura HMAC-SHA256 do corpo bruto foi definida abaixo e em ADR-008.
- [x] Pedido aprovado passa a `PAYMENT_CONFIRMED`; após expiração, aprovação é rejeitada sem mutação.
- [x] Um único pagamento integral por pedido foi aprovado; pagamentos parciais, gateway real, estornos e cancelamento comercial não fazem parte do escopo.

 Se qualquer item crítico estiver pendente, a TASK permanece `BLOCKED`.

**Prontidão (2026-11-02): PASS.** Decisões aprovadas e registradas em ADR-008 e `docs/planning/answered-questions.md`; referência indevida a ADR-006 corrigida para ADR-008/009. TASK-013 e seus artefatos foram verificados.

**GATE-001 — APROVADO (2026-11-02).** Dependência e artefatos da TASK-013 verificados; DoR atendida; alterações preexistentes: nenhuma; branch criada: `feature/TASK-014-payments-idempotency`; working tree estava limpo na abertura. Transições registradas: `BLOCKED → READY → IN_PROGRESS`.

## Planejamento de implementação — GATE-002

**Arquivos PRIMARY previstos:**

- `src/modules/payments/domain/payment.ts` — tipos, estados, transições e validações do domínio.
- `src/modules/payments/application/` — portas de persistência/gateway e orquestração de criação e webhook.
- `src/modules/payments/infrastructure/` — adaptador mock local e repositório PostgreSQL transacional.
- `src/modules/payments/presentation/` e `app/api/payments/` — criação/consulta autenticadas e endpoint de webhook assinado.
- `db/migrations/011_mock_payments.sql` — estados/tabelas/constraints do pagamento e estado `PAYMENT_CONFIRMED` do pedido.
- `tests/unit/payment-domain.test.ts`, `tests/unit/payment-webhook.test.ts`, `tests/unit/payment-http.test.ts` e `tests/integration/payment-flow.test.ts`.
- `.env.example` — variável de configuração local do webhook, sem valor secreto.
- Este documento, `TASKS.md`, ADR-008 e `docs/planning/answered-questions.md`.

**Arquivo INCIDENTAL previsto:**

- `src/modules/audit/domain/audit-event.ts` e teste relacionado — acrescentar somente ações de auditoria de pagamento necessárias à rastreabilidade exigida na seção 26; o schema de auditoria armazena ações como texto e não requer migration.

**Arquivos protegidos:** checkout e regras de preço/cupom; APIs e permissões de estoque; carrinho; cálculo de frete; TASK-013; RBAC; frontend; integrações externas; manifestos de dependências.

**Sequência:** migration aditiva; modelo e transições; assinatura do corpo bruto; adaptador mock; persistência transacional e idempotente; endpoints; integração de aprovação com pedido, reserva, saldo/movimentação de estoque e auditoria; testes unitários, de concorrência, integração, autenticação e webhook; quality gates; teste manual com payload assinado.

**Integridade e segurança:** criação bloqueia o pedido e usa seu total persistido; `(customerId, idempotencyKey)` e `orderId` recebem constraints únicas; evento e efeitos são aplicados em uma transação com locks consistentes. A aprovação só converte estoque se o pedido ainda estiver `PENDING_PAYMENT` e dentro do prazo. O payload de cartão não é aceito; assinatura inválida não persiste nem aplica o corpo; nenhum segredo ou corpo bruto é registrado.

**Riscos/rollback:** migration é aditiva; não altera pedidos existentes e `PAYMENT_CONFIRMED` não é alvo da rotina de expiração da TASK-013. Se a implementação ou validação falhar, manter TASK-014 fora de DONE e não alterar TASK-015. Não adicionar dependências.

**GATE-002 — APROVADO (2026-11-02).** Plano limitado ao escopo, arquivos reais mapeados, alteração de auditoria classificada como incidental e diretamente necessária. Nenhum bloqueio ou decisão pendente identificado. GATE-003 habilitado.

## Implementação e validação

**GATE-003 — IMPLEMENTAÇÃO CONCLUÍDA (2026-11-02).** Implementados migration 011, modelo e transições, assinatura HMAC do corpo bruto, adaptador `LOCAL_MOCK`, criação/consulta autenticadas, processamento transacional e idempotente, confirmação do pedido e conversão de estoque, auditoria e testes unitários/de integração/API. PRIMARY: arquivos do módulo payments, rotas, migration, testes, `.env.example` e documentos autorizados. INCIDENTAL: ações de auditoria de pagamento e teste correspondente, necessárias à rastreabilidade e rejeição de webhook. Nenhum arquivo FORBIDDEN alterado.

**GATE-004 — APROVADO (2026-11-02).** `npm run quality`, executado com `.env.local` carregado pelo Node, passou: format, lint, typecheck, 92 testes em 32 arquivos e build Next.js. Lint mantém somente warning preexistente em `app/layout.tsx`. Uma execução inicial teve falha transitória no teste preexistente `checkout-api-flow`; o teste passou isoladamente e a execução completa subsequente passou. Revisão confirmou validação HMAC antes do processamento, sem acesso ao serviço em assinatura inválida, autenticação/propriedade no GET e efeitos comerciais dentro da transação.

**GATE-005 — APROVADO (2026-11-02).** Teste manual local executado: assinatura inválida retornou HTTP 401; evento `payment.processing` retornou HTTP 200; evento `payment.approved` retornou HTTP 200; replay foi reconhecido como duplicado (`duplicate: true`). O banco confirmou `Payment=APPROVED`, `Order=PAYMENT_CONFIRMED`, uma reserva convertida, uma saída de estoque e um evento de aprovação processado. Um envio intermediário retornou HTTP 400 devido ao corpo copiado inválido e outro HTTP 409 por tentar aprovar antes de `PROCESSING`; nenhum deles mutou o pagamento. O teste válido/replay subsequente concluiu os critérios. Nenhum segredo, cookie ou identificador foi registrado.

**GATE-006 — APROVADO (2026-11-02).** Definition of Done, critérios de aceitação, rastreabilidade, diff e Scope Guard revisados. PRIMARY limitado ao mock de pagamentos, persistência, endpoints e testes; INCIDENTAL limitado às ações/teste de auditoria necessários. Nenhuma alteração FORBIDDEN ou Scope Creep. Quality gates automatizados e teste manual aprovados. TASK-014 concluída; TASK-015 permanece BLOCKED e não foi iniciada.

---

 ## 5\. Entregáveis

 A TASK deve produzir, conforme a arquitetura existente:

```
Payment
PaymentStatus
PaymentProvider
PaymentTransaction / ProviderReference
PaymentEvent / WebhookEvent
PaymentRepository
PaymentGateway
PaymentGatewayAdapter
WebhookHandler
Idempotency mechanism
Payment state transition logic
```

 Também devem ser entregues:

 - endpoints necessários;
- validação de webhook;
- persistência;
- migrations necessárias;
- testes unitários;
- testes de integração;
- testes de webhook;
- testes de idempotência;
- documentação técnica;
- atualização de `TASKS.md`;
- relatório de execução.

---

 # 6\. Modelo de domínio

 ## 6.1 Payment

 O pagamento deve possuir uma identidade própria e referência explícita ao pedido.

 Campos conceituais mínimos:

```
Payment
├── id
├── orderId
├── provider
├── providerPaymentId
├── amount
├── currency
├── status
├── idempotencyKey
├── createdAt
├── updatedAt
└── paidAt
```

 Os nomes concretos devem respeitar as convenções já existentes no projeto.

 ### Invariantes

 - Um pagamento deve estar associado a um pedido válido.
- O valor persistido do pagamento deve representar o valor aprovado para aquela transação.
- A moeda deve ser explícita.
- A referência do provedor não pode ser utilizada como identificador confiável sem validação.
- Um pagamento não pode produzir múltiplos efeitos comerciais para o mesmo evento.
- Alterações de estado devem respeitar a máquina de estados definida.
- Informações sensíveis do cartão não devem ser persistidas indevidamente.

---

 # 7\. Estados de pagamento

 A implementação deve utilizar somente os estados aprovados no domínio.

 Exemplo conceitual:

```
PENDING
   |
   v
PROCESSING
   |
   +--> APPROVED
   +--> FAILED
   +--> CANCELLED
   +--> EXPIRED
```

 Caso o projeto utilize nomenclatura diferente, prevalecem os contratos aprovados em `ADR-008` e `ADR-009`.

 ### Regras

 Transições devem ser explícitas.

 Exemplo:

```
PENDING     → PROCESSING

PROCESSING  → APPROVED
PROCESSING  → FAILED
PROCESSING  → CANCELLED
PROCESSING  → EXPIRED

APPROVED    → [estado terminal]
FAILED      → [estado terminal]
CANCELLED   → [estado terminal]
EXPIRED     → [estado terminal]
```

 Não deve ser permitido, por exemplo:

```
APPROVED → PENDING
APPROVED → PROCESSING
FAILED   → APPROVED
CANCELLED → APPROVED
```

 Estados terminais não regridem.

---

 # 8\. Abstração do gateway

 O domínio/aplicação não deve depender diretamente do SDK do provedor.

 A arquitetura deve possuir uma abstração equivalente a:

```
PaymentGateway
```

 Responsabilidades conceituais:

```
createPayment(...)
getPayment(...)
cancelPayment(...)
```

 O adaptador desta TASK implementa somente a criação simulada; consulta e cancelamento de gateway externo não fazem parte do escopo.

 O fluxo deve ser:

```
Application
    |
    v
PaymentGateway
    |
    v
LocalMockPaymentGateway
    |
    v
Local mock
```

 Não deve existir código comercial espalhado pelo adapter.

 O adapter deve traduzir:

```
Domain/Application
        ↕
Provider-specific API
```

---

 # 9\. Criação do pagamento

 Ao criar um pagamento:

 1. validar o pedido;
2. validar estado do pedido;
3. validar valor;
4. criar ou localizar a operação idempotente;
5. chamar o gateway através da abstração;
6. persistir referência externa;
7. persistir estado inicial;
8. retornar somente os dados necessários ao fluxo da aplicação.

 A implementação não deve recalcular unilateralmente o preço do pedido.

 O valor utilizado no pagamento deve ser derivado do valor transacional já consolidado pelo fluxo de checkout.

---

 # 10\. Idempotência

 Idempotência é requisito obrigatório desta TASK.

 Uma mesma solicitação não pode produzir:

```
1 request
→ 2 pagamentos
```

 nem:

```
1 webhook
→ 2 alterações comerciais
```

 ## 10.1 Idempotência da criação

 Deve existir uma chave idempotente associada à operação.

 Exemplo conceitual:

```
idempotencyKey
```

 Para uma mesma chave:

```
primeira chamada
→ cria pagamento

segunda chamada
→ retorna o resultado já existente

terceira chamada
→ não cria outro pagamento
```

 A implementação deve possuir proteção também no banco de dados.

 Não confiar somente em:

```
if exists(...)
```

 sem mecanismo de concorrência/constraint apropriado.

 Cada pedido aceita um único pagamento integral pelo total persistido. Pagamentos parciais e a criação de um segundo pagamento para o mesmo pedido não são suportados.

---

 # 11\. Concorrência

 O cenário abaixo deve ser tratado:

```
Request A ──┐
            ├── mesma idempotencyKey
Request B ──┘
```

 Resultado esperado:

```
Payment A = Payment B
ou
uma única operação persistida e a outra reutiliza o resultado
```

 Nunca:

```
Payment A
Payment B
```

 para a mesma operação idempotente.

 Devem ser avaliados mecanismos como:

 - unique constraint;
- transação;
- locking apropriado;
- upsert;
- controle de concorrência;
- retry seguro.

 A solução concreta deve respeitar o banco e os padrões já utilizados no projeto.

---

 # 12\. Webhooks

 O sistema deve possuir endpoint específico para recebimento de eventos do provedor.

 Fluxo:

```
Provider
   |
   v
Webhook Endpoint
   |
   v
Signature Validation
   |
   v
Event Identification
   |
   v
Idempotency Check
   |
   v
State Transition
   |
   v
Persistence
```

---

 # 13\. Validação de assinatura

 Webhooks não devem ser considerados confiáveis apenas porque chegaram ao endpoint correto.

 Antes de processar um evento:

 - validar assinatura;
- validar autenticidade conforme o contrato aprovado em ADR-008;
- validar estrutura mínima do payload;
- rejeitar assinatura inválida;
- não produzir efeitos comerciais antes da validação.

 Cenário obrigatório:

```
Webhook com assinatura inválida
→ rejeitar
→ não alterar Payment
→ não alterar Order
→ registrar evento técnico apropriado
```

 Segredos utilizados para validar a assinatura devem vir da configuração segura do ambiente.

 Nunca:

```
secret = "..."
```

 hardcoded no código.

---

 # 14\. Idempotência de webhook

 O mesmo evento pode ser reenviado pelo mock local várias vezes.

 Exemplo:

```
event_123
event_123
event_123
```

 Resultado esperado:

```
processamento comercial = 1
```

 e não:

```
processamento comercial = 3
```

 Deve existir identificação persistente do evento processado.

 Exemplo conceitual:

```
WebhookEvent
├── id
├── provider
├── providerEventId
├── eventType
├── receivedAt
├── processedAt
└── status
```

 Uma constraint única deve impedir processamento duplicado quando aplicável.

 No mock local, os tipos suportados são `payment.processing`, `payment.approved`, `payment.failed`, `payment.cancelled` e `payment.expired`. A assinatura HMAC-SHA256 cobre os bytes exatos do corpo da requisição; o cabeçalho é `x-payment-signature: sha256=<hex>`, e a chave vem de `PAYMENT_WEBHOOK_SECRET` no ambiente local.

 O payload JSON mínimo contém `id` (identificador do evento), `type`, `paymentId`, `orderId`, `amountCents`, `currency` e `occurredAt`. O evento deve corresponder ao pagamento, pedido, valor e moeda persistidos antes de qualquer efeito comercial.

---

 # 15\. Eventos fora de ordem

 O sistema deve considerar que webhooks podem chegar fora de ordem.

 Exemplo:

```
APPROVED
   ↓
PROCESSING
```

 Não deve permitir que um evento antigo faça o pagamento regredir para um estado incompatível.

 A transição deve ser validada pela máquina de estados. A aprovação válida antes do vencimento move o pedido de `PENDING_PAYMENT` para `PAYMENT_CONFIRMED` e converte a reserva de estoque na mesma transação. Aprovação após expiração é rejeitada sem mutação do pedido ou estoque.

 Exemplo:

```
Payment = APPROVED

Webhook:
PROCESSING

Resultado:
estado continua APPROVED
evento tratado sem regressão
```

 A política exata segue `ADR-008` e `ADR-009`. Evento `APPROVED` para pedido expirado deve ser rejeitado sem alterar pedido ou estoque.

---

 # 16\. Consistência Payment × Order

 O pagamento não deve deixar o pedido em estado impossível.

 Exemplos de invariantes:

```
Payment APPROVED
→ Order pode avançar para estado compatível

Payment FAILED
→ Order não pode ser tratado como pago

Webhook inválido
→ Payment permanece inalterado

Webhook duplicado
→ não duplica transição

Pagamento inexistente
→ evento não deve alterar pedido arbitrariamente
```

 As transições entre `Payment` e `Order` devem ser transacionais quando a arquitetura e o mecanismo de persistência permitirem.

---

 # 17\. Segurança

 É obrigatório verificar:

 - nenhuma informação completa de cartão armazenada;
- nenhum CVV armazenado;
- nenhum segredo em código;
- nenhum segredo em logs;
- tokens/chaves protegidos por configuração segura;
- webhook com assinatura validada;
- endpoints protegidos conforme arquitetura;
- autorização adequada para operações administrativas;
- dados sensíveis não retornados desnecessariamente pela API.

---

 # 18\. Tratamento de falhas

 Devem ser definidos comportamentos para:

 ### Gateway indisponível

```
Application
   ↓
Gateway timeout
   ↓
Payment permanece em estado seguro
```

 Não criar falso estado `APPROVED`.

 ### Timeout após criação

 Cenário crítico:

```
Request
   ↓
Gateway cria pagamento
   ↓
Resposta perdida
   ↓
Cliente/requisição tenta novamente
```

 A idempotência deve impedir a criação de uma segunda operação.

 ### Webhook duplicado

```
event_123
event_123
```

 Resultado:

```
efeito comercial único
```

 ### Webhook inválido

```
signature invalid
```

 Resultado:

```
reject
+
no state mutation
```

---

 # 19\. Retry

 Retries devem ser seguros.

 Nunca implementar:

```
retry
→ criar outro Payment
```

 sem idempotência.

 A política deve distinguir:

```
erro temporário
≠
erro definitivo
```

 Não há integração externa nem retry de gateway nesta TASK. Repetições da criação devem reutilizar a mesma chave idempotente.

---

 # 20\. API

 Os contratos devem ser documentados.

 Exemplos conceituais:

```
POST /payments
GET  /payments/{id}
POST /payments/webhook
```

 Os caminhos reais seguem o padrão já adotado no projeto:

```
POST /api/payments
GET  /api/payments/{paymentId}
POST /api/payments/webhook
```

 `POST /api/payments` aceita somente `{ orderId, method }` e um UUID em `Idempotency-Key`; o total e a moeda vêm do pedido persistido. Dados de cartão não são aceitos.

 ### `POST /payments`

 Deve:

 - validar autenticação;
- validar pedido;
- validar estado permitido;
- validar valor;
- aceitar/reutilizar idempotency key;
- criar ou localizar pagamento;
- retornar estado consistente.

 ### `POST /payments/webhook`

 Deve:

 - receber payload;
- validar assinatura;
- identificar evento;
- verificar idempotência;
- validar transição;
- persistir resultado;
- responder conforme contrato do mock aprovado.

---

 # 21\. Testes unitários

 Cobrir no mínimo:

 - criação de Payment;
- validação de valor;
- validação de moeda;
- transições válidas;
- transições inválidas;
- estado terminal;
- geração/validação de idempotency key;
- interpretação de eventos do gateway;
- tradução de estados do provedor;
- rejeição de eventos inválidos.

---

 # 22\. Testes de integração

 Cobrir:

 - criação de pagamento;
- persistência da referência do provedor;
- associação com Order;
- idempotência da criação;
- concorrência de criação;
- webhook válido;
- webhook inválido;
- webhook duplicado;
- evento fora de ordem;
- atualização consistente de Payment e Order.

---

 # 23\. Matriz mínima de testes

 | Cenário | Resultado esperado |
| --- | --- |
| pagamento válido | pagamento criado |
| mesmo request repetido | não cria duplicata |
| mesma idempotency key concorrente | uma única operação |
| webhook válido | estado atualizado |
| webhook inválido | rejeitado sem mutação |
| webhook duplicado | efeito único |
| webhook antigo | não regride estado |
| gateway timeout | estado seguro |
| pagamento inexistente | erro controlado |
| transição inválida | rejeitada |
| segredo ausente | configuração inválida |
| cartão/sensível no log | nunca permitido |
| pagamento aprovado | pedido avança conforme regra |
| pagamento falho | pedido não é tratado como pago |

---

 # 24\. Testes de contrato

 Se houver adapter específico para o provedor:

```
PaymentGateway Contract
        ↓
Provider Adapter
        ↓
Contract Tests
```

 Os testes devem garantir que o adapter:

 - cria pagamento corretamente;
- interpreta resposta corretamente;
- converte estados corretamente;
- trata erros;
- valida referências;
- preserva idempotência.

 Mocks não devem esconder diferenças relevantes do contrato real.

---

 # 25\. Observabilidade

 Registrar informações suficientes para diagnóstico sem expor dados sensíveis.

 Exemplo de contexto permitido:

```
paymentId
orderId
provider
providerPaymentId
eventId
eventType
paymentStatus
requestCorrelationId
```

 Não registrar:

```
cardNumber
CVV
secret
accessToken
authorization credential
```

 Logs devem permitir reconstruir:

```
Order
 ↓
Payment
 ↓
Provider Operation
 ↓
Webhook Event
 ↓
State Transition
```

---

 # 26\. Auditoria

 Operações relevantes devem manter rastreabilidade conforme as fundações criadas anteriormente.

 Especialmente:

 - criação de pagamento;
- mudança de estado;
- recebimento de webhook;
- falha de validação;
- eventos rejeitados;
- operações administrativas relacionadas.

 A auditoria não deve armazenar dados sensíveis desnecessários.

---

 # 27\. Banco de dados

 Se novas tabelas forem necessárias:

```
payments
webhook_events
```

 ou equivalentes devem possuir:

 - primary key;
- foreign keys;
- índices necessários;
- constraints de unicidade;
- timestamps;
- integridade referencial;
- estratégia de migration reversível quando suportada.

 Índices devem ser avaliados para:

```
orderId
providerPaymentId
idempotencyKey
providerEventId
status
```

 Não criar índices especulativos sem necessidade demonstrável.

---

 # 28\. ALLOWED\_CHANGES

 Permitido alterar:

```
módulos payments/orders necessários ao pagamento
adaptador mock local aprovado
persistência de Payment
persistência de eventos de webhook
migrations necessárias
interfaces de gateway
endpoints de pagamento
mocks/fakes de gateway
testes unitários
testes de integração
testes de webhook
configuração local do mock
`.env.example` — nome da variável local necessária ao webhook, sem valor secreto
documentação técnica
testes unitários da API de pagamento/webhook
ADR-008 e documentação de decisões relacionadas
docs/planning/answered-questions.md
TASKS.md
```

 Alterações incidentais são permitidas somente quando forem diretamente causadas pela implementação da TASK.

---

 # 29\. FORBIDDEN\_CHANGES

 É proibido:

- substituir o mock local por um provedor real sem decisão explícita;
- escolher ou integrar provedor externo unilateralmente;
- colocar credenciais reais no código;
- armazenar dados completos de cartão;
- implementar política de reembolso não aprovada;
- alterar preço de catálogo;
- alterar regras de promoção;
- alterar regras de estoque sem necessidade diretamente causada;
- criar funcionalidades de logística fora do contrato;
- implementar novas funcionalidades de pedidos;
- alterar RBAC sem necessidade diretamente causada;
- remover auditoria;
- ignorar validação de webhook;
- ignorar idempotência;
- criar bypass de segurança;
- modificar requisitos comerciais;
- criar integração adicional não solicitada;
- iniciar automaticamente `TASK-015`.

---

 # 30\. Scope Guard

 Antes de cada alteração, responder:

```
Esta alteração é necessária para:
[ ] Payment
[ ] Gateway Adapter
[ ] Webhook
[ ] Idempotência
[ ] Segurança do pagamento
[ ] Persistência do pagamento
[ ] Testes diretamente relacionados
[ ] Documentação diretamente relacionada
```

 Se nenhuma opção for aplicável:

```
NÃO ALTERAR
```

 Qualquer alteração fora desse conjunto exige avaliação explícita de escopo.

---

 # 31\. Estratégia de implementação

 Sequência recomendada:

```
1. Confirmar ADR-008 e ADR-009
        ↓
2. Mapear contrato atual de Order
        ↓
3. Definir Payment
        ↓
4. Definir estados
        ↓
5. Criar persistência
        ↓
6. Criar PaymentGateway
        ↓
7. Implementar adapter
        ↓
8. Implementar criação idempotente
        ↓
9. Implementar webhook
        ↓
10. Implementar validação de assinatura
        ↓
11. Implementar idempotência de eventos
        ↓
12. Implementar transições de estado
        ↓
13. Integrar Payment ↔ Order
        ↓
14. Testes unitários
        ↓
15. Testes de integração
        ↓
16. Testes de concorrência
        ↓
17. Testes de webhook
        ↓
18. Segurança e logs
        ↓
19. Build/Lint/Test
        ↓
20. Atualizar documentação
        ↓
21. Atualizar TASKS.md
        ↓
22. Produzir relatório
        ↓
23. Parar e aguardar próxima autorização
```

---

 # 32\. Quality Gates

 Antes de `DONE`:

 ### Build

```
 [x] Build passa
 [x] Sem erro de compilação
 [x] Migrations aplicam corretamente
```

 ### Lint

```
[x] Lint passa
[x] Sem warnings críticos introduzidos
```

 ### Testes

```
[x] Unitários passam
[x] Integração passa
[x] Webhook passa
[x] Idempotência passa
[x] Concorrência aplicável passa
[x] Testes de segurança aplicáveis passam
```

 ### Segurança

```
[x] Assinatura de webhook validada
[x] Segredos fora do código
[x] Dados de cartão não persistidos indevidamente
[x] Dados sensíveis ausentes dos logs
```

 ### Integridade

```
[x] Payment ↔ Order consistente
[x] Estados válidos
[x] Estados inválidos rejeitados
[x] Webhooks duplicados não duplicam efeitos
[x] Requests duplicados não criam pagamentos duplicados
```

 ### Rastreabilidade

```
[x] RF-024 coberto
[x] RF-025 coberto
[x] RN-013 coberto
[x] RNF-009 coberto
[x] ADR-008 implementado
[x] ADR-009 respeitado
[x] Testes vinculados aos critérios
```

 ### Escopo

```
[x] ALLOWED_CHANGES respeitado
[x] FORBIDDEN_CHANGES não violado
[x] Scope Guard validado
[x] Nenhum Scope Creep
[x] Alterações incidentais justificadas
```

---

 # 33\. Definition of Done específica

 A TASK-014 somente pode ser marcada como `DONE` quando:

- [x] Mock local aprovado está integrado por adapter.
- [x] `Payment` está persistido corretamente.
- [x] Estados de pagamento estão definidos e protegidos.
- [x] Criação de pagamento é idempotente.
- [x] Concorrência da criação foi testada.
- [x] Webhooks são recebidos.
- [x] Assinaturas de webhook são validadas.
- [x] Webhooks duplicados não produzem efeitos duplicados.
- [x] Eventos fora de ordem não causam regressões inválidas.
- [x] Estado de `Payment` é consistente com `Order`.
- [x] Falhas e eventos rejeitados não produzem efeitos comerciais parciais.
- [x] Dados sensíveis não são persistidos indevidamente.
- [x] Segredos não aparecem no código ou logs.
- [x] Testes unitários passam.
- [x] Testes de integração passam.
- [x] Testes de webhook passam.
- [x] Testes de idempotência passam.
- [x] Build passa.
- [x] Lint passa.
- [x] Documentação foi atualizada.
- [x] Rastreabilidade foi atualizada.
- [x] `TASKS.md` foi atualizado.
- [x] Relatório de execução foi produzido.
- [x] Nenhum `FORBIDDEN_CHANGE` ocorreu.
- [x] Nenhum Scope Creep ocorreu.

---

 # 34\. Critério de falha

 A TASK deve permanecer fora de `DONE` caso ocorra qualquer uma das situações:

```
webhook sem validação de assinatura
        OU
duplicação de pagamento possível
        OU
duplicação de efeito de webhook possível
        OU
transição inválida de estado possível
        OU
dados sensíveis armazenados indevidamente
        OU
mock local não aprovado
        OU
teste obrigatório falhando
        OU
build/lint falhando
        OU
rastreabilidade incompleta
        OU
Scope Guard violado
```

 Nesses casos, registrar o bloqueio/falha e manter o estado correspondente:

```
FAILED
```

 ou

```
BLOCKED
```

 conforme a causa.

---

 # 35\. Relatório de execução

 Ao finalizar a implementação, produzir:

```
TASK: TASK-014
STATUS: DONE

Resumo:
Mock local de pagamentos implementado, integrado ao fluxo de pedidos e validado por testes automatizados e manuais.

Implementado:
- Persistência idempotente de pagamentos e eventos com migration 011.
- HMAC-SHA256 no webhook, autenticação/escopo do cliente e adaptador `LOCAL_MOCK`.
- Confirmação transacional de pedido e conversão de estoque sem efeitos duplicados.

Arquivos alterados:
- `src/modules/payments/`, `app/api/payments/` e `db/migrations/011_mock_payments.sql`.
- Testes payment unitários, HTTP e PostgreSQL integration; ações de auditoria e teste correspondente.
- `docs/TASKS/TASK014.MD`, `docs/adr/ADRs.md`, `docs/planning/answered-questions.md`, `TASKS.md` e `.env.example`.

Migrations:
- `db/migrations/011_mock_payments.sql` (aplicada ao banco local)

Gateway:
- Mode: mock local; provedor real: não selecionado
- Adapter: `LocalMockPaymentGateway`

Idempotência:
- criação: PASS
- webhook: PASS
- concorrência: PASS

Webhooks:
- assinatura: PASS (HTTP 401 inválida; válida aceita)
- duplicação: PASS (replay `duplicate: true`; uma saída de estoque)
- ordem: PASS (evento processing antes de approved; eventos obsoletos cobertos por integração)

Testes:
- unit: PASS
- integration: PASS
- webhook: PASS
- idempotência: PASS
- concorrência: PASS

Quality Gates:
- build: PASS
- lint: PASS (um warning preexistente em `app/layout.tsx`)
- testes aplicáveis: PASS (92 testes)

Rastreabilidade:
- RF-024: pagamento local associado a pedido persistido.
- RF-025: webhooks e estados tratados conforme contrato aprovado.
- RN-013: criação e eventos idempotentes, confirmação e estoque transacionais.
- RNF-009: assinatura validada, dados de cartão excluídos e segredo local fora do repositório.
- ADR-008: mock local sem transação financeira real.
- ADR-009: ciclo de pagamento separado; pedido confirmado como `PAYMENT_CONFIRMED`.

Scope Guard:
- PASS

Alterações incidentais:
- Inclusão de ações de auditoria de pagamentos e teste de sanitização/rastreabilidade.

Bloqueios:
- nenhum

Próximo estado:
DONE

Próxima TASK:
TASK-015 — somente após autorização explícita.
```

---

 # 36\. Estado final

 Todos os Gates foram aprovados:

```
TASK-014
    |
    v
DONE
```

GATE-006 encerra a TASK. Não iniciar TASK-015 sem autorização explícita.

 A conclusão da TASK-014 **não inicia automaticamente** a `TASK-015`.

 A execução deve parar após a atualização de:

```
TASKS.md
relatório de execução
rastreabilidade
estado da TASK-014
```
