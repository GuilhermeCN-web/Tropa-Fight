# TASK-020 — Notificações, Auditoria e Observabilidade

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-04 / HIGH\
 **Dependência:** `DEPENDS_ON: TASK-019`\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 # 1\. Identificação

 **ID:** TASK-020\
 **Nome:** Notificações, auditoria e observabilidade\
 **Fase:** PHASE-04\
 **Prioridade:** HIGH\
 **Estado inicial:** BLOCKED\
 **Dependência obrigatória:** `TASK-019 = DONE`

 **Relacionados:**

 - RF-026
- RF-038
- RNF-006
- RNF-011
- RNF-012
- UC-015
- TASK-004
- TASK-014
- TASK-015
- TASK-018
- TASK-019
- ADRs relacionados a auditoria, notificações e observabilidade

---

 # 2\. Objetivo

 Integrar e consolidar as capacidades de:

 - notificações;
- auditoria;
- logs estruturados;
- métricas;
- health checks;
- observabilidade operacional.

 A TASK deve transformar as abstrações criadas anteriormente em um conjunto operacional consistente, sem introduzir novos canais, regras comerciais ou funcionalidades fora do escopo.

 O resultado esperado é permitir que eventos relevantes do sistema sejam:

 1. identificados;
2. processados;
3. auditados quando aplicável;
4. notificados quando previsto;
5. observados operacionalmente;
6. diagnosticados sem exposição indevida de dados sensíveis.

---

 # 3\. Resultado esperado

 Ao final da TASK:

```
Eventos relevantes
      ↓
Processamento
      ├── Auditoria
      ├── Notificação
      └── Observabilidade
```

 deve possuir comportamento determinístico e testável.

 O sistema deve permitir responder:

```
O que aconteceu?
Quando aconteceu?
Em qual recurso?
Quem iniciou?
Qual foi o resultado?
Foi necessário notificar alguém?
Existe evidência operacional?
```

 sem exigir acesso direto ao banco para descobrir o comportamento básico da aplicação.

---

 # 4\. Escopo funcional

 A TASK cobre:

 - eventos relevantes já existentes;
- notificações previstas;
- auditoria de operações críticas;
- logs estruturados;
- métricas essenciais;
- health checks;
- tratamento de falhas observáveis;
- correlação operacional, quando já prevista pela arquitetura;
- proteção contra exposição de dados sensíveis em logs.

 Não cobre:

 - novos fluxos comerciais;
- novas regras de negócio;
- novos canais de comunicação não aprovados;
- sistemas de analytics;
- BI;
- recomendação;
- chat;
- CRM;
- automação de marketing;
- alteração de pagamentos;
- alteração do domínio comercial.

---

 # 5\. Dependência

 A TASK só pode entrar em `READY` quando:

```
TASK-019 = DONE
```

 Também devem estar disponíveis:

 - abstração de notificações da TASK-004;
- mecanismos de auditoria;
- eventos existentes;
- módulos administrativos;
- fluxo de pedidos;
- fluxo de pagamentos;
- fluxo de avaliações/moderação;
- configuração de observabilidade aprovada;
- decisões arquiteturais relevantes.

---

 # 6\. Definition of Ready

 Antes de iniciar:

 - [ ] `TASK-019 = DONE`;
- [ ] auditoria base existente;
- [ ] abstração de notificações existente;
- [ ] eventos relevantes identificados;
- [ ] requisitos de observabilidade conhecidos;
- [ ] canais de notificação aprovados conhecidos;
- [ ] dados sensíveis identificados;
- [ ] estrutura de logs disponível;
- [ ] ambiente de teste disponível;
- [ ] métricas aplicáveis definidas;
- [ ] health checks definidos;
- [ ] ADRs relacionados disponíveis;
- [ ] rastreabilidade disponível.

 Se alguma decisão crítica ainda não estiver aprovada, registrar o bloqueio antes da implementação.

---

 # 7\. ALLOWED\_CHANGES

 Permitido:

```
módulos notifications/**
módulos audit/**
módulos observability/**
configuração de logging
configuração de métricas
health checks
event handlers
adapters de notificação já aprovados
testes
docs/**
TASKS.md
```

 Também são permitidas alterações diretamente necessárias em módulos existentes para conectar:

 - eventos;
- auditoria;
- notificações;
- logs;
- métricas.

 Essas alterações devem ser mínimas e rastreáveis.

