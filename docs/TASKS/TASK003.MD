# TASK-003 — Identidade, autenticação e autorização

 ## 1\. Identificação

 - **ID:** TASK-003
- **Título:** Identidade, autenticação e autorização
- **Status:** DONE
- **Phase:** PHASE-01
- **Priority:** CRITICAL
- **Tipo:** Identity / Authentication / Authorization / Security / Backend
- **Dependência:** TASK-001
- **Bloqueia:** TASK-004 e TASK-005
- **Relacionados:** RF-001, RN-001, RN-002, RNF-004, RNF-005, UC-001, ADR-003, ADR-011, ADR-012, ADR-019

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

 As decisões antes pendentes foram aprovadas pelo responsável em 2026-10-22 e registradas nos ADR-003, ADR-011, ADR-012 e ADR-019. O escopo local foi ampliado para esta TASK por autorização explícita; não há autorização para provisionar serviço remoto nem enviar e-mail real.

---

 # 6\. Condição para desbloqueio

 Antes de iniciar a implementação, confirmar:

 - [x] TASK-001 está DONE e seus artefatos existem.
- [x] O escopo Next.js, backend e PostgreSQL local foi aprovado para esta TASK.
- [x] ADR-012 aprovado: autenticação própria no servidor Next.js e política de sessão definida.
- [x] ADR-011 aprovado: papéis e permissões de identidade definidos para esta TASK.
- [x] Recuperação definida: token de uso único por e-mail por porta substituível, validade de 30 minutos e revogação de sessões após redefinição; sem provedor real.
- [x] Cadastro ativa a conta imediatamente; confirmação de e-mail não é exigida nesta TASK.
- [x] Roles definidas: Administrador Geral, Customer e Gestor de Catálogo.
- [x] Permissions desta TASK definidas: Administrador Geral possui todas as permissões de identidade; Customer acessa apenas o próprio perfil; Gestor de Catálogo não recebe permissões de identidade.
- [x] Regras de segurança aprovadas; criação do primeiro Administrador Geral via comando local de uso único.
- [x] Política de senha definida: 8–128 caracteres, com maiúscula, minúscula, número e símbolo.
- [x] Política de sessão definida: registro revogável no PostgreSQL, cookie HttpOnly/Secure/SameSite=Lax, 12 horas, sem renovação.

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

 - ADR-011
