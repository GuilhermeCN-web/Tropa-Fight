# TASK-004 — Auditoria, privacidade e notificações base

 ## 1\. Identificação

 - **ID:** TASK-004
- **Título:** Auditoria, privacidade e notificações base
- **Status:** BLOCKED
- **Phase:** PHASE-01
- **Priority:** HIGH
- **Tipo:** Audit / Privacy / Notifications / Security / Infrastructure
- **Dependência:** TASK-003
- **Bloqueia:** TASK-005
- **Relacionados:** RF-023, RF-024, RF-026, RNF-006, RNF-007, RNF-008

---

 # 2\. Objetivo

 Criar as fundações técnicas para:

 - auditoria de ações relevantes;
- proteção de dados pessoais;
- controle de acesso aos registros de auditoria;
- eventos internos;
- notificações desacopladas;
- abstração de canais de notificação;
- tratamento seguro de dados sensíveis;
- preparação para integração futura com provedores externos.

 A TASK não deve implementar políticas jurídicas não aprovadas nem integrações reais de comunicação sem decisão específica.

 A arquitetura deve permitir que módulos futuros emitam eventos e solicitem notificações sem depender diretamente de um provedor externo.

---

 # 3\. Resultado esperado

 Ao final desta TASK, o sistema deverá possuir:

```
Application
    ↓
Domain Event / Notification Request
    ↓
Abstração
    ↓
Notification Provider
```

 E:

```
Ação relevante
    ↓
Audit Event
    ↓
AuditLog
    ↓
Persistência
    ↓
Consulta autorizada
```

 Além disso, dados sensíveis deverão possuir regras explícitas de:

 - armazenamento;
- exposição;
- logging;
- acesso administrativo;
- retenção, quando já definida.

---

 # 4\. Dependências

```
TASK-001
   ↓
TASK-003
   ↓
TASK-004
   ↓
TASK-005
```

 A TASK-003 deve estar concluída.

---

 # 5\. Condição para desbloqueio

 Antes do desenvolvimento:

 - [ ] TASK-003 está `DONE`.
- [ ] modelo de identidade está disponível;
- [ ] autenticação está funcional;
- [ ] autorização/RBAC está disponível;
- [ ] requisitos de privacidade aprovados estão documentados;
- [ ] eventos que exigem auditoria estão identificados;
- [ ] política de retenção conhecida ou explicitamente marcada como pendente;
- [ ] canais de notificação aprovados estão identificados;
- [ ] nenhuma integração externa será presumida como aprovada.

---

 # 6\. Referências

 ## Requisitos funcionais

 - RF-023
- RF-024
- RF-026

 ## Requisitos não funcionais

 - RNF-006
- RNF-007
- RNF-008

 ## Dependências

 - TASK-003

---

 # 7\. Escopo

 ## Incluído

 - AuditLog;
- eventos de auditoria;
- persistência de auditoria;
- consulta autorizada de auditoria;
- classificação básica de eventos;
- proteção de dados sensíveis;
- abstração de notificações;
- eventos de notificação;
- NotificationService/port equivalente;
- adapters substituíveis;
- testes;
- documentação;
- preparação para canais futuros.

---

 # 8\. Fora do escopo

 Não implementar:

 - política jurídica inventada;
- política definitiva de retenção sem aprovação;
- exclusão definitiva de dados sem regra aprovada;
- integração real de e-mail sem decisão;
- SMS real;
- WhatsApp;
- push notification;
- provedor externo não aprovado;
- marketing;
- newsletter;
- campanhas;
- segmentação de clientes;
- sistema de CRM;
- templates comerciais;
- catálogo;
- carrinho;
- checkout;
- pagamento;
- estoque;
- pedidos;
- novas roles não aprovadas.

---

 # 9\. ALLOWED\_CHANGES

 Permitido alterar:

```
src/modules/audit/**
src/modules/notifications/**
src/modules/privacy/**
src/shared/events/**
persistência correspondente
tests/**
configuração necessária
docs/**
TASKS.md
```

 A estrutura deve respeitar a arquitetura definida em TASK-001.

---

 # 10\. FORBIDDEN\_CHANGES

 É proibido:

 - armazenar segredos em logs;
- registrar senha;
- registrar passwordHash;
- registrar tokens de autenticação;
- registrar tokens de recuperação;
- registrar dados de cartão;
- criar política jurídica por conta própria;
- apagar permanentemente dados sem regra aprovada;
- enviar notificações reais sem integração aprovada;
- acoplar domínio diretamente a provedor externo;
- permitir acesso irrestrito aos logs;
- permitir que usuário comum consulte auditoria administrativa;
- modificar RBAC de TASK-003 sem decisão;
- implementar funcionalidades comerciais.