---

 # 8\. FORBIDDEN\_CHANGES

 É proibido:

 - criar novos canais de notificação sem aprovação;
- alterar regras comerciais;
- alterar preços;
- alterar pagamentos;
- alterar checkout;
- criar novos papéis;
- alterar RBAC;
- criar funcionalidades de CRM;
- criar marketing automation;
- criar chat;
- criar recomendação;
- registrar secrets;
- registrar senhas;
- registrar tokens;
- registrar dados sensíveis desnecessários;
- remover auditoria para simplificar implementação;
- alterar arquitetura relevante sem ADR;
- criar infraestrutura de produção não aprovada;
- alterar requisitos;
- absorver escopo da TASK-021;
- absorver escopo da TASK-022.

---

 # 9\. Eventos relevantes

 Identificar os eventos já existentes que devem gerar alguma combinação de:

```
AUDIT
NOTIFICATION
LOG
METRIC
```

 Exemplos possíveis, somente se já previstos pelos requisitos:

 | Evento | Auditoria | Notificação | Log | Métrica |
| --- | --- | --- | --- | --- |
| Pedido criado | conforme regra | conforme regra | sim | sim |
| Pagamento confirmado | sim | conforme regra | sim | sim |
| Pagamento recusado | sim | conforme regra | sim | sim |
| Pedido atualizado | conforme regra | conforme regra | sim | sim |
| Estoque ajustado | sim | conforme regra | sim | sim |
| Avaliação moderada | sim | conforme regra | sim | sim |
| Usuário administrativo alterado | sim | conforme regra | sim | sim |
| Cupom alterado | sim | conforme regra | sim | sim |
| Falha de integração | conforme regra | conforme regra | sim | sim |

A tabela final deve utilizar somente eventos efetivamente existentes no projeto.

---

 # 10\. Catálogo de eventos

 Criar ou consolidar um catálogo:

```
Event:
Nome:
Origem:
Payload:
Consumidores:
Auditoria:
Notificação:
Log:
Métrica:
Dados sensíveis:
Retry:
Idempotência:
```

 Exemplo:

```
Event:
OrderPaymentConfirmed

Origem:
Payment

Consumidores:
Order
Notification
Audit
Observability

Auditoria:
SIM

Notificação:
conforme regra aprovada

Dados sensíveis:
NÃO incluir dados financeiros sensíveis
```

---

 # 11\. Contrato de eventos

 Todo evento utilizado deve possuir contrato claro.

 Formato mínimo:

```
EventName
EventId
OccurredAt
AggregateId
ActorId, quando aplicável
CorrelationId, quando aplicável
Payload
Version
```

 Regras:

 - evento deve ser identificável;
- timestamp deve ser consistente;
- versão deve ser controlável quando aplicável;
- payload deve conter somente o necessário;
- dados sensíveis devem ser minimizados.

---

 # 12\. Idempotência de eventos

 Quando aplicável, consumidores devem suportar repetição.

 Cenário:

```
Evento recebido
      ↓
Processamento
      ↓
Falha/retry
      ↓
Mesmo evento recebido novamente
      ↓
Nenhum efeito duplicado indevido
```

 Testar especialmente notificações e auditoria quando houver retries.

---

 # 13\. Notificações

 Implementar as notificações já previstas no escopo.

 Para cada notificação:

```
Evento:
Destinatário:
Canal:
Template:
Condição:
Retry:
Falha:
Auditoria:
```

 Exemplo:

```
Evento:
Pagamento confirmado

Destinatário:
Cliente

Canal:
canal aprovado

Condição:
pagamento confirmado

Falha:
registrar falha observável
```

 Não inventar conteúdo comercial ou política de comunicação.

---

 # 14\. Abstração de notificações

 Preservar a arquitetura desacoplada:

```
Domain/Application
        ↓
NotificationPort
        ↓
NotificationAdapter
        ↓
Provider
```

 O domínio não deve depender diretamente de:

 - SDK específico;
- serviço externo;
- implementação concreta de transporte.

---

 # 15\. Falha de notificação

 Definir comportamento quando o envio falhar.

 O sistema deve:

 - registrar falha;
- permitir diagnóstico;
- respeitar retry aprovado;
- evitar duplicidade indevida;
- não comprometer transação principal quando isso não for requisito;
- não mascarar erro operacional.

 Cenário:

```
Pedido confirmado
      ↓
Notificação
      ↓
Provider indisponível
      ↓
Falha registrada
      ↓
Retry conforme política
```

 Não transformar falha de notificação em falha do pedido sem requisito explícito.

---

 # 16\. Auditoria

 Consolidar auditoria para operações críticas.

 Cada registro deve conter, conforme aplicável:

```
AuditId
ActorId
ActorType
Action
ResourceType
ResourceId
Timestamp
Result
Metadata mínima
CorrelationId
```

 Exemplos:

```
PRODUCT_UPDATED
INVENTORY_ADJUSTED
ORDER_STATUS_CHANGED
PAYMENT_STATUS_CHANGED
REVIEW_MODERATED
COUPON_UPDATED
ADMIN_USER_UPDATED
```

 Utilizar somente ações realmente existentes.

---

 # 17\. Auditoria de operações administrativas

 Verificar operações administrativas críticas:

 - produtos;
- estoque;
- pedidos;
- cupons;
- avaliações;
- usuários administrativos.

 Para cada operação:

```
Ação:
Ator:
Recurso:
Antes/depois, quando permitido:
Resultado:
Data:
CorrelationId:
```

 Não armazenar snapshots contendo dados pessoais ou secrets sem necessidade.

---

 # 18\. Integridade da auditoria

 Validar:

 - registro criado;
- timestamp;
- ator;
- recurso;
- ação;
- resultado;
- consulta autorizada;
- ausência de alteração indevida.

 Usuários administrativos comuns não devem possuir capacidade de apagar ou adulterar histórico de auditoria se isso contrariar a política definida.

---

 # 19\. Logs estruturados

 Padronizar logs relevantes.

 Formato recomendado:

```
{
  "timestamp": "...",
  "level": "INFO",
  "event": "ORDER_PAYMENT_CONFIRMED",
  "service": "...",
  "environment": "...",
  "correlationId": "...",
  "resourceId": "...",
  "result": "SUCCESS"
}
```

 O formato real deve seguir o padrão aprovado pelo projeto.

---

 # 20\. Níveis de log

 Definir uso consistente de:

```
DEBUG
INFO
WARN
ERROR
```

 Regras gerais:

 - `DEBUG`: diagnóstico não essencial;
- `INFO`: eventos operacionais relevantes;
- `WARN`: situação anormal recuperável;
- `ERROR`: falha que exige atenção.

 Não utilizar `ERROR` como mecanismo genérico para qualquer evento.

---

 # 21\. Proteção de dados nos logs

 Nunca registrar:

 - senha;
- token de autenticação;
- refresh token;
- segredo de integração;
- chave privada;
- dados de cartão;
- CVV;
- credenciais;
- payload financeiro sensível;
- dados pessoais além do necessário.

 Quando um identificador pessoal for necessário para diagnóstico, utilizar minimização ou mascaramento conforme política aprovada.

---

 # 22\. Logs de erro

 Toda falha relevante deve possuir contexto suficiente para diagnóstico:

```
erro
serviço
operação
resourceId
correlationId
timestamp
ambiente
```

 Evitar:

```
ERROR: something went wrong
```

 Preferir contexto operacional sem revelar dados sensíveis.

---

 # 23\. Correlação

 Quando suportado pela arquitetura, utilizar:

```
CorrelationId
```

 para acompanhar:

```
Request
 ↓
Application
 ↓
Event
 ↓
Audit
 ↓
Notification
```

 O mesmo identificador deve permitir correlacionar registros sem depender de dados pessoais.

---

 # 24\. Métricas

 Implementar apenas métricas relevantes ao escopo.

 Categorias:

 ### Aplicação

 - requisições;
- erros;
- latência.

 ### Negócio operacional

 - pedidos processados;
- pagamentos processados;
- notificações enviadas;
- notificações falhadas.

 ### Infraestrutura

 - health;
- disponibilidade;
- utilização relevante, quando disponível.

---

 # 25\. Métricas de erro

 Criar métricas para falhas relevantes:

```
notification_send_failure_total
payment_processing_failure_total
order_processing_failure_total
audit_write_failure_total
```

 Os nomes reais devem seguir a convenção do projeto.

 Não criar dezenas de métricas sem necessidade operacional.

---

 # 26\. Métricas de sucesso

 Quando aplicável:

```
notification_sent_total
payment_confirmed_total
order_created_total
audit_event_total
```

 Métricas devem representar eventos reais, não estimativas.

---

 # 27\. Métricas de latência

 Quando aplicável:

 - latência de API;
- processamento de eventos;
- envio de notificações;
- operações críticas.

 Registrar distribuição apropriada quando a stack suportar.

 Evitar depender apenas de média.

---

 # 28\. Health checks

 Implementar ou consolidar:

```
/health
```

 ou endpoint equivalente definido pela arquitetura.

 Distinguir, quando aplicável:

```
Liveness
Readiness
```

 ### Liveness

 Indica se o processo está vivo.

 ### Readiness

 Indica se a aplicação está apta a receber tráfego.

 Não utilizar health check como simples "retorna HTTP 200" sem verificar as dependências necessárias.

---

 # 29\. Dependências do health check

 Definir quais dependências devem ser verificadas:

 - banco;
- serviços essenciais;
- filas;
- providers críticos;

 somente conforme a arquitetura aprovada.

 Evitar que uma dependência externa não crítica derrube a aplicação inteira no readiness sem justificativa.

---

 # 30\. Comportamento em indisponibilidade

 Testar:

```
Database unavailable
Queue unavailable
Notification provider unavailable
Payment provider unavailable
```

 somente quando cada dependência estiver no escopo do sistema.

 Para cada cenário:

```
Componente:
Falha:
Comportamento esperado:
Health:
Log:
Métrica:
Recuperação:
```

---

 # 31\. Observabilidade de pagamentos

 Sem alterar o domínio de pagamento, garantir visibilidade de:

```
PaymentCreated
PaymentProcessing
PaymentConfirmed
PaymentFailed
WebhookReceived
WebhookRejected
```

 quando esses estados/eventos já existirem.

 Nunca registrar dados financeiros sensíveis.

---

 # 32\. Observabilidade de pedidos

 Garantir visibilidade de:

```
OrderCreated
OrderUpdated
OrderStatusChanged
OrderProcessingFailed
```

 quando aplicável.

---

 # 33\. Observabilidade de estoque

 Garantir visibilidade de operações críticas:

```
InventoryAdjusted
InventoryMovementCreated
InventoryOperationFailed
```

 quando existentes.

---

 # 34\. Observabilidade administrativa

 Operações administrativas críticas devem gerar:

```
Audit
+
Log operacional quando necessário
```

 Exemplo:

```
Admin updates product
      ↓
Audit record
      ↓
Structured log
      ↓
Metric, se aplicável
```

 Não duplicar dados desnecessariamente.

---

 # 35\. Tratamento de exceções

 Padronizar comportamento:

```
Exception
   ↓
capturada no boundary adequado
   ↓
log estruturado
   ↓
correlationId
   ↓
resposta segura
   ↓
métrica de erro
```

 Não retornar stack traces ao cliente em ambiente de produção.

---

 # 36\. Falhas de auditoria

 Definir comportamento explícito.

 Pergunta crítica:

```
Se a auditoria falhar,
a operação principal pode continuar?
```

 A resposta deve seguir o requisito e arquitetura aprovados.

 Não tomar uma decisão comercial/arquitetural nova implicitamente.

 Se não houver decisão registrada, abrir bloqueio/decisão antes de implementar comportamento crítico.

---

 # 37\. Falhas de observabilidade

 Observabilidade não deve causar indisponibilidade do sistema sem requisito explícito.

 Exemplo:

```
Métrica falha
    ↓
operação principal continua
    ↓
falha de observabilidade registrada
```

 O comportamento exato depende da arquitetura aprovada.

---

 # 38\. Testes unitários

 Cobrir:

 - criação de eventos;
- serialização;
- handlers;
- notificações;
- regras de retry;
- idempotência;
- auditoria;
- mascaramento;
- logging;
- métricas;
- health checks.

---

 # 39\. Testes de integração

 Cobrir:

```
Evento
 ↓
Handler
 ↓
Audit
 ↓
Notification
```

 e:

```
Request
 ↓
Application
 ↓
Log
 ↓
Metric
```

 Validar integração com adapters reais ou mocks conforme o ambiente.

---

 # 40\. Testes de falha

 Obrigatórios para cenários aplicáveis:

 - provider indisponível;
