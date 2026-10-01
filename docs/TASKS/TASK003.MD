# TASK-003 — Identidade, autenticação e autorização

 ## 1\. Identificação

 - **ID:** TASK-003
- **Título:** Identidade, autenticação e autorização
- **Status:** BLOCKED
- **Phase:** PHASE-01
- **Priority:** CRITICAL
- **Tipo:** Identity / Authentication / Authorization / Security / Backend
- **Dependência:** TASK-001
- **Bloqueia:** TASK-004 e TASK-005
- **Relacionados:** RF-001, RN-001, RN-002, RNF-004, RNF-005, UC-001, ADR-004

---

 # 2\. Objetivo

 Implementar a fundação de identidade do Tropa Fight, permitindo identificar usuários, autenticar suas credenciais, manter sessões, recuperar acesso e controlar autorização por papéis e permissões.

 A implementação deverá estabelecer uma base segura e reutilizável para todas as funcionalidades futuras que dependam de identidade.

 Ao final desta TASK, o sistema deverá possuir:

 - cadastro de usuário;
- autenticação;
- logout;
- gerenciamento de sessão;
- recuperação de acesso;
- perfil básico;
- distinção entre Customer e AdminUser;
- roles;
- permissions;
- autorização;
- proteção de recursos;
- proteção específica de rotas administrativas;
- persistência adequada das informações de identidade;
- testes unitários, integração e API;
- tratamento seguro de credenciais.

---

 # 3\. Regra principal de escopo

 Esta TASK implementa **identidade e controle de acesso**, não funcionalidades comerciais.

 A existência de um usuário autenticado não significa que ele possa acessar catálogo, pedidos, pagamentos ou outras funcionalidades ainda não implementadas.

 A autorização deve fornecer a fundação necessária para essas funcionalidades futuras sem implementá-las.

---

 # 4\. Dependências

 ## Dependência obrigatória

```
TASK-001
    ↓
TASK-003
```

 TASK-001 deve estar `DONE`.

---

 # 5\. Bloqueio atual

 Status inicial:

```
BLOCKED
```

 O bloqueio está relacionado às decisões de identidade/autenticação ainda dependentes da aprovação correspondente, especialmente:

 - estratégia de autenticação;
- mecanismo de sessão/token;
- estratégia de recuperação de acesso;
- definição final de roles/permissions;
- ADR-004.

 A implementação não deve transformar uma decisão pendente em uma decisão arquitetural permanente.

---

 # 6\. Condição para desbloqueio

 Antes de iniciar a implementação, confirmar:

 - [ ] TASK-001 está DONE.
- [ ] ADR-004 está aprovado ou possui decisões suficientemente definidas para implementação.
- [ ] Estratégia de autenticação está definida.
- [ ] Estratégia de sessão está definida.
- [ ] Estratégia de recuperação de acesso está definida.
- [ ] Roles iniciais estão definidas.
- [ ] Permissions iniciais estão definidas.
- [ ] Regras de segurança estão aprovadas.
- [ ] Política de senha está definida.
- [ ] Política de expiração de sessão está definida ou explicitamente pendente.

---

 # 7\. Referências

 ## Requisitos funcionais

 - RF-001

 ## Regras de negócio

 - RN-001
- RN-002

 ## Requisitos não funcionais

 - RNF-004
- RNF-005

 ## Caso de uso

 - UC-001

 ## Arquitetura

 - ADR-004

---

 # 8\. Escopo

 ## 8.1 Incluído

 - User;
- Customer;
- AdminUser;
- cadastro;
- autenticação;
- logout;
- sessão;
- perfil;
- alteração de dados permitidos;
- recuperação de acesso;
- redefinição de senha;
- roles;
- permissions;
- RBAC;
- guards;
- autorização;
- proteção de endpoints;
- persistência;
- validação de credenciais;
- segurança de senha;
- testes.

---

 # 9\. Explicitamente fora do escopo

 Não implementar:

 - catálogo;