- ADR-012

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
app/**
src/modules/identity/**
src/modules/auth/**
src/modules/authorization/**
src/modules/users/**
persistência correspondente
tests/**
configuração/dependências necessárias à migração para Next.js
docs/adr/ADRs.md
docs/architecture/**
README.md
docs/TASKS/TASK003.MD
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

 Os nomes definitivos devem seguir as decisões aprovadas no ADR-011 e no ADR-012, conforme papéis e mecanismos abrangidos.

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

 Se previsto pelas decisões de segurança aprovadas ou infraestrutura aprovada, aplicar proteção especialmente em:

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

 - [x] Cadastro implementado.
- [x] Login implementado.
- [x] Logout implementado.
- [x] Sessões implementadas.
- [x] Recuperação de acesso implementada.
- [x] Redefinição de senha implementada.
- [x] Perfil implementado.
- [x] User implementado.
- [x] Customer implementado.
- [x] AdminUser implementado.
- [x] Roles implementadas.
- [x] Permissions implementadas.
- [x] RBAC implementado.
- [x] Guards implementados.
- [x] Rotas administrativas protegidas.
- [x] Ownership validado.
- [x] Senhas armazenadas somente como hash.
- [x] Nenhum segredo aparece em logs.
- [x] Testes unitários passam.
- [x] Testes de integração passam.
- [x] Testes de API passam.
- [x] Testes E2E passam.
- [x] Testes de segurança passam.
- [x] Build passa.
- [x] Lint passa.
- [x] Type check passa.
- [x] Documentação atualizada.
- [x] ADR-011 e ADR-012 atualizados.
- [x] TASKS.md atualizado.
- [x] Nenhuma funcionalidade comercial foi implementada.
- [x] Nenhum bypass de autorização existe.
- [x] Nenhuma alteração fora do escopo foi realizada.

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

As permissões finais devem refletir o ADR-011.

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
| RISK-001 | Estratégia de sessão indefinida | Alto | Aprovar ADR-012 | OPEN |
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

 # 67.1 Registro de execução e evidências

 - Branch: `feature/TASK-003-identidade-autenticacao`.
 - Decisões: aprovações do responsável registradas em ADR-003, ADR-011, ADR-012 e ADR-019; cadastro ativo imediatamente, sem confirmação de e-mail.
 - Migration: `npm run db:migrate` aplicada com sucesso em PostgreSQL 18 temporário e isolado (porta 55439); serviço existente do computador não foi alterado.
 - Unit: Vitest, 5 arquivos/9 testes aprovados antes dos testes integrados.
 - Integration/API: Vitest com `DATABASE_URL` do banco temporário; 6 arquivos/10 testes aprovados, incluindo registro, login, sessão, logout, perfil, 401/403, recuperação com porta fake, uso único e revogação de sessões.
 - Build/typecheck: `npm run build` aprovado; Next.js gerou as rotas esperadas.
 - Lint: `npm run lint` terminou com código 0; permanece um aviso `react(only-export-components)` em `app/layout.tsx` devido ao export obrigatório `metadata` do Next.js.
 - Format/diff: `npm run format:check` and `git diff --check` passed.
 - Dependências: `npm audit --omit=dev` reportou 0 vulnerabilidades.
 - Pre-condicoes manuais: configure `.env.local` conforme README, inicie PostgreSQL local, execute `npm run db:migrate`, mantenha `npm run dev` ativo e use `http://localhost:3000`. O responsavel executa cada caso. Nao envie senhas ou tokens como evidencia.
 - Casos manuais. Resultados declarados pelo responsável em 2026-10-22 foram registrados sem extrapolar o que foi observado; casos sem confirmação permanecem pendentes:

 | ID | Objetivo e passos | Esperado | Obtido | Evidencia | Status |
 |---|---|---|---|---|---|
 | MAN-001 | Cadastrar novo e-mail e senha conforme politica em `/register`; observar resposta em DevTools > Network. | HTTP 201; ACTIVE; sem senha/hash na resposta; role CUSTOMER. | Responsavel confirmou HTTP 201 e corpo com id, email e status ACTIVE; sem campos de senha ou hash. | Relato do responsavel | PASS |
 | MAN-002 | Cadastrar o mesmo e-mail novamente. | HTTP 409; nenhuma segunda conta. | Responsável confirmou que o cadastro duplicado foi rejeitado. | Relato do responsável | PASS |
 | MAN-003 | Tentar senha incorreta e correta em `/login`; inspecionar cookie. | Senha incorreta: 401, sem sessao. Sucesso: `HttpOnly`, `Secure`, `SameSite=Lax`, cookie de 12h. | Responsavel confirmou login valido e rejeicao de credencial invalida; observou HttpOnly, Secure, SameSite=Lax e expiracao aproximadamente 12h apos o login. | Relato do responsavel | PASS |
 | MAN-004 | Abrir `/profile`, verificar dados proprios, sair e consultar `/api/me`. | Perfil proprio sem hash; logout invalida sessao; `/api/me` retorna 401. | Responsavel confirmou perfil e logout; apos sair, `/api/me` exibiu `Authentication required.`. | Relato do responsavel | PASS |
 | MAN-005 | Consultar `/api/admin/identity/roles` sem sessao e depois como Customer. | Sem sessao: 401; Customer: 403. | Responsavel confirmou 401 sem login e 403 com Customer. | Relato do responsavel | PASS |
 | MAN-006 | Apos o bootstrap, acessar `/api/admin/identity/roles` enquanto admin estiver logado; depois executar `npm run identity:create-admin` novamente. | Endpoint retorna HTTP 200 com CUSTOMER, GENERAL_ADMIN e CATALOG_MANAGER; segunda execucao do bootstrap e recusada. | Responsavel confirmou resposta do endpoint com as tres roles e que o segundo bootstrap foi recusado. | Relato do responsavel | PASS |
 | MAN-007 | Solicitar recuperacao na interface e enviar token invalido para redefinicao. | Resposta generica; token invalido retorna 400; nenhum token na resposta/log. | Responsavel confirmou HTTP 400, resposta sem token e ausencia do token nos logs do servidor. | Relato do responsavel | PASS |

 A redefinicao bem-sucedida e revogacao de sessoes estao cobertas pelo teste de integracao com porta de e-mail fake. Nenhum provedor real de e-mail foi aprovado nesta TASK.
 - GATE-001: prontidão confirmada (TASK-001 DONE e artefatos presentes; decisões aprovadas e registradas).
 - GATE-002: planejamento e escopo autorizados registrados nesta especificação e em ADR-003/011/012/019.
 - GATE-003: implementação e testes de integração/API preparados dentro do escopo autorizado.
 - GATE-004: APROVADO em 2026-10-22: `npm run quality` passou; lint emitiu apenas aviso do export `metadata`. Testes com DATABASE_URL: 6 arquivos/10 testes aprovados. `npm audit --omit=dev`: 0 vulnerabilidades. `git diff --check` passou.
 - GATE-005: APROVADO; MAN-001 a MAN-007 passaram conforme a matriz acima, incluindo cadastro seguro, sessao, RBAC, bootstrap e recuperacao sem exposicao do token.
 - GATE-006: APROVADO em 2026-10-22; Definition of Done, criterios, evidencias, diff, rastreabilidade e Scope Guard revisados.
 - Política de perfil aprovada em 2026-10-22: Customer consulta somente o próprio perfil nesta TASK; edição de perfil fica fora do escopo e foi registrada no ADR-011.
 - Contagem: 6 gates no total; 6 concluidos; 0 pendentes; 0 bloqueados.
 - Status da TASK: `DONE`; Definition of Done PASS. Parar aqui; nao iniciar automaticamente TASK-004.

 # 68\. Verificação de escopo

 ## ALLOWED\_CHANGES

 - [x] Migracao React/Vite para Next.js e configuracoes/dependencias necessarias, autorizadas para esta TASK.
- [x] Modulos de identidade/autenticacao/autorizacao e persistencia PostgreSQL local somente de identidade.
- [x] Testes unitarios, de integracao e API correspondentes.
- [x] ADRs, arquitetura, README e TASKS.md necessarios para registrar as decisoes aprovadas.
 ## FORBIDDEN\_CHANGES

 - [x] Nenhum catálogo.
- [x] Nenhum carrinho.
- [x] Nenhum checkout.
- [x] Nenhum pagamento.
- [x] Nenhum pedido.
- [x] Nenhum estoque comercial.
- [x] Nenhuma integração externa não aprovada.
- [x] Nenhum secret real.
- [x] Nenhum bypass de RBAC.

---

 # 69\. Rastreabilidade

 | Referência | Tipo | Implementação/Teste |
| --- | --- | --- |
| RF-001 | Funcional | \[x\] |
| RN-001 | Regra | \[x\] |
| RN-002 | Regra | \[x\] |
| RNF-004 | Segurança | \[x\] |
| RNF-005 | Segurança | \[x\] |
| UC-001 | Caso de uso | \[x\] |
| ADR-011 | Autorização/RBAC | \[x\] |
| ADR-012 | Autenticação/sessão | \[x\] |

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