- timeout;
- retry;
- evento duplicado;
- evento inválido;
- falha de persistência de auditoria;
- erro de serialização;
- dependência indisponível.

---

 # 41\. Teste de ausência de dados sensíveis

 Executar verificações sobre:

 - logs;
- auditoria;
- eventos;
- erros;
- métricas.

 Confirmar ausência de:

```
password
token
secret
CVV
dados financeiros sensíveis
```

 e outros dados classificados como proibidos.

---

 # 42\. Teste de idempotência

 Cenário:

```
Evento E recebido
↓
processado
↓
Evento E recebido novamente
↓
processamento
```

 Resultado esperado:

```
nenhum efeito duplicado indevido
```

 Registrar evidência.

---

 # 43\. Teste de notificações

 Para cada notificação prevista:

```
Evento
↓
Condição satisfeita
↓
Notificação criada/enviada
↓
Resultado registrado
```

 Testar também:

```
Evento
↓
Condição não satisfeita
↓
Nenhuma notificação indevida
```

---

 # 44\. Teste de retry

 Validar política existente:

```
Tentativa 1
↓
FAIL
↓
Retry
↓
Tentativa 2
↓
SUCCESS
```

 Verificar que retries:

 - são limitados;
- não causam duplicidade;
- são observáveis;
- respeitam a política definida.

---

 # 45\. Teste de health check

 Executar:

```
Sistema saudável
→ READY
```

 e, quando aplicável:

```
Dependência crítica indisponível
→ NOT READY
```

 ou comportamento equivalente definido pela arquitetura.

---

 # 46\. Teste de observabilidade

 Gerar um evento conhecido e verificar:

```
Evento
↓
Log
↓
Métrica
↓
Auditoria
↓
Notificação, se aplicável
```

 Nem todo evento precisa necessariamente produzir os quatro artefatos.

 O comportamento deve corresponder ao catálogo de eventos.

---

 # 47\. Matriz de comportamento

 | Evento | Audit | Notification | Log | Metric |
| --- | --- | --- | --- | --- |
| Evento A | SIM/NÃO | SIM/NÃO | SIM | SIM/NÃO |
| Evento B | SIM/NÃO | SIM/NÃO | SIM | SIM/NÃO |
| Evento C | SIM/NÃO | SIM/NÃO | SIM | SIM/NÃO |

A matriz final deve ser derivada dos requisitos existentes.

---

 # 48\. Configuração por ambiente

 Verificar:

```
Development
Staging/Homologação
Production
```

 Para cada ambiente:

 - nível de log;
- providers;
- métricas;
- endpoints;
- secrets;
- URLs;
- flags;
- health checks.

 Não utilizar configuração de desenvolvimento em produção.

---

 # 49\. Secrets

 Secrets devem permanecer fora:

 - código;
- Git;
- logs;
- eventos;
- auditoria;
- métricas;
- documentação pública.

 Testes devem utilizar mecanismos seguros ou valores fictícios.

---

 # 50\. Documentação

 Atualizar:

```
docs/notifications/
docs/audit/
docs/observability/
docs/operations/
```

 conforme a estrutura existente.

 Documentar:

 - eventos;
- notificações;
- auditoria;
- logs;
- métricas;
- health checks;
- troubleshooting;
- falhas;
- retries;
- configuração.

---

 # 51\. Troubleshooting

 Criar procedimentos para:

 ## Notificação não enviada

```
1. localizar evento;
2. localizar correlationId;
3. consultar log;
4. consultar métrica;
5. verificar retry;
6. verificar provider;
7. identificar estado final.
```

 ## Auditoria ausente

```
1. localizar operação;
2. localizar correlationId;
3. consultar log;
4. verificar persistência;
5. identificar falha.
```

 ## Aplicação indisponível

```
1. verificar health;
2. verificar logs;
3. verificar dependências;
4. verificar métricas;
5. seguir procedimento operacional.
```

---

 # 52\. Matriz de permissões

 Caso exista interface administrativa de auditoria:

 | Ação | Cliente | Admin | Admin autorizado |
| --- | --- | --- | --- |
| Consultar próprio histórico | conforme regra | - | - |
| Consultar auditoria | NÃO | conforme permissão | SIM |
| Exportar auditoria | NÃO | conforme permissão | SIM |
| Alterar auditoria | NÃO | NÃO | NÃO |