- produto;
- categoria;
- marca;
- estoque;
- carrinho;
- checkout;
- pedido;
- pagamento;
- cupons;
- promoções;
- avaliações;
- favoritos;
- notificações comerciais;
- integrações externas não aprovadas;
- OAuth/social login sem decisão explícita;
- MFA sem requisito aprovado;
- SSO sem requisito aprovado;
- sistema de organizações/tenants;
- sistema social;
- chat;
- permissões comerciais específicas ainda não definidas.

---

 # 10\. ALLOWED\_CHANGES

 Permitido alterar:

```
src/modules/identity/**
src/modules/auth/**
src/modules/authorization/**
src/modules/users/**
persistência correspondente
tests/**
configuração necessária
documentação
TASKS.md
```

 A estrutura exata deverá respeitar a arquitetura criada na TASK-001.

---

 # 11\. FORBIDDEN\_CHANGES

 É proibido:

 - armazenar senha em texto puro;
- armazenar tokens de recuperação em texto puro quando a arquitetura exigir hash;
- registrar credenciais em logs;
- criar bypass de autorização;
- permitir acesso administrativo somente por esconder rota;
- confiar em role enviada pelo cliente;
- implementar funcionalidades comerciais;
- criar permissões sem necessidade;
- alterar RBAC sem rastreabilidade;
- adicionar provedor de identidade não aprovado;
- inserir credenciais reais no código;
- desabilitar controles de segurança para facilitar testes;
- criar administrador padrão inseguro;
- deixar endpoints administrativos sem proteção.

---

 # 12\. Modelo conceitual

 O modelo inicial deve distinguir:

```
User
 ├── Customer
 └── AdminUser
```

 E autorização:

```
User
  ↓
Role
  ↓
Permission
```

 Exemplo conceitual:

```
AdminUser
    ↓
ADMIN
    ↓
catalog.read
catalog.write
orders.read
users.manage
```

 Os nomes definitivos devem seguir as decisões aprovadas no ADR-004.

---

 # 13\. Entidade User

 ## Responsabilidade

 Representar a identidade base do usuário.

 Campos mínimos esperados:

 | Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| id | UUID | Sim | Identificador único |
| email | string | Sim | Único |
| passwordHash | string | Sim | Nunca senha em texto puro |
| status | enum | Sim | Estado da conta |
| createdAt | datetime | Sim | Auditoria |
| updatedAt | datetime | Sim | Auditoria |

Outros campos somente devem ser adicionados quando justificados.

---

 # 14\. Status de usuário

 Definir um enum equivalente a:

```
ACTIVE
INACTIVE
SUSPENDED
PENDING
```

 Os estados exatos dependem das regras aprovadas.

 Cada transição deve ser documentada.

 Exemplo:

```
PENDING
   ↓
ACTIVE

ACTIVE
   ↓
SUSPENDED

SUSPENDED
   ↓
ACTIVE
```

 Não implementar estados não necessários.

---

 # 15\. Customer

 Representa a identidade de um cliente da aplicação.

 Deve permitir posteriormente associação com:

 - endereços;
- carrinho;
- pedidos;
- favoritos;
- avaliações.

 Esses módulos não devem ser implementados nesta TASK.

 O vínculo deve ser arquiteturalmente possível sem criar dependências desnecessárias.

---

 # 16\. AdminUser

 Representa um usuário com acesso administrativo.

 Deve possuir:

 - identidade;
- status;
- roles;
- permissions derivadas das roles;
- controles de acesso apropriados.

 Um `AdminUser` não deve ser criado automaticamente sem mecanismo seguro e autorizado.

---

 # 17\. Roles

 As roles devem representar conjuntos de permissões.

 Exemplo conceitual:

```
CUSTOMER
ADMIN
```

 Se houver outras roles aprovadas, documentá-las explicitamente.

 Não criar dezenas de roles antecipadamente.

---

 # 18\. Permissions

 As permissions devem representar capacidades específicas.

 Formato recomendado:

```
resource.action
```

 Exemplos:

```
users.read
users.manage
catalog.read
catalog.write
orders.read
```

 Nesta TASK, somente permissions relacionadas à identidade/autorização devem ser necessárias.

 Permissions comerciais devem ser introduzidas pelas respectivas tasks quando os módulos existirem.

---

 # 19\. RBAC

 O sistema deve utilizar uma estrutura equivalente a:

```
User
  ↓
Role
  ↓
Permission
  ↓
Protected Resource
```

 A autorização deve ocorrer no servidor.

 Nunca confiar em:

```
role
permission
isAdmin
```

 enviados pelo cliente.

---

 # 20\. Cadastro

 ## Caso de uso

```
UC-001-A — Registrar usuário
```

 ### Pré-condições

 - email válido;
- senha válida;
- dados obrigatórios válidos.

 ### Fluxo

 1. Receber dados.
2. Validar formato.
3. Normalizar email conforme regra definida.
4. Verificar unicidade.
5. Aplicar política de senha.
6. Gerar hash.
7. Criar usuário.
8. Persistir.
9. Retornar resultado seguro.

 Nunca retornar:

 - senha;
- passwordHash;
- tokens internos;
- informações sensíveis.

---

 # 21\. Unicidade do email

 O sistema deve garantir que não existam dois usuários ativos com o mesmo identificador de login.

 A proteção deve existir:

 - na aplicação;
- e, quando aplicável, na persistência.

 O banco não deve depender somente de uma verificação anterior feita pela aplicação para garantir unicidade.

---

 # 22\. Política de senha

 Definir e implementar os requisitos aprovados.

 Exemplos de critérios possíveis:

 - tamanho mínimo;
- tamanho máximo;
- rejeição de senha vazia;
- normalização apropriada;
- proteção contra credenciais obviamente inválidas.

 Não inventar requisitos excessivos sem decisão.

---

 # 23\. Hash de senha

 Senhas devem ser transformadas em hash utilizando mecanismo apropriado para armazenamento de senha.

 A aplicação nunca deve armazenar:

```
password = "..."
```

 Deve armazenar somente:

```
passwordHash = "..."
```

 A função de hash deve possuir configuração segura e compatível com a stack aprovada.

---

 # 24\. Login

 ## Caso de uso

```
UC-001-B — Autenticar usuário
```

 ### Fluxo

 1. Receber credenciais.
2. Validar formato.
3. Localizar usuário.
4. Verificar status.
5. Comparar senha com hash.
6. Criar sessão/token conforme arquitetura aprovada.
7. Retornar resposta segura.

---

 # 25\. Falha de autenticação

 Falhas de autenticação não devem revelar informações desnecessárias.

 Evitar respostas que permitam distinguir facilmente:

```
email inexistente
```

 de:

```
senha incorreta
```

 quando isso criar risco de enumeração de contas.

---

 # 26\. Sessões

 Definir:

 - identificador;
- criação;
- expiração;
- revogação;
- renovação;
- logout;
- invalidação.

 Modelo conceitual:

```
User
 ↓
Session
 ↓
Authenticated Request
```

---

 # 27\. Expiração

 A sessão deve possuir política explícita de:

 - expiração;
- renovação;
- invalidação;
- encerramento.

 Valores específicos devem vir da decisão aprovada.

---

 # 28\. Logout

 O logout deve invalidar a sessão de acordo com o mecanismo escolhido.

 Não considerar simplesmente:

```
"o cliente apagou o token"
```

 como mecanismo suficiente quando houver sessão controlada pelo servidor.

---

 # 29\. Recuperação de acesso

 ## Caso de uso

```
UC-001-C — Recuperar acesso
```

 Fluxo conceitual:

```
Solicitação
    ↓
Validação
    ↓
Token temporário
    ↓
Redefinição
    ↓
Nova senha
    ↓
Invalidação de credenciais/sessões conforme política
```

---

 # 30\. Token de recuperação

 O token deve:

 - possuir validade limitada;
- ser de uso controlado;
- não ser reutilizável quando a política exigir;
- ser protegido contra exposição;
- ser invalidado após uso.

 Quando persistido, deve-se avaliar o armazenamento seguro do token, evitando guardar o valor utilizável em texto puro.

---

 # 31\. Redefinição de senha

 Ao redefinir a senha:

 1. validar token;
2. validar expiração;
3. validar nova senha;
4. gerar novo hash;
5. invalidar token;
6. aplicar política de sessão aprovada;
7. registrar evento relevante sem expor segredo.

---

 # 32\. Perfil

 Usuário autenticado deve poder consultar seu próprio perfil.

 Exemplo:

```
GET /me
```

 Resposta não deve conter:

```
passwordHash
internal secrets
recovery tokens
session secrets
```

---

 # 33\. Atualização de perfil

 O usuário pode alterar somente os dados permitidos.

 Separar claramente:

```
Self-service
```

 de:

```
Administrative user management
```

 A administração de usuários será aprofundada em TASK-019.

---

 # 34\. Autorização

 Criar mecanismo reutilizável equivalente a:

```
authenticate()
authorize(permission)
```

 ou equivalente à stack.

 Fluxo:

```
Request
 ↓
Authentication
 ↓
User identity
 ↓
Authorization
 ↓
Permission check
 ↓
Handler
```

---

 # 35\. Guards

 Recursos protegidos devem possuir guards/middleware/interceptors conforme a arquitetura.

 Deve existir distinção entre:

```
Unauthenticated
```

 e:

```
Authenticated but unauthorized
```

---

 # 36\. Respostas de autorização

 Casos esperados:

```
401 → não autenticado
403 → autenticado, mas sem autorização
```

 Não utilizar `403` indiscriminadamente para ausência de autenticação.

---

 # 37\. Rotas administrativas

 Toda rota administrativa deve exigir:

 1. autenticação;
2. role/permission apropriada;
3. validação no servidor.

 Não utilizar somente uma validação de frontend.

---

 # 38\. Proteção contra privilege escalation

 O sistema deve impedir que um usuário:

 - altere sua própria role;
- adicione permissions a si mesmo;
- altere `isAdmin`;
- modifique outro usuário sem permissão;
- manipule IDs para acessar recursos administrativos;
- utilize dados do request para elevar privilégio.

---

 # 39\. Ownership

 Quando um recurso pertence ao próprio usuário, a aplicação deve verificar ownership.

 Modelo:

```
Authenticated User
       ↓
Resource Owner
       ↓
Access granted
```

 Não confiar somente no ID fornecido pelo cliente.

---

 # 40\. API

 A API deverá possuir contratos equivalentes aos seguintes.

 ## Cadastro

```
POST /auth/register
```

 ## Login

```
POST /auth/login
```

 ## Logout

```
POST /auth/logout
```

 ## Sessão atual

```
GET /auth/session
```

 ou:

```
GET /me
```

 conforme a arquitetura.

 ## Recuperação

```
POST /auth/forgot-password
```

 ## Redefinição

```
POST /auth/reset-password
```

 ## Perfil

```
GET /me
```

 Os endpoints definitivos devem respeitar a convenção estabelecida no projeto.

---

 # 41\. Contrato de cadastro

 ### Request

```
{
  "email": "user@example.com",
  "password": "..."
}
```

 ### Response

 Não retornar senha ou hash.

 Exemplo:

```
{
  "user": {
    "id": "...",
    "email": "...",
    "status": "ACTIVE"
  }
}
```

---

 # 42\. Contrato de login

 ### Request

```
{
  "email": "user@example.com",
  "password": "..."
}
```

 ### Response

 Depende da estratégia aprovada de sessão.

 Nunca retornar:

 - passwordHash;
- segredo interno;
- token de recuperação;
- dados desnecessários.

---

 # 43\. Contrato de recuperação

 ### Request

```
{
  "email": "user@example.com"
}
```

 A resposta deve evitar revelar se a conta existe quando isso representar risco de enumeração.

---

 # 44\. Persistência

 Criar somente as estruturas necessárias para identidade.

 Modelo conceitual:

```
users
sessions
roles
permissions
user_roles
role_permissions
password_reset_tokens
```

 Nem todas precisam existir como tabelas separadas se a arquitetura aprovada utilizar outro modelo.

---

 # 45\. Constraints

 A persistência deve garantir, quando aplicável:

 - email único;
- IDs únicos;
- integridade referencial;
- sessões associadas a usuários válidos;
- roles válidas;
- permissions válidas;
- tokens de recuperação controlados.

---

 # 46\. Índices

 Criar índices para consultas essenciais, por exemplo:

```
users.email
sessions.user_id
sessions.expires_at
password_reset_tokens.user_id
password_reset_tokens.expires_at
```

 Os índices reais devem refletir o modelo implementado.

---

 # 47\. Transações

 Operações que exigem consistência devem ser transacionais.

 Exemplos:

```
criação de usuário + associações iniciais
alteração de senha
criação/invalidação de sessão
atribuição de roles
```

 A necessidade exata depende do modelo.

---

 # 48\. Auditoria

 TASK-004 será responsável pela fundação completa de auditoria.

 Nesta TASK:

 - não implementar um sistema completo de AuditLog;
- somente emitir eventos/interfaces necessários se a arquitetura exigir;
- não registrar senha ou token;
- não criar dependência circular com o módulo de auditoria.

---

 # 49\. Segurança

 ## Obrigatório

 - [ ] Senha nunca armazenada em texto puro.
- [ ] Password hash seguro.
- [ ] Tokens protegidos.
- [ ] Sessões expiradas.
- [ ] Logout funcional.
- [ ] Recuperação com validade.
- [ ] Authorization no servidor.
- [ ] Rotas administrativas protegidas.
- [ ] Ownership validado.
- [ ] Secrets não aparecem nos logs.
- [ ] Respostas não expõem dados internos.

---

 # 50\. Rate limiting

 Se previsto pelo ADR-004 ou infraestrutura aprovada, aplicar proteção especialmente em:

```
/login
/register
/forgot-password
/reset-password
```

 Caso ainda não esteja definido:

```
RATE_LIMITING = PENDING
```

 Não implementar uma solução complexa sem decisão.

---

 # 51\. Proteção contra brute force

 O mecanismo aprovado deve considerar:

 - limitação de tentativas;
- atraso progressivo ou bloqueio quando aplicável;
- monitoramento;
- não exposição de credenciais.

 Os parâmetros devem ser definidos pela política aprovada.

---

 # 52\. Proteção contra enumeração

 Avaliar principalmente:

 - login;
- recuperação de senha;
- cadastro.

 Respostas devem evitar revelar informações desnecessárias sobre existência de contas.

---

 # 53\. Segurança de sessão

 Validar:

 - expiração;
- revogação;
- rotação quando aplicável;
- armazenamento;
- transporte;
- proteção contra reutilização indevida.

 A solução exata depende do mecanismo de sessão aprovado.

---

 # 54\. Testes unitários

 Criar testes para:

 ### User

 - [ ] criação válida;
- [ ] email inválido;
- [ ] estado inválido;
- [ ] invariantes.

 ### Password

 - [ ] hash;
- [ ] comparação;
- [ ] senha inválida;
- [ ] senha não aparece em objetos persistidos.

 ### Authentication

 - [ ] credencial válida;
- [ ] credencial inválida;
- [ ] usuário inexistente;
- [ ] usuário suspenso;
- [ ] sessão criada.

 ### Authorization

 - [ ] permission concedida;
- [ ] permission negada;
- [ ] role correta;
- [ ] role insuficiente.

 ### Recovery

 - [ ] token válido;
- [ ] token expirado;
- [ ] token inválido;
- [ ] token reutilizado;
- [ ] redefinição bem-sucedida.

---

 # 55\. Testes de integração

 Validar:

 - [ ] cadastro + persistência;
- [ ] login + sessão;
- [ ] logout + invalidação;
- [ ] recuperação + redefinição;
- [ ] roles;
- [ ] permissions;
- [ ] guards;
- [ ] ownership;
- [ ] constraints.

---

 # 56\. Testes de API

 ## Cadastro

 - [ ] sucesso;
- [ ] email inválido;
- [ ] senha inválida;
- [ ] email duplicado;
- [ ] payload inválido.

 ## Login

 - [ ] sucesso;
- [ ] senha incorreta;
- [ ] usuário inexistente;
- [ ] usuário bloqueado/suspenso;
- [ ] payload inválido.

 ## Logout

 - [ ] sessão válida;
- [ ] sessão inexistente;
- [ ] sessão já invalidada.

 ## Recuperação

 - [ ] solicitação válida;
- [ ] token inválido;
- [ ] token expirado;
- [ ] redefinição válida;
- [ ] redefinição inválida.

 ## Autorização

 - [ ] sem autenticação → 401;
- [ ] sem permission → 403;
- [ ] permission correta → acesso permitido.

---

 # 57\. Testes de segurança

 Validar pelo menos:

 - [ ] senha não aparece em resposta;
- [ ] passwordHash não aparece em resposta;
- [ ] token de recuperação não aparece em logs;
- [ ] role não pode ser alterada pelo cliente;
- [ ] permission não pode ser alterada pelo cliente;
- [ ] usuário não acessa perfil de outro usuário sem autorização;
- [ ] endpoint administrativo exige autorização;
- [ ] credencial inválida não cria sessão;
- [ ] sessão expirada é rejeitada.

---

 # 58\. Testes E2E

 Fluxo mínimo:

```
Cadastro
   ↓
Login
   ↓
Sessão autenticada
   ↓
Consulta perfil
   ↓
Logout
   ↓
Sessão inválida
```

 Fluxo de recuperação:

```
Solicitar recuperação
   ↓
Token
   ↓
Redefinir senha
   ↓
Login com nova senha
```

 Fluxo administrativo:

```
Usuário sem permissão
        ↓
      403

Admin autorizado
        ↓
      acesso
```

---

 # 59\. Critérios de aceitação

 ## AC-001 — Cadastro

 **Dado** um usuário com dados válidos,

 **Quando** solicitar cadastro,

 **Então** o sistema deverá criar a identidade sem armazenar a senha em texto puro.

---

 ## AC-002 — Email duplicado

 **Dado** um email já cadastrado,

 **Quando** outro cadastro utilizar o mesmo email,

 **Então** a operação deverá ser rejeitada.

---

 ## AC-003 — Login

 **Dado** um usuário ativo com credenciais válidas,

 **Quando** realizar login,

 **Então** uma sessão válida deverá ser criada conforme a arquitetura aprovada.

---

 ## AC-004 — Credencial inválida

 **Dado** credenciais inválidas,

 **Quando** realizar login,

 **Então** a autenticação deverá ser rejeitada sem criar uma sessão válida.

---

 ## AC-005 — Logout

 **Dado** uma sessão válida,

 **Quando** realizar logout,

 **Então** a sessão deverá ser invalidada.

---

 ## AC-006 — Sessão expirada

 **Dado** uma sessão expirada,

 **Quando** acessar um recurso protegido,

 **Então** o acesso deverá ser rejeitado.

---

 ## AC-007 — Perfil

 **Dado** um usuário autenticado,

 **Quando** consultar seu perfil,

 **Então** deverá receber somente os dados autorizados.

---

 ## AC-008 — Ownership

 **Dado** um usuário autenticado,

 **Quando** tentar acessar recurso pertencente a outro usuário sem permissão,

 **Então** o acesso deverá ser rejeitado.

---

 ## AC-009 — Recuperação

 **Dado** um token de recuperação válido,

 **Quando** redefinir a senha,

 **Então** a nova senha deverá ser armazenada de forma segura.

---

 ## AC-010 — Token expirado

 **Dado** um token de recuperação expirado,

 **Quando** tentar redefinir a senha,

 **Então** a operação deverá ser rejeitada.

---

 ## AC-011 — Role

 **Dado** um usuário com uma determinada role,

 **Quando** acessar recurso autorizado para essa role,

 **Então** o acesso deverá ser permitido.

---

 ## AC-012 — Permission insuficiente

 **Dado** um usuário autenticado sem a permission necessária,

 **Quando** acessar recurso protegido,

 **Então** deverá receber `403`.

---

 ## AC-013 — Não autenticado

 **Dado** um usuário não autenticado,

 **Quando** acessar recurso protegido,

 **Então** deverá receber `401`.

---

 ## AC-014 — Administração

 **Dado** um recurso administrativo,

 **Quando** um usuário sem autorização tentar acessá-lo,

 **Então** o acesso deverá ser rejeitado.

---

 ## AC-015 — Escalada de privilégio

 **Dado** um usuário comum,

 **Quando** tentar alterar sua própria role ou permission através do request,

 **Então** a alteração deverá ser rejeitada.

---

 # 60\. Quality Gate

 A TASK somente pode ser concluída quando:

```
BUILD                    = PASS
LINT                     = PASS
TYPECHECK                = PASS
UNIT_TESTS               = PASS
INTEGRATION_TESTS        = PASS
API_TESTS                = PASS
E2E_AUTH_TESTS           = PASS
SECURITY_TESTS           = PASS
AUTHENTICATION           = PASS
AUTHORIZATION            = PASS
SESSION                  = PASS
PASSWORD_SECURITY        = PASS
RECOVERY                 = PASS
ARCHITECTURE             = PASS
DOCUMENTATION            = PASS
SCOPE                    = PASS
```

---

 # 61\. Definition of Done

 TASK-003 somente poderá ser marcada como `DONE` quando:

 - [ ] Cadastro implementado.
- [ ] Login implementado.
- [ ] Logout implementado.
- [ ] Sessões implementadas.
- [ ] Recuperação de acesso implementada.
- [ ] Redefinição de senha implementada.
- [ ] Perfil implementado.
- [ ] User implementado.
- [ ] Customer implementado.
- [ ] AdminUser implementado.
- [ ] Roles implementadas.
- [ ] Permissions implementadas.
- [ ] RBAC implementado.
- [ ] Guards implementados.
- [ ] Rotas administrativas protegidas.
- [ ] Ownership validado.
- [ ] Senhas armazenadas somente como hash.
- [ ] Nenhum segredo aparece em logs.
- [ ] Testes unitários passam.
- [ ] Testes de integração passam.
- [ ] Testes de API passam.
- [ ] Testes E2E passam.
- [ ] Testes de segurança passam.
- [ ] Build passa.
- [ ] Lint passa.
- [ ] Type check passa.
- [ ] Documentação atualizada.
- [ ] ADR-004 atualizado.
- [ ] TASKS.md atualizado.
- [ ] Nenhuma funcionalidade comercial foi implementada.
- [ ] Nenhum bypass de autorização existe.
- [ ] Nenhuma alteração fora do escopo foi realizada.

---

 # 62\. Evidências obrigatórias

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

E2E:
X/X PASS

SECURITY:
PASS

AUTHENTICATION:
PASS

AUTHORIZATION:
PASS

SESSION:
PASS

PASSWORD:
PASS

RECOVERY:
PASS
```

---

 # 63\. Matriz de autorização

 Registrar a matriz final:

 | Recurso | CUSTOMER | ADMIN | OUTROS |
| --- | --- | --- | --- |
| Próprio perfil | ✅ | ✅ | \[ \] |
| Alterar próprio perfil | ✅ | ✅ | \[ \] |
| Recursos administrativos | ❌ | ✅ | ❌ |
| Gerenciar roles | ❌ | \[conforme permission\] | ❌ |
| Gerenciar usuários | ❌ | \[conforme permission\] | ❌ |

As permissões finais devem refletir o ADR-004.

---

 # 64\. Matriz de estados

 ## Usuário

 | Estado | Login | Perfil | Admin |
| --- | --- | --- | --- |
| PENDING | \[ \] | \[ \] | ❌ |
| ACTIVE | ✅ | ✅ | Conforme role |
| SUSPENDED | ❌ | \[ \] | Conforme política |
| INACTIVE | ❌ | \[ \] | Conforme política |

Os comportamentos devem ser explicitamente definidos antes do fechamento da TASK.

---

 # 65\. Matriz de erros

 | Situação | HTTP | Regra |
| --- | --- | --- |
| Não autenticado | 401 | Credencial/sessão ausente |
| Sessão inválida | 401 | Sessão rejeitada |
| Sem permission | 403 | Autenticado, mas não autorizado |
| Recurso inexistente | 404 | Não encontrado |
| Email duplicado | 409 | Conflito |
| Input inválido | 400 | Validação |
| Token expirado | 400/401 | Conforme contrato aprovado |

---

 # 66\. Riscos

 | ID | Risco | Impacto | Mitigação | Status |
| --- | --- | --- | --- | --- |
| RISK-001 | Estratégia de sessão indefinida | Alto | Aprovar ADR-004 | OPEN |
| RISK-002 | RBAC incompleto | Alto | Definir permissions mínimas | OPEN |
| RISK-003 | Recuperação insegura | Alto | Token expirável e controlado | OPEN |
| RISK-004 | Enumeração de usuários | Médio/Alto | Respostas uniformes | OPEN |
| RISK-005 | Privilege escalation | Crítico | Authorization server-side | OPEN |

---

 # 67\. Pendências

 Toda pendência deve ser registrada:

```
ID:
Descrição:
Impacto:
Responsável:
Decisão necessária:
Status:
```

 Exemplo:

```
BLOCKER-001

Descrição:
Estratégia definitiva de sessão ainda não aprovada.

Impacto:
Impede implementação definitiva do mecanismo de autenticação.

Responsável:
[Responsável pela decisão]

Status:
OPEN
```

---

 # 68\. Verificação de escopo

 ## ALLOWED\_CHANGES

 - [ ] Alterações somente em identidade/autenticação/autorização.
- [ ] Persistência somente correspondente ao módulo.
- [ ] Testes correspondentes.
- [ ] Configuração necessária.
- [ ] Documentação atualizada.

 ## FORBIDDEN\_CHANGES

 - [ ] Nenhum catálogo.
- [ ] Nenhum carrinho.
- [ ] Nenhum checkout.
- [ ] Nenhum pagamento.
- [ ] Nenhum pedido.
- [ ] Nenhum estoque comercial.
- [ ] Nenhuma integração externa não aprovada.
- [ ] Nenhum secret real.
- [ ] Nenhum bypass de RBAC.

---

 # 69\. Rastreabilidade

 | Referência | Tipo | Implementação/Teste |
| --- | --- | --- |
| RF-001 | Funcional | \[ \] |
| RN-001 | Regra | \[ \] |
| RN-002 | Regra | \[ \] |
| RNF-004 | Segurança | \[ \] |
| RNF-005 | Segurança | \[ \] |
| UC-001 | Caso de uso | \[ \] |
| ADR-004 | Arquitetura | \[ \] |

---

 # 70\. Saída esperada

 Ao concluir:

```
TASK-003
Status: DONE

Identity: PASS
Registration: PASS
Authentication: PASS
Logout: PASS
Sessions: PASS
Recovery: PASS
Password Security: PASS
RBAC: PASS
Authorization: PASS
Ownership: PASS
Security: PASS
Unit Tests: PASS
Integration Tests: PASS
API Tests: PASS
E2E: PASS
Documentation: PASS
Architecture: PASS
Scope: PASS
```

 Após `TASK-003 = DONE`, a TASK-004 poderá avançar conforme suas próprias condições de dependência.

---

 # 71\. Regra final

 TASK-003 deve estabelecer uma **fundação de identidade segura, mínima e reutilizável**.

 A implementação deve seguir o princípio:

```
Identity
   ↓
Authentication
   ↓
Session
   ↓
Authorization
   ↓
Protected Resource
```

 O cliente nunca deve ser a autoridade final sobre identidade, role ou permission.

 Toda autorização deve ser validada no servidor.

 Nenhuma senha deve ser armazenada em texto puro.

 Nenhuma funcionalidade comercial deve ser antecipada.

 Qualquer decisão de segurança ou arquitetura ainda não aprovada deve permanecer explicitamente identificada como pendente, em vez de ser silenciosamente inventada durante a implementação.