---

 # 11\. Arquitetura desejada

 A arquitetura deve preservar o desacoplamento:

```
                    ┌─────────────────┐
                    │     Domain      │
                    └────────┬────────┘
                             │
                       Domain Event
                             │
                             ▼
                    ┌─────────────────┐
                    │   Application   │
                    └───────┬─────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
        Audit Service              Notification Port
              │                           │
              ▼                           ▼
        Audit Repository          Notification Adapter
              │                           │
              ▼                           ▼
          Database                 Provider / Mock
```

 O domínio não deve conhecer detalhes de:

 - SMTP;
- provedor de e-mail;
- API de terceiros;
- infraestrutura específica.

---

 # 12\. Auditoria

 ## Objetivo

 Registrar ações relevantes que tenham impacto em:

 - segurança;
- administração;
- identidade;
- dados pessoais;
- operações críticas.

 O log deve responder:

```
Quem?
Fez o quê?
Quando?
Sobre qual recurso?
Qual foi o resultado?
De onde veio a ação?
```

 Quando aplicável:

```
Por quê?
```

 somente se essa informação estiver disponível e for necessária.

---

 # 13\. Entidade AuditLog

 Modelo conceitual:

```
AuditLog
├── id
├── actorId
├── action
├── resourceType
├── resourceId
├── result
├── timestamp
├── source
├── metadata
└── correlationId
```

 Os campos definitivos devem respeitar os requisitos do projeto.

---

 # 14\. Campos obrigatórios

 | Campo | Obrigatório | Objetivo |
| --- | --- | --- |
| id | Sim | Identificação |
| action | Sim | Ação realizada |
| timestamp | Sim | Momento |
| result | Sim | Resultado |
| actorId | Conforme ação | Autor |
| resourceType | Conforme ação | Tipo do recurso |
| resourceId | Conforme ação | Recurso afetado |
| correlationId | Recomendado | Rastreamento |
| metadata | Não | Contexto seguro |

---

 # 15\. Actor

 O `actorId` deve identificar quem iniciou a ação quando isso for conhecido.

 Possíveis valores conceituais:

```
USER
ADMIN
SYSTEM
ANONYMOUS
```

 Não criar identidades artificiais desnecessárias.

 Para processos automáticos, utilizar um identificador de sistema claramente distinguível de um usuário humano.

---

 # 16\. Actions

 As ações devem ser padronizadas.

 Exemplos:

```
AUTH_LOGIN
AUTH_LOGIN_FAILED
AUTH_LOGOUT
AUTH_PASSWORD_RESET
USER_CREATED
USER_UPDATED
USER_ROLE_CHANGED
ADMIN_ACCESS
```

 Somente ações realmente relevantes devem ser registradas.

 Não criar um evento de auditoria para cada operação trivial sem justificativa.

---

 # 17\. Result

 Usar uma representação consistente, por exemplo:

```
SUCCESS
FAILURE
DENIED
```

 Isso permite distinguir:

```
ação executada
```

 de:

```
tentativa bloqueada
```

---

 # 18\. Resource

 Quando uma ação afetar uma entidade, registrar:

```
resourceType
resourceId
```

 Exemplo:

```
{
  "resourceType": "User",
  "resourceId": "..."
}
```

 Nunca registrar dados pessoais completos dentro desses campos.

---

 # 19\. Metadata

 Metadata deve conter somente informações necessárias.

 Permitido, dependendo do caso:

```
requestId
correlationId
userAgent
source
reasonCode
```

 Evitar:

```
password
passwordHash
accessToken
refreshToken
resetToken
cardNumber
CVV
```

---

 # 20\. Sanitização

 Criar mecanismo centralizado para sanitizar informações antes de serem enviadas ao log.

 Exemplo conceitual:

```
AuditService
     ↓
Sanitizer
     ↓
AuditRepository
```

 Não depender de cada desenvolvedor lembrar manualmente quais campos são sensíveis.

---

 # 21\. Dados que nunca devem ser registrados

 No mínimo:

 - senha;
- passwordHash;
- tokens de autenticação;
- tokens de recuperação;
- secrets;
- chaves privadas;
- credenciais;
- CVV;
- dados completos de cartão;
- cookies de autenticação;
- headers de autorização.

 Caso novos dados sensíveis sejam introduzidos no projeto, eles também devem entrar na política de sanitização.

---

 # 22\. IP e User-Agent

 Se requisitos aprovados permitirem armazenamento de:

 - IP;
- User-Agent;

 deve-se documentar:

 - finalidade;
- necessidade;
- acesso;
- retenção;
- proteção.

 Não coletar dados adicionais apenas porque tecnicamente é possível.

---

 # 23\. Consulta de auditoria

 A consulta de auditoria deve ser restrita.

 Modelo:

```
Authenticated Admin
        ↓
Permission
        ↓
Audit Query
        ↓
Filtered Audit Logs
```

 Usuários comuns não devem ter acesso aos logs administrativos.

---

 # 24\. Filtros de auditoria

 Quando necessário, permitir filtros por:

 - período;
- actor;
- action;
- resourceType;
- resourceId;
- result.

 Filtros adicionais somente quando houver necessidade real.

---

 # 25\. Paginação

 A consulta de auditoria deve possuir paginação.

 Evitar:

```
GET /audit-logs
```

 retornando quantidade ilimitada de registros.

 Modelo:

```
page
pageSize
cursor
```

 conforme o padrão da aplicação.

---

 # 26\. Integridade dos logs

 Os logs devem ser:

 - persistidos de forma consistente;
- protegidos contra alteração não autorizada;
- protegidos contra exclusão não autorizada.

 Qualquer mecanismo de alteração ou remoção deverá depender de política aprovada.

---

 # 27\. Retenção

 A retenção deve ser explicitamente classificada como:

```
DEFINED
```

 ou:

```
PENDING
```

 Se não houver decisão aprovada:

 > Não inventar prazo de retenção.

 A aplicação pode preparar o modelo para suportar retenção futura sem executar exclusões automaticamente.

---

 # 28\. Exclusão de auditoria

 Não implementar exclusão definitiva de AuditLog nesta TASK sem requisito explícito.

 Especialmente:

```
DELETE /audit-logs/:id
```

 não deve existir apenas por conveniência administrativa.

---

 # 29\. Privacidade

 A privacidade deve ser tratada como requisito técnico, não como substituição de orientação jurídica.

 A implementação deve minimizar:

```
coleta
↓
armazenamento
↓
exposição
```

---

 # 30\. Princípio de minimização

 Para cada dado armazenado, responder:

 1. É necessário?
2. Qual módulo precisa dele?
3. Quem pode acessá-lo?
4. Por quanto tempo precisa existir?
5. Pode ser substituído por identificador?

 Se não houver justificativa, não adicionar o campo.

---

 # 31\. Controle de acesso a dados pessoais

 Dados pessoais devem seguir:

```
User
 ↓
Authentication
 ↓
Authorization
 ↓
Resource ownership / permission
 ↓
Data access
```

 Não expor dados simplesmente porque estão disponíveis no banco.

---

 # 32\. Dados retornados pela API

 Responses devem evitar exposição de:

 - informações internas;
- metadata desnecessária;
- identificadores internos desnecessários;
- segredos;
- dados de outros usuários.

 Criar DTOs/serializers apropriados quando necessário.

---

 # 33\. Notificações

 A infraestrutura de notificações deve ser baseada em abstração.

 Modelo:

```
NotificationService
        ↓
NotificationPort
        ↓
Adapter
```

 Exemplo:

```
EmailNotificationAdapter
SmsNotificationAdapter
PushNotificationAdapter
```

 Os adapters reais somente devem existir quando aprovados.

---

 # 34\. Contrato de notificação

 Criar contrato equivalente a:

```
send(notification)
```

 com informações como:

```
recipient
type
template
payload
metadata
```

 O contrato definitivo depende da arquitetura.

---

 # 35\. Domain/Application Event

 Exemplo conceitual:

```
UserRegistered
UserPasswordReset
AdminActionPerformed
```

 O evento deve transportar apenas dados necessários.

 Nunca colocar:

```
password
token
secret
```

 no evento.

---

 # 36\. Desacoplamento

 Evitar:

```
UserService
   ↓
SMTPClient
```

 Preferir:

```
UserService
   ↓
NotificationService
   ↓
NotificationPort
   ↓
SMTP Adapter
```

 Isso permite substituir o provedor sem modificar regras de negócio.

---

 # 37\. Notification Types

 Criar somente os tipos necessários para os requisitos atuais.

 Exemplos conceituais:

```
ACCOUNT_CREATED
PASSWORD_RESET_REQUESTED
PASSWORD_CHANGED
```

 Notificações comerciais futuras deverão ser adicionadas pelas respectivas tasks.

---

 # 38\. Templates

 Se templates forem necessários nesta TASK, devem ser mínimos e neutros.

 Não criar:

 - campanhas;
- marketing;
- newsletter;
- upsell;
- promoções;
- conteúdo comercial.

---

 # 39\. Falha de notificação

 A falha de uma notificação não deve necessariamente comprometer uma operação de domínio.

 Exemplo:

```
Password changed
      ↓
Persistência concluída
      ↓
Notification attempted
      ↓
Provider unavailable
```

 O comportamento deve seguir a política arquitetural aprovada.

 Quando necessário, usar:

```
retry
queue
outbox
```

 somente se isso estiver previsto.

 Não introduzir infraestrutura distribuída sem necessidade.

---

 # 40\. Idempotência

 Eventos/notificações que possam ser processados mais de uma vez devem possuir estratégia de idempotência quando aplicável.

 Exemplo:

```
eventId
notificationId
deduplicationKey
```

 Não enviar duas notificações idênticas apenas porque o evento foi reprocessado.

---

 # 41\. Observabilidade

 A TASK-020 posteriormente consolidará observabilidade.

 Nesta TASK, deve-se preparar:

 - correlationId;
- requestId;
- identificação de eventos;
- erros de notificação;
- falhas de auditoria.

 Não criar um sistema completo de observabilidade antecipadamente.

---

 # 42\. Falha de auditoria

 A aplicação precisa definir o comportamento caso o registro de auditoria falhe.

 Existem duas possibilidades conceituais:

```
Operação
   ↓
Audit obrigatório
   ↓
Falha
   ↓
Operação falha
```

 ou:

```
Operação
   ↓
Sucesso
   ↓
Audit assíncrono
```

 A decisão deve seguir a criticidade do evento e a arquitetura aprovada.

 Para eventos de segurança críticos, não assumir que auditoria é opcional.

---

 # 43\. Consistência da auditoria

 Para ações críticas, avaliar uso de transação:

```
Operação
   +
AuditLog
   ↓
Commit
```

 O objetivo é evitar:

```
ação realizada
+
nenhum registro de auditoria
```

 quando a rastreabilidade for requisito obrigatório.

---

 # 44\. Testes unitários — Auditoria

 Criar testes para:

 - [ ] criação de AuditLog;
- [ ] action válida;
- [ ] timestamp;
- [ ] actor;
- [ ] resource;
- [ ] result;
- [ ] correlationId;
- [ ] metadata;
- [ ] sanitização;
- [ ] campos proibidos;
- [ ] eventos de sistema;
- [ ] eventos anônimos.

---

 # 45\. Testes unitários — Privacidade

 Validar:

 - [ ] dados sensíveis não aparecem em DTO;
- [ ] dados sensíveis não aparecem em logs;
- [ ] usuário não acessa dados de outro usuário;
- [ ] campos internos não são serializados;
- [ ] dados desnecessários não são coletados.

---

 # 46\. Testes unitários — Notificações

 Validar:

 - [ ] contrato de notificação;
- [ ] criação de evento;
- [ ] adapter mock;
- [ ] destinatário correto;
- [ ] template correto;
- [ ] payload sanitizado;
- [ ] falha do provider;
- [ ] idempotência quando aplicável.

---

 # 47\. Testes de integração

 Validar:

 - [ ] ação administrativa gera auditoria;
- [ ] login relevante gera auditoria quando definido;
- [ ] alteração de senha gera evento apropriado;
- [ ] consulta de auditoria respeita autorização;
- [ ] notificação é encaminhada ao adapter;
- [ ] provider real não é necessário para os testes;
- [ ] dados sensíveis permanecem protegidos.

---

 # 48\. Testes de API

 ## Auditoria

 - [ ] acesso autorizado;
- [ ] acesso não autorizado;
- [ ] filtros;
- [ ] paginação;
- [ ] resource filter;
- [ ] action filter;
- [ ] date filter.

 ## Privacidade

 - [ ] usuário não acessa dados de outro usuário;
- [ ] response não contém campos proibidos.

 ## Notificações

 Se houver endpoint administrativo ou operacional:

 - [ ] autorização;
- [ ] validação;
- [ ] payload;
- [ ] tratamento de falha.

---

 # 49\. Testes de segurança

 Obrigatórios:

 - [ ] usuário comum não consulta auditoria;