Não criar permissões novas sem aprovação.

---

 # 53\. Privacidade

 Verificar:

 - minimização;
- acesso;
- retenção;
- mascaramento;
- logs;
- auditoria;
- notificações.

 A auditoria não deve ser utilizada como justificativa para armazenar dados pessoais desnecessários.

---

 # 54\. Retenção

 Documentar a política existente para:

 - logs;
- métricas;
- auditoria;
- eventos;
- notificações.

 Se a política ainda não tiver sido definida, registrar como decisão pendente em vez de inventar uma regra.

---

 # 55\. Performance

 Verificar impacto de:

 - logging;
- auditoria;
- eventos;
- métricas;
- notificações.

 Não permitir que instrumentação gere degradação significativa dos fluxos críticos sem justificativa.

 Testar especialmente:

```
checkout
pedido
pagamento
administração
```

---

 # 56\. Concorrência

 Validar cenários de concorrência quando aplicável:

```
Evento A
Evento A
Evento B
```

 Confirmar que:

 - auditoria não duplica indevidamente;
- notificações não são duplicadas;
- métricas permanecem coerentes;
- estado principal não é corrompido.

---

 # 57\. Segurança

 Verificar:

 - logs não expõem secrets;
- endpoints de observabilidade não expõem dados internos;
- métricas não revelam dados pessoais;
- auditoria possui autorização;
- health check não revela informações sensíveis;
- erros não expõem stack traces;
- notificações não vazam dados de outros usuários.

---

 # 58\. API e endpoints operacionais

 Se existirem endpoints para:

```
health
metrics
audit
notifications
```

 validar:

 - autenticação;
- autorização;
- exposição;
- formato;
- limites;
- dados retornados.

 Endpoints internos não devem ser públicos sem decisão explícita.

---

 # 59\. Critérios de aceitação

 A TASK-020 atende aos critérios quando:

 - [ ] notificações previstas estão integradas;
- [ ] eventos relevantes estão catalogados;
- [ ] auditoria cobre operações críticas;
- [ ] logs estruturados estão funcionando;
- [ ] métricas essenciais estão funcionando;
- [ ] health checks estão funcionando;
- [ ] falhas relevantes são observáveis;
- [ ] retries aplicáveis são testados;
- [ ] idempotência aplicável é testada;
- [ ] dados sensíveis não aparecem nos logs;
- [ ] auditoria possui autorização adequada;
- [ ] notificações não expõem dados indevidos;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de falha passam;
- [ ] documentação está atualizada;
- [ ] rastreabilidade está preservada;
- [ ] Scope Guard foi validado.

---

 # 60\. Quality Gates

 Consolidar:

 | Gate | Resultado | Evidência | Bloqueante |
| --- | --- | --- | --- |
| Build | PASS/FAIL | ... | SIM |
| Lint | PASS/FAIL | ... | SIM |
| Unit | PASS/FAIL | ... | SIM |
| Integration | PASS/FAIL | ... | SIM |
| Notifications | PASS/FAIL | ... | SIM |
| Audit | PASS/FAIL | ... | SIM |
| Structured Logs | PASS/FAIL | ... | SIM |
| Metrics | PASS/FAIL | ... | SIM |
| Health Checks | PASS/FAIL | ... | SIM |
| Failure Handling | PASS/FAIL | ... | SIM |
| Idempotency | PASS/FAIL | ... | conforme aplicabilidade |
| Security | PASS/FAIL | ... | SIM |
| Privacy | PASS/FAIL | ... | SIM |
| Documentation | PASS/FAIL | ... | SIM |
| Traceability | PASS/FAIL | ... | SIM |
| Scope Guard | PASS/FAIL | ... | SIM |

---

 # 61\. Falhas bloqueantes

 A TASK não pode ser marcada `DONE` se houver, por exemplo:

 - secrets em logs;
- auditoria crítica inexistente;
- acesso indevido à auditoria;
- notificação duplicada em cenário crítico;
- evento duplicado causando efeito comercial indevido;
- health check crítico incorreto;
- ausência de observabilidade em fluxo operacional obrigatório;
- falha de build;
- falha de testes obrigatórios;
- violação de `FORBIDDEN_CHANGES`.

---

 # 62\. Correções incidentais

 Correções diretamente causadas pela TASK são permitidas.

 Exemplo:

```
Falha:
ORDER_STATUS_CHANGED não gera auditoria.

Correção:
conectar evento existente ao AuditService.

Teste:
verificar criação do AuditLog.

Revalidação:
evento → audit → PASS.
```

 Não usar a falha como justificativa para reestruturar todo o módulo.

---

 # 63\. Scope Guard

 Para cada alteração:

```
É necessária para notificações?
É necessária para auditoria?
É necessária para observabilidade?
É diretamente causada pela TASK?
Está em ALLOWED_CHANGES?
Não altera requisito?
Não cria funcionalidade nova?
Não altera arquitetura sem ADR?
Possui teste?
Possui rastreabilidade?
```

 Se alguma resposta crítica for `NÃO`:

```
NÃO IMPLEMENTAR
```

 Registrar como pendência ou demanda separada.

---

 # 64\. Arquivos e artefatos esperados

 Exemplos:

```
src/.../notifications/**
src/.../audit/**
src/.../observability/**
tests/.../notifications/**
tests/.../audit/**
tests/.../observability/**
docs/notifications/**
docs/audit/**
docs/observability/**
docs/operations/**
TASKS.md
```

 Os caminhos reais devem seguir a estrutura criada pelas TASKs anteriores.

---

 # 65\. Testes mínimos esperados

```
T020-UNIT-001
Criação de evento

T020-UNIT-002
Processamento de notificação

T020-UNIT-003
Registro de auditoria

T020-UNIT-004
Mascaramento de dados sensíveis

T020-UNIT-005
Retry

T020-UNIT-006
Idempotência

T020-INT-001
Evento → Auditoria

T020-INT-002
Evento → Notificação

T020-INT-003
Evento → Observabilidade

T020-INT-004
Falha de provider

T020-INT-005
Health check

T020-SEC-001
Ausência de secrets nos logs

T020-SEC-002
Acesso à auditoria

T020-E2E-001
Fluxo crítico com auditoria/notificação
```

 Os testes devem ser adaptados aos módulos e contratos efetivamente existentes.

---

 # 66\. Matriz de rastreabilidade

 | Requisito | Implementação | Teste | Evidência | Resultado |
| --- | --- | --- | --- | --- |
| RF-026 | ... | ... | ... | PASS/FAIL |
| RF-038 | ... | ... | ... | PASS/FAIL |
| RNF-006 | ... | ... | ... | PASS/FAIL |
| RNF-011 | ... | ... | ... | PASS/FAIL |
| RNF-012 | ... | ... | ... | PASS/FAIL |
| UC-015 | ... | ... | ... | PASS/FAIL |

Adicionar todos os requisitos aplicáveis.

---

 # 67\. Relatório de execução

 Produzir:

```
TASK-020 EXECUTION REPORT

TASK:
TASK-020

Nome:
Notificações, auditoria e observabilidade

Estado inicial:
BLOCKED

Dependência:
TASK-019 = DONE

Estado final:
DONE / FAILED / BLOCKED

Build:
PASS/FAIL

Lint:
PASS/FAIL

Unit:
PASS/FAIL

Integration:
PASS/FAIL

Notifications:
PASS/FAIL

Audit:
PASS/FAIL

Logs:
PASS/FAIL

Metrics:
PASS/FAIL

Health:
PASS/FAIL

Failure Handling:
PASS/FAIL

Idempotency:
PASS/FAIL

Security:
PASS/FAIL

Privacy:
PASS/FAIL

Documentation:
PASS/FAIL

Traceability:
PASS/FAIL

Scope Guard:
PASS/FAIL

Alterações realizadas:
...

Testes adicionados:
...

Documentação atualizada:
...

Incidentes/falhas encontradas:
...

Correções incidentais:
...

Pendências:
...

Riscos:
...

Evidências:
...

Arquivos alterados:
...

Decision:
DONE / FAILED / BLOCKED

Observações:
...

TASKS.md:
ATUALIZADO
```

---

 # 68\. Definition of Done específica

 A TASK-020 somente pode ser marcada `DONE` quando:

```
TASK-019 = DONE
AND
notificações previstas integradas
AND
auditoria crítica integrada
AND
logs estruturados funcionando
AND
métricas essenciais funcionando
AND
health checks funcionando
AND
falhas relevantes observáveis
AND
idempotência aplicável validada
AND
retry aplicável validado
AND
dados sensíveis protegidos
AND
testes unitários aprovados
AND
testes de integração aprovados
AND
testes de segurança aplicáveis aprovados
AND
documentação atualizada
AND
rastreabilidade preservada
AND
ALLOWED_CHANGES respeitado
AND
FORBIDDEN_CHANGES não violado
AND
Scope Guard aprovado
AND
DoD global atendido
AND
relatório de execução produzido
AND
TASKS.md atualizado
```

---

 # 69\. Atualização do TASKS.md

 Ao finalizar, alterar somente o estado correspondente à TASK-020, salvo alterações de rastreabilidade diretamente necessárias.

 Sucesso:

```
| 20 | TASK-020 | PHASE-04 | HIGH | TASK-019 | DONE |
```

 Falha:

```
| 20 | TASK-020 | PHASE-04 | HIGH | TASK-019 | FAILED |
```

 Bloqueio:

```
| 20 | TASK-020 | PHASE-04 | HIGH | TASK-019 | BLOCKED |
```

 A justificativa deve estar no relatório de execução.

---

 # 70\. Relação com TASK-021

 A TASK-020 deve entregar uma base observável para a TASK-021.

 Espera-se que a TASK-021 consiga validar:

```
Segurança
      ↓
Logs
      ↓
Auditoria
      ↓
Métricas
      ↓
Health
      ↓
E2E
```

 Entretanto:

 **TASK-020 não deve executar antecipadamente o escopo da TASK-021.**

 Não transformar esta TASK em:

 - pentest completo;
- auditoria de segurança completa;
- campanha completa de acessibilidade;
- suíte final de E2E.

 Esses itens pertencem à TASK-021.

---

 # 71\. Relação com TASK-022

 A TASK-020 deve fornecer evidências para o checkpoint final da TASK-022:

```
TASK-020
   ↓
Observabilidade
Auditoria
Notificações
   ↓
TASK-021
   ↓
Validação transversal
   ↓
TASK-022
   ↓
Readiness
```

 A TASK-020 não decide readiness de lançamento.

---

 # 72\. Política de parada

 Após concluir:

```
TASK-020 = DONE
```

 parar.

 Não iniciar automaticamente:

```
TASK-021
```

 Não executar melhorias adicionais.

 Não antecipar a TASK-022.

 A próxima TASK somente poderá ser iniciada mediante autorização explícita e após confirmação de que sua Definition of Ready foi satisfeita.

---

 # 73\. Gate final da TASK-020

```
TASK-019 = DONE
        ↓
Definition of Ready
        ↓
Implementar integrações
        ↓
Executar testes
        ↓
Validar notificações
        ↓
Validar auditoria
        ↓
Validar logs
        ↓
Validar métricas
        ↓
Validar health checks
        ↓
Validar falhas/retries/idempotência
        ↓
Validar segurança/privacidade
        ↓
Atualizar documentação
        ↓
Validar rastreabilidade
        ↓
Scope Guard
        ↓
Definition of Done
        ↓
TASK-020 = DONE
        ↓
PARAR E AGUARDAR AUTORIZAÇÃO
```

---

 # 74\. Resultado final esperado

 A TASK-020 deve deixar o Tropa Fight com uma camada operacional capaz de responder, com evidências:

```
✓ Eventos relevantes são identificáveis.
✓ Operações críticas são auditáveis.
✓ Notificações previstas são processadas.
✓ Falhas de notificação são observáveis.
✓ Logs possuem estrutura consistente.
✓ Dados sensíveis não são expostos nos logs.
✓ Métricas essenciais existem.
✓ Health checks funcionam.
✓ Falhas relevantes podem ser diagnosticadas.
✓ Retries aplicáveis são controlados.
✓ Eventos repetidos não geram efeitos indevidos.
✓ Auditoria possui proteção adequada.
✓ Testes cobrem os cenários críticos.
✓ Documentação está atualizada.
✓ Rastreabilidade está preservada.
✓ Nenhum escopo da TASK-021/TASK-022 foi absorvido.
```

 **Condição de encerramento:** `TASK-020 = DONE` somente após todos os Gates obrigatórios passarem e o relatório de execução estar produzido.

 A sequência permanece estrita: **`TASK-019 → TASK-020 → TASK-021 → TASK-022`**. A conclusão da `TASK-020` não dispara automaticamente a `TASK-021`.