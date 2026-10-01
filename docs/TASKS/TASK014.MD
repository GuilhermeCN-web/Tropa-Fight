# TASK-014 — Pagamentos e idempotência

 **Status inicial:** `BLOCKED`\
 **Phase/Priority:** `PHASE-03 / HIGH`\
 **Dependência:** `TASK-013`\
 **Dependências obrigatórias para execução:** `TASK-013 = DONE` e Definition of Ready satisfeita\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 ## 1\. Objetivo

 Integrar o provedor de pagamento previamente aprovado ao fluxo comercial do Tropa Fight, implementando persistência de pagamentos, adaptação do gateway, processamento de webhooks e mecanismos de idempotência.

 A TASK deve garantir que operações de pagamento possam ser repetidas, reenviadas ou recebidas fora de ordem sem produzir efeitos comerciais duplicados ou inconsistentes.

 O escopo inclui somente o necessário para:

 - criar e acompanhar pagamentos;
- associar pagamentos aos pedidos;
- integrar o gateway aprovado por meio de um adaptador;
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

 A `TASK-014` passa a ser responsável pela camada de pagamento que conecta o pedido ao provedor aprovado.

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
Provedor de Pagamento
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

 - `ADR-006`

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

 - [ ] `TASK-013` está em `DONE`.
- [ ] Checkout e criação de pedido estão funcionando.
- [ ] `Order` e `OrderItem` possuem contrato estável para integração com pagamento.
- [ ] O provedor de pagamento foi aprovado.
- [ ] `ADR-006` está aprovado e disponível.
- [ ] Credenciais/configurações necessárias possuem estratégia definida.
- [ ] Ambiente de teste/sandbox do provedor está disponível ou explicitamente definido como mock.
- [ ] Estados de pagamento estão definidos.
- [ ] Eventos/webhooks esperados estão definidos.
- [ ] Estratégia de idempotência está definida.
- [ ] Estratégia de validação de assinatura dos webhooks está definida.
- [ ] Regras de transição entre estados estão definidas.
- [ ] Não existem decisões comerciais críticas pendentes que precisem ser inventadas durante a implementação.

 Se qualquer item crítico estiver pendente, a TASK permanece `BLOCKED`.

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
   +--> PROCESSING
   |       |
   |       +--> APPROVED
   |       |
   |       +--> FAILED
   |
   +--> CANCELLED
```

 Caso o projeto utilize nomenclatura diferente, prevalece o contrato aprovado em `ADR-006`.

 ### Regras

 Transições devem ser explícitas.

 Exemplo:

```
PENDING     → PROCESSING
PENDING     → FAILED
PENDING     → CANCELLED

PROCESSING  → APPROVED
PROCESSING  → FAILED

APPROVED    → [estado terminal]
FAILED      → [estado terminal]
CANCELLED   → [estado terminal]
```

 Não deve ser permitido, por exemplo:

```
APPROVED → PENDING
APPROVED → PROCESSING
FAILED   → APPROVED
CANCELLED → APPROVED
```

 salvo se uma regra formal do provedor e do domínio exigir outro comportamento.

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

 Os métodos concretos dependem do contrato do provedor aprovado.

 O fluxo deve ser:

```
Application
    |
    v
PaymentGateway
    |
    v
ApprovedProviderAdapter
    |
    v
Provider SDK/API
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
- validar autenticidade conforme o mecanismo oficial do provedor;
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

 O mesmo evento pode ser enviado várias vezes pelo provedor.

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

 A transição deve ser validada pela máquina de estados.

 Exemplo:

```
Payment = APPROVED

Webhook:
PROCESSING

Resultado:
estado continua APPROVED
evento tratado sem regressão
```

 A política exata deve seguir `ADR-006` e as garantias do provedor.

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

 Retries automáticos devem ser utilizados somente quando suportados pela arquitetura e pelo contrato do provedor.

---

 # 20\. API

 Os contratos devem ser documentados.

 Exemplos conceituais:

```
POST /payments
GET  /payments/{id}
POST /payments/webhook
```

 Os caminhos reais devem seguir o padrão já adotado no projeto.

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
- responder conforme contrato do provedor.

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
adaptador do provedor aprovado
persistência de Payment
persistência de eventos de webhook
migrations necessárias
interfaces de gateway
endpoints de pagamento
mocks/fakes de gateway
testes unitários
testes de integração
testes de webhook
configuração de sandbox
documentação técnica
ADR-006, caso a decisão aprovada precise ser complementada sem alterar seu sentido
TASKS.md
```

 Alterações incidentais são permitidas somente quando forem diretamente causadas pela implementação da TASK.

---

 # 29\. FORBIDDEN\_CHANGES

 É proibido:

 - trocar o provedor aprovado sem decisão explícita;
- escolher provedor diferente unilateralmente;
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
1. Confirmar ADR-006
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
[ ] Build passa
[ ] Sem erro de compilação
[ ] Migrations aplicam corretamente
```

 ### Lint