- [ ] admin sem permission adequada não consulta auditoria;
- [ ] usuário não altera AuditLog;
- [ ] usuário não exclui AuditLog;
- [ ] tokens não aparecem nos logs;
- [ ] senhas não aparecem nos logs;
- [ ] secrets não aparecem nos logs;
- [ ] dados de outro usuário não são expostos;
- [ ] metadata não permite injection em logs;
- [ ] notification payload não expõe dados sensíveis.

---

 # 50\. Teste de sanitização

 Criar teste explícito semelhante a:

```
Input:
{
  password: "...",
  accessToken: "...",
  resetToken: "...",
  email: "user@example.com"
}
```

 Resultado esperado:

```
{
  password: "[REDACTED]",
  accessToken: "[REDACTED]",
  resetToken: "[REDACTED]",
  email: "user@example.com"
}
```

 O formato de mascaramento deve ser padronizado.

---

 # 51\. Teste de autorização de auditoria

 ### Cenário

```
Customer
    ↓
GET /admin/audit-logs
```

 Resultado:

```
403
```

 ou resposta equivalente conforme contrato.

 Admin autorizado:

```
Admin
    ↓
permission
    ↓
GET /admin/audit-logs
```

 Resultado:

```
200
```

---

 # 52\. Critérios de aceitação

 ## AC-001 — Auditoria

 **Dado** uma ação relevante,

 **Quando** ela for executada,

 **Então** o sistema deverá registrar um evento de auditoria conforme a política definida.

---

 ## AC-002 — Identificação

 **Dado** uma ação realizada por usuário autenticado,

 **Quando** o evento for persistido,

 **Então** o ator deverá ser identificável.

---

 ## AC-003 — Ação administrativa

 **Dado** uma operação administrativa auditável,

 **Quando** ela ocorrer,

 **Então** deverá existir registro contendo ação, ator, recurso e resultado conforme aplicável.

---

 ## AC-004 — Sanitização

 **Dado** um payload contendo dados sensíveis,

 **Quando** ele passar pelo mecanismo de auditoria/logging,

 **Então** os dados proibidos não deverão ser persistidos.

---

 ## AC-005 — Acesso à auditoria

 **Dado** um usuário sem permission adequada,

 **Quando** consultar os logs,

 **Então** o acesso deverá ser rejeitado.

---

 ## AC-006 — Consulta autorizada

 **Dado** um administrador com permission adequada,

 **Quando** consultar os logs,

 **Então** deverá receber somente os registros permitidos.

---

 ## AC-007 — Paginação

 **Dado** grande quantidade de registros,

 **Quando** consultar auditoria,

 **Então** o resultado deverá ser paginado.

---

 ## AC-008 — Privacidade

 **Dado** um usuário,

 **Quando** consultar seu próprio perfil ou dados autorizados,

 **Então** somente os campos permitidos deverão ser retornados.

---

 ## AC-009 — Notificação

 **Dado** um evento que exige notificação,

 **Quando** o evento for processado,

 **Então** deverá ser utilizado o contrato de notificação desacoplado.

---

 ## AC-010 — Provider

 **Dado** um adapter de notificação mockado,

 **Quando** uma notificação for enviada,

 **Então** o sistema deverá funcionar sem depender de um provedor externo real.

---

 ## AC-011 — Falha do provider

 **Dado** um provider indisponível,

 **Quando** uma notificação for processada,

 **Então** o comportamento deverá seguir a estratégia aprovada sem expor dados sensíveis.

---

 ## AC-012 — Idempotência

 **Dado** o mesmo evento processado novamente,

 **Quando** a política exigir idempotência,

 **Então** a mesma notificação não deverá ser enviada novamente de forma indevida.

---

 # 53\. Eventos mínimos

 Registrar e revisar os eventos necessários para esta fase.

 ### Identidade

```
USER_REGISTERED
USER_LOGIN_SUCCESS
USER_LOGIN_FAILED
USER_LOGOUT
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
PASSWORD_CHANGED
```

 ### Administração

```
ADMIN_ACTION
USER_PERMISSION_CHANGED
USER_ROLE_CHANGED
```

 Os nomes são exemplos e devem ser ajustados ao padrão do projeto.

 Não implementar eventos que não tenham consumidor ou finalidade.

---

 # 54\. Matriz de eventos

 | Evento | Auditoria | Notificação | Dados sensíveis |