```
[ ] Lint passa
[ ] Sem warnings críticos introduzidos
```

 ### Testes

```
[ ] Unitários passam
[ ] Integração passa
[ ] Webhook passa
[ ] Idempotência passa
[ ] Concorrência aplicável passa
[ ] Testes de segurança aplicáveis passam
```

 ### Segurança

```
[ ] Assinatura de webhook validada
[ ] Segredos fora do código
[ ] Dados de cartão não persistidos indevidamente
[ ] Dados sensíveis ausentes dos logs
```

 ### Integridade

```
[ ] Payment ↔ Order consistente
[ ] Estados válidos
[ ] Estados inválidos rejeitados
[ ] Webhooks duplicados não duplicam efeitos
[ ] Requests duplicados não criam pagamentos duplicados
```

 ### Rastreabilidade

```
[ ] RF-024 coberto
[ ] RF-025 coberto
[ ] RN-013 coberto
[ ] RNF-009 coberto
[ ] ADR-006 implementado
[ ] Testes vinculados aos critérios
```

 ### Escopo

```
[ ] ALLOWED_CHANGES respeitado
[ ] FORBIDDEN_CHANGES não violado
[ ] Scope Guard validado
[ ] Nenhum Scope Creep
[ ] Alterações incidentais justificadas
```

---

 # 33\. Definition of Done específica

 A TASK-014 somente pode ser marcada como `DONE` quando:

 - [ ] Provedor aprovado está integrado por adapter.
- [ ] `Payment` está persistido corretamente.
- [ ] Estados de pagamento estão definidos e protegidos.
- [ ] Criação de pagamento é idempotente.
- [ ] Concorrência da criação foi testada.
- [ ] Webhooks são recebidos.
- [ ] Assinaturas de webhook são validadas.
- [ ] Webhooks duplicados não produzem efeitos duplicados.
- [ ] Eventos fora de ordem não causam regressões inválidas.
- [ ] Estado de `Payment` é consistente com `Order`.
- [ ] Falhas do gateway são tratadas com segurança.
- [ ] Dados sensíveis não são persistidos indevidamente.
- [ ] Segredos não aparecem no código ou logs.
- [ ] Testes unitários passam.
- [ ] Testes de integração passam.
- [ ] Testes de webhook passam.
- [ ] Testes de idempotência passam.
- [ ] Build passa.
- [ ] Lint passa.
- [ ] Documentação foi atualizada.
- [ ] Rastreabilidade foi atualizada.
- [ ] `TASKS.md` foi atualizado.
- [ ] Relatório de execução foi produzido.
- [ ] Nenhum `FORBIDDEN_CHANGE` ocorreu.
- [ ] Nenhum Scope Creep ocorreu.

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
gateway não aprovado
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
STATUS: DONE | FAILED | BLOCKED

Resumo:
<resumo objetivo>

Implementado:
- ...
- ...
- ...

Arquivos alterados:
- ...
- ...

Migrations:
- ...

Gateway:
- Provider: <aprovado>
- Adapter: <implementado>

Idempotência:
- criação: PASS/FAIL
- webhook: PASS/FAIL
- concorrência: PASS/FAIL

Webhooks:
- assinatura: PASS/FAIL
- duplicação: PASS/FAIL
- ordem: PASS/FAIL

Testes:
- unit: PASS/FAIL
- integration: PASS/FAIL
- webhook: PASS/FAIL
- idempotência: PASS/FAIL
- concorrência: PASS/FAIL

Quality Gates:
- build: PASS/FAIL
- lint: PASS/FAIL
- testes aplicáveis: PASS/FAIL

Rastreabilidade:
- RF-024: ...
- RF-025: ...
- RN-013: ...
- RNF-009: ...
- ADR-006: ...

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

Próximo estado:
<estado>

Próxima TASK:
TASK-015 — somente após autorização explícita.
```

---

 # 36\. Estado final esperado

 Se todos os Gates forem aprovados:

```
TASK-014
    |
    v
DONE
```

 A conclusão da TASK-014 **não inicia automaticamente** a `TASK-015`.

 A execução deve parar após a atualização de:

```
TASKS.md
relatório de execução
rastreabilidade
estado da TASK-014
```