| --- | --- | --- | --- |
| USER\_REGISTERED | Sim/Conforme requisito | Conforme requisito | Não |
| LOGIN\_SUCCESS | Conforme requisito | Não | Não |
| LOGIN\_FAILED | Conforme requisito | Não | Não |
| LOGOUT | Conforme requisito | Não | Não |
| PASSWORD\_RESET\_REQUESTED | Sim | Conforme requisito | Não |
| PASSWORD\_RESET\_COMPLETED | Sim | Conforme requisito | Não |
| PASSWORD\_CHANGED | Sim | Conforme requisito | Não |
| ADMIN\_ACTION | Sim | Não | Não |

---

 # 55\. Retenção e ciclo de vida

 Documentar explicitamente:

```
AuditLog
    ↓
Created
    ↓
Retained
    ↓
[Retention policy]
    ↓
[Deletion/Archive]
```

 Se a política ainda não estiver aprovada:

```
Retention = PENDING
Deletion = NOT_IMPLEMENTED
```

---

 # 56\. Privacidade — checklist

 - [ ] Dados coletados são necessários.
- [ ] Dados pessoais possuem finalidade conhecida.
- [ ] Dados não são duplicados desnecessariamente.
- [ ] Dados sensíveis possuem proteção.
- [ ] Respostas não expõem informações internas.
- [ ] Logs são sanitizados.
- [ ] Auditoria possui controle de acesso.
- [ ] Retenção está documentada.
- [ ] Exclusão automática não ocorre sem regra.
- [ ] Processamento externo não ocorre sem aprovação.

---

 # 57\. Notificações — checklist

 - [ ] Contrato definido.
- [ ] Interface/port definida.
- [ ] Adapter mock disponível.
- [ ] Provider real não é obrigatório.
- [ ] Eventos possuem identificador.
- [ ] Payload é sanitizado.
- [ ] Falhas são tratadas.
- [ ] Retry somente se aprovado.
- [ ] Idempotência avaliada.
- [ ] Nenhum segredo é transmitido indevidamente.
- [ ] Dependência com domínio está desacoplada.

---

 # 58\. Estrutura sugerida

 Exemplo conceitual:

```
src/
├── modules/
│   ├── audit/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   └── repositories/
│   │   ├── application/
│   │   │   ├── services/
│   │   │   └── use-cases/
│   │   └── infrastructure/
│   │       ├── persistence/
│   │       └── repositories/
│   │
│   ├── notifications/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │       ├── adapters/
│   │       └── providers/
│   │
│   └── privacy/
│       ├── application/
│       └── domain/
│
└── shared/
    └── events/
```

 A estrutura definitiva deve respeitar TASK-001.

---

 # 59\. Banco de dados

 Modelo conceitual:

```
audit_logs
├── id
├── actor_id
├── action
├── resource_type
├── resource_id
├── result
├── timestamp
├── correlation_id
├── source
└── metadata
```

 Para notificações, caso persistência seja necessária:

```
notifications
├── id
├── event_id
├── type
├── recipient
├── status
├── created_at
├── processed_at
└── metadata
```

 A tabela `notifications` não deve ser criada apenas por antecipação se a arquitetura escolhida não exigir persistência.

---

 # 60\. Índices

 Quando aplicável:

```
audit_logs.actor_id
audit_logs.action
audit_logs.resource_type
audit_logs.resource_id
audit_logs.timestamp
audit_logs.correlation_id
```

 Os índices devem ser escolhidos com base nos padrões reais de consulta.

---

 # 61\. Consistência

 A criação do AuditLog deve respeitar a consistência necessária para ações críticas.

 Exemplo:

```
Admin changes role
       ↓
Role updated
       +
AuditLog created
       ↓
Commit
```

 Se uma operação crítica não puder ser auditada de forma consistente, o comportamento deverá estar documentado.

---

 # 62\. Correlação

 As operações devem poder ser relacionadas por:

```
requestId
correlationId
eventId
```

 Isso permitirá futuramente conectar:

```
Request
 ↓
Domain Event
 ↓
Audit
 ↓
Notification
 ↓
External Provider
```

 sem colocar informações sensíveis nos identificadores.

---

 # 63\. Tratamento de erros

 Os erros devem ser classificados.

 Exemplos:

```
AUDIT_WRITE_FAILED
NOTIFICATION_PROVIDER_UNAVAILABLE
NOTIFICATION_INVALID_PAYLOAD
NOTIFICATION_UNAUTHORIZED
AUDIT_UNAUTHORIZED
PRIVACY_ACCESS_DENIED
```

 Os códigos reais devem seguir o padrão do projeto.

---

 # 64\. Logs técnicos

 Logs técnicos podem registrar:

```
eventId
correlationId
errorCode
component
timestamp
```

 Evitar registrar:

```
password
token
secret
authorization header
full personal payload
```

---

 # 65\. Performance

 A implementação não deve introduzir consultas desnecessárias em operações comuns.

 Especialmente:

```
cada request
    ↓
várias queries de auditoria
```

 deve ser evitado.

 A auditoria deve ser integrada de maneira eficiente e previsível.

---

 # 66\. Concorrência

 Validar cenários como:

 - dois eventos simultâneos;
- duas ações administrativas simultâneas;
- notificações duplicadas;
- reprocessamento de eventos.

 A persistência deve possuir constraints necessárias para impedir duplicação indevida.

---

 # 67\. Segurança administrativa

 Somente usuários autorizados devem conseguir:

 - consultar auditoria;
- filtrar auditoria;
- visualizar metadata;
- acessar informações administrativas.

 A permissão deve ser verificada no backend.

---

 # 68\. Testes de regressão

 Garantir que TASK-003 continue funcionando:

 - [ ] login;
- [ ] logout;
- [ ] sessão;
- [ ] recuperação;
- [ ] RBAC;
- [ ] ownership;
- [ ] proteção administrativa.

 TASK-004 não pode quebrar os mecanismos de identidade.

---

 # 69\. Quality Gate

 A TASK somente pode avançar se:

```
BUILD                  = PASS
LINT                   = PASS
TYPECHECK              = PASS
UNIT TESTS             = PASS
INTEGRATION TESTS      = PASS
API TESTS              = PASS
SECURITY TESTS         = PASS
PRIVACY TESTS          = PASS
AUDIT TESTS            = PASS
NOTIFICATION TESTS     = PASS
AUTHORIZATION TESTS    = PASS
REGRESSION TESTS       = PASS
DOCUMENTATION          = PASS
SCOPE                  = PASS
```

---

 # 70\. Definition of Done

 TASK-004 somente poderá ser marcada como `DONE` quando:

 - [ ] AuditLog implementado.
- [ ] Persistência de auditoria implementada.
- [ ] Eventos relevantes definidos.
- [ ] Ações administrativas auditáveis.
- [ ] Controle de acesso aos logs implementado.
- [ ] Paginação implementada quando aplicável.
- [ ] Sanitização implementada.
- [ ] Dados sensíveis protegidos.
- [ ] Política de retenção documentada ou explicitamente marcada como pendente.
- [ ] Nenhuma exclusão automática não aprovada.
- [ ] Abstração de notificações implementada.
- [ ] Adapter mock implementado.
- [ ] Eventos de notificação definidos.
- [ ] Falhas tratadas.
- [ ] Idempotência avaliada.
- [ ] Nenhuma integração externa real não aprovada.
- [ ] Testes unitários passam.
- [ ] Testes de integração passam.
- [ ] Testes de API passam.
- [ ] Testes de segurança passam.
- [ ] Testes de privacidade passam.
- [ ] Regressão de TASK-003 passa.
- [ ] Build passa.
- [ ] Lint passa.
- [ ] Type check passa.
- [ ] Documentação atualizada.
- [ ] TASKS.md atualizado.
- [ ] Nenhuma funcionalidade comercial foi antecipada.

---

 # 71\. Evidências obrigatórias

 Registrar:

```
BUILD:
PASS

LINT:
PASS

TYPECHECK:
PASS

UNIT:
X/X PASS

INTEGRATION:
X/X PASS

API:
X/X PASS

SECURITY:
PASS

PRIVACY:
PASS

AUDIT:
PASS

NOTIFICATIONS:
PASS

AUTHORIZATION:
PASS

REGRESSION:
PASS
```

---

 # 72\. Matriz de acesso

 | Recurso | Customer | Admin sem permission | Admin autorizado |
| --- | --- | --- | --- |
| Próprios dados permitidos | ✅ | Conforme identidade | ✅ |
| Auditoria | ❌ | ❌ | ✅ |
| Metadata administrativa | ❌ | ❌ | Conforme permission |
| Alterar AuditLog | ❌ | ❌ | ❌ |
| Excluir AuditLog | ❌ | ❌ | ❌ |

A matriz final deve seguir o RBAC definido na TASK-003.

---

 # 73\. Riscos

 | ID | Risco | Impacto | Mitigação | Status |
| --- | --- | --- | --- | --- |
| RISK-001 | Logs contendo segredos | Crítico | Sanitização centralizada | OPEN |
| RISK-002 | Auditoria acessível a usuário comum | Crítico | RBAC server-side | OPEN |
| RISK-003 | Retenção indefinida sem decisão | Alto | Registrar como PENDING | OPEN |
| RISK-004 | Acoplamento a provider | Alto | Notification Port | OPEN |
| RISK-005 | Notificação duplicada | Médio/Alto | Idempotência | OPEN |
| RISK-006 | Falha silenciosa de auditoria | Alto | Estratégia explícita | OPEN |
| RISK-007 | Coleta excessiva de dados | Alto | Minimização | OPEN |

---

 # 74\. Pendências

 Toda decisão não aprovada deve permanecer explícita:

```
ID:
Descrição:
Impacto:
Decisão necessária:
Responsável:
Status:
```

 Exemplo:

```
BLOCKER-001

Descrição:
Política definitiva de retenção de auditoria não aprovada.

Impacto:
Não permite implementar exclusão automática.

Decisão:
Definir período e regra de retenção.

Status:
PENDING
```

---

 # 75\. Rastreabilidade

 | Referência | Tipo | Evidência |
| --- | --- | --- |
| RF-023 | Funcional | \[ \] |
| RF-024 | Funcional | \[ \] |
| RF-026 | Funcional | \[ \] |
| RNF-006 | Segurança/Privacidade | \[ \] |
| RNF-007 | Privacidade | \[ \] |
| RNF-008 | Segurança | \[ \] |
| TASK-003 | Dependência | \[ \] |

---

 # 76\. Checklist final de auditoria

 - [ ] Toda ação crítica identificada.
- [ ] Actor identificável.
- [ ] Timestamp confiável.
- [ ] Resource identificável.
- [ ] Result registrado.
- [ ] CorrelationId disponível.
- [ ] Dados sensíveis sanitizados.
- [ ] Acesso protegido.
- [ ] Logs não podem ser alterados pelo usuário.
- [ ] Logs não podem ser apagados sem política.
- [ ] Retenção documentada.
- [ ] Consultas paginadas.

---

 # 77\. Checklist final de privacidade

 - [ ] Minimização aplicada.
- [ ] Dados pessoais identificados.
- [ ] Dados sensíveis identificados.
- [ ] Responses sanitizadas.
- [ ] Logs sanitizados.
- [ ] Controle de acesso implementado.
- [ ] Dados de terceiros não expostos.
- [ ] Retenção documentada.
- [ ] Exclusão não inventada.
- [ ] Integrações externas não aprovadas não utilizadas.

---

 # 78\. Checklist final de notificações

 - [ ] Interface definida.
- [ ] Eventos definidos.
- [ ] Payload definido.
- [ ] Provider desacoplado.
- [ ] Mock disponível.
- [ ] Erros tratados.
- [ ] Idempotência avaliada.
- [ ] Dados sensíveis protegidos.
- [ ] Nenhuma credencial real no código.
- [ ] Nenhum provider não aprovado integrado.

---

 # 79\. Saída esperada

 Ao concluir:

```
TASK-004
Status: DONE

Audit: PASS
Audit Authorization: PASS
Audit Sanitization: PASS
Privacy: PASS
Data Protection: PASS
Notifications Abstraction: PASS
Notification Mock: PASS
Event Contracts: PASS
Security: PASS
Unit Tests: PASS
Integration Tests: PASS
API Tests: PASS
Regression: PASS
Documentation: PASS
Architecture: PASS
Scope: PASS
```

---

 # 80\. Regra final

 TASK-004 deve estabelecer uma fundação **auditável, privada e desacoplada** sem antecipar decisões comerciais, jurídicas ou de infraestrutura.

 O princípio arquitetural central é:

```
AÇÃO
  ↓
EVENTO
  ├──────────────→ AUDITORIA
  │
  └──────────────→ NOTIFICAÇÃO
                         ↓
                  ABSTRAÇÃO / PORT
                         ↓
                      ADAPTER
                         ↓
                  PROVIDER APROVADO
```

 A auditoria deve registrar o necessário, mas nunca transformar logs em depósito de dados sensíveis.

 A privacidade deve ser aplicada por minimização, controle de acesso e proteção de dados.

 Notificações devem depender de contratos internos, nunca de um fornecedor externo diretamente.

 Qualquer política de retenção, exclusão, canal de comunicação ou integração externa ainda não aprovada deve permanecer explicitamente marcada como **PENDING**, sem ser inventada durante a implementação